import { makeAutoObservable, action } from "mobx"
import { apFileSystem } from "./APFileSystem";

export const JSON_FIELDS_DIR = 'jsonFields';
export const SCRIPTS_DIR = 'scripts';
const jsonLogScriptFileName = 'jsonLogScript';

export class JSONLogLabel {
	private dir = "";
	private name = "";
	private valid = true;

	public constructor(dir: string) {
		this.dir = dir;
		makeAutoObservable(this);
	}

	public getName() {
		return this.name;
	}

	@action public async setNameAndValidate(name: string) {
		const oldName = this.name;
		this.name = name;
		if (this.valid && oldName !== '') {
			await apFileSystem.deleteFile(this.dir + '/' + oldName);
		}

		this.valid = true;
		if (name != '') {
			try {
				// Verify that each sub-name is a valid key for an object
				for (const key of name.split('.')) {
					let obj: { [key: string]: string } = {}
					obj[key] = "";
				}
				await apFileSystem.writeFile(this.dir + '/' + name, name);
			} catch (e) {
				this.valid = false;
			}
		}
	}

	@action public setName(name: string) {
		this.name = name;
	}

	public isValidName() {
		return this.valid;
	}

	public getDir() {
		return this.dir;
	}
}

const defaultScript =
	`
// Sample function used to extract level category and message from log entry
// @param nonJson: string - non-JSON string
// @param jsonData: {} - JSON log data
// @returns {level: "error | warn | info", category: "category...",n message: "message..."}
function(nonJson, jsonData) {
	let date = '';
    let level = jsonData && jsonData.level ? jsonData.level : 'info';
    let category = '';
    let message = '';
    if (jsonData.MESSAGE) message = jsonData.MESSAGE;
    else if (jsonData.message) message = jsonData.message;
    else if (jsonData.msg) message = jsonData.msg;

    function parsePod(pod) {
        const podParts = pod.split('-');
        if (podParts.length > 1) {
            podParts.pop();
        }
        return podParts.join('-');
    }

    if (jsonData.pod) {
        category = parsePod(jsonData.pod);
    } else if (jsonData._file) {
        if (jsonData.msg_timestamp) {
            date = new Date(jsonData.msg_timestamp).toString().split(' ')[4];
        } else if (jsonData._ts) {
            date = new Date(jsonData._ts).toString().split(' ')[4];
        }

        if (jsonData._file) {
            if (jsonData._host) {
                category = jsonData._host + ' ';
            }
            category += parsePod(jsonData._file);
        }
    } else {
        const tokens = nonJson.split(' ', 5);
        if (tokens.length >= 3) {
            date = tokens[2];
        }
        if (tokens.length >= 4) {
            let pod = tokens[3];
            if (pod.startsWith('mzone')) {
                if (tokens.length >= 5) {
                    pod = tokens[4];
                    category = tokens[3] + ' ';
                }
            }
            category += parsePod(pod);
        }
    }
    return { date, level, category, message };
}
`

export type LogEntry = {
	date: string,
	level: string,
	category: string,
	message: string
};

export default class JSONLogStore {
	private script = defaultScript;

	private scriptFunc = (_logEntry: string, _logentryJson: object) => { return { date: '', level: '', category: '', message: '' }; };
	private labels: JSONLogLabel[] = [];

	public constructor() {
		makeAutoObservable(this);
	}

	@action public resetScriptToDefault() {
		this.script = defaultScript;
		apFileSystem.deleteFile(SCRIPTS_DIR + '/' + jsonLogScriptFileName);
	}
	public getScript() {
		return this.script;
	}
	@action public setScript(script: string) {
		this.script = script;
	}
	public saveScript() {
		apFileSystem.writeFile(SCRIPTS_DIR + '/' + jsonLogScriptFileName, this.script);
	}
	public updateScriptFunc() {
		this.scriptFunc = this.evalScript(this.script);
	}
	public callScriptFunc(nonJson: string, jsonData: object): LogEntry {
		let logEntry: LogEntry = { date: '', level: '', category: '', message: '' };
		try {
			logEntry = this.scriptFunc(nonJson, jsonData);
		} catch (e) {
			console.log(e);
		}
		return logEntry;
	}

	public evalScript(script: string) {
		let f = this.scriptFunc;
		eval('f = ' + script);
		return f;
	}

	public async init() {
		const fileNames = await apFileSystem.readDir(JSON_FIELDS_DIR);
		this.labels = [];
		for (const fileName of fileNames) {
			const jsonField = new JSONLogLabel(JSON_FIELDS_DIR);
			jsonField.setName(fileName);
			this.labels.push(jsonField);
		}

		for (const fileName of await getFiles(SCRIPTS_DIR)) {
			const script = await apFileSystem.readFile(SCRIPTS_DIR + '/' + fileName)
			switch (fileName) {
				case jsonLogScriptFileName:
					this.script = script;
					break;
			}
		}
	}

	public getJSONLabels() {
		return this.labels;
	}

	public getJSONLabelNames(): string[] {
		const fields: string[] = [];
		for (const label of this.labels) fields.push(label.getName());
		return fields;
	}

	@action public extend() {
		this.labels.unshift(new JSONLogLabel(JSON_FIELDS_DIR));
	}

	@action public deleteEntry(index: number) {
		const jsonField = this.labels[index];
		if (jsonField.getName() != "") {
			apFileSystem.deleteFile(jsonField.getDir() + '/' + jsonField.getName());
		}
		this.labels.splice(index, 1);
	}
}

async function getFiles(dir: string): Promise<string[]> {
	const fileNames = await apFileSystem.readDir(dir);
	const names: string[] = [];
	for (const fileName of fileNames) {
		names.push(fileName);
	}
	return names;
}

export const jsonLogStore = new JSONLogStore();
