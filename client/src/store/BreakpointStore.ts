import { makeAutoObservable, action } from "mobx"
import Message from "../common/Message";
import FilterStore from "./FilterStore";
import MessageStore from "./MessageStore";

const LOCAL_STORAGE = 'allproxy-breakpoints';

export default class BreakpointStore {
	private breakpointList: FilterStore[] = [];
	private _editing = false;

	public constructor() {
		makeAutoObservable(this);
	}

	@action public editing(editing: boolean) {
		this._editing = editing;
	}

	@action public changed() {
		this.save();
	}

	@action public init() {
		const breakpointListJson = localStorage.getItem(LOCAL_STORAGE);
		if (breakpointListJson) {
			const breakpointList = JSON.parse(breakpointListJson);
			this.breakpointList = breakpointList.map((entry: {
				enabled: boolean,
				searchFilter: string,
				_matchCase: boolean,
				_regex: boolean,
				_logical: boolean }) => {
				const breakpoint = new FilterStore();
				breakpoint.setEnabled(entry.enabled);
				breakpoint.setFilterNoDebounce(entry.searchFilter);
				breakpoint.setRegex(entry._regex);
				breakpoint.setMatchCase(!!entry._matchCase);
				breakpoint.setLogical(!!entry._logical);
				return breakpoint;
			})
		} else {
			this.breakpointList = [];
		}
	}

	@action private save() {
		const breakpointList = this.breakpointList.filter(breakpoint => breakpoint.getFilter().length > 0);
		localStorage.setItem(LOCAL_STORAGE, JSON.stringify(breakpointList));
	}

	public findMatchingBreakpoint(message: Message): FilterStore | null {
		if (this.breakpointList.length === 0 || this._editing) return null;
		for(const breakpoint of this.breakpointList) {
			if(breakpoint.isEnabled() && !breakpoint.isFiltered(new MessageStore(message))) {
				return breakpoint;
			}
		}
		return null;
	}

	public getBreakpointList() {
		return this.breakpointList;
	}

	@action public extend() {
		this.breakpointList.push(new FilterStore());
	}

	@action public deleteEntry(index: number) {
		this.breakpointList.splice(index, 1);
		this.save();
	}
 }

export const breakpointStore = new BreakpointStore();
