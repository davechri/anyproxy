import { makeAutoObservable, action } from "mobx";
import ProxyConfig from '../common/ProxyConfig';
import { messageQueueStore } from './MessageQueueStore';
import proxyConfigStore from './ProxyConfigStore';

const PROTOCOLS = [
	'grpc:',
	'http:',
	'https:',
	'log:',
	'mongo:',
	'proxy:',
	'redis:',
	'sql:',
	'tcp:',
];

const TOOLTIP: Map<string, string> = new Map([
	['grpc:', 'Proxy and capture Remote Procedure Call messages.  Listen on the specified port for gRPC requests, and pass the requests to the target gRPC service.'],
	['http:', `Reverse proxy for HTTP messages.  Listen on port 8888 (default) for HTTP requests, and pass the requests to the target host having the best matching URL path.	The path can be regex a expression.`],
	['https:', `Reverse proxy for HTTPS messages.  Listen on port 9999 (default) for HTTPS requests, and pass the requests to the target host having the best matching URL path. 	The path can be a regex expression.`],
	['log:', `Monitor dockers log. The "docker logs -f CONTAINER" command will pull log messages from a dockers container.`],
	['mongo:', `Proxy and capture MongoDB messages.  Listen on the specified port for MongoDB requests, and pass the requests to the target MongoDB service.`],
	['proxy:', `Forward proxy for HTTP and HTTPS.  Listen on port 8888 (default) for HTTP requests, and port 9999 (default) for HTTPS requests.  Your browser must be configured to proxy HTTP and HTTPS messages to localhost:8888 and localhost:9999, respectively.`],
	['redis:', `Proxy and capture Redis messages.  Listen on the specified port for Redis requests, and pass the requests to the target Redis service.`],
	['sql:', `Proxy and capture SQL messages.  Listen on the specified port for SQL requests, and pass the requests to the target SQL service.  It has only been tested with MariaDB (MySQL).`],
	['tcp:', `TCP proxy.  Can proxy and capture any TCP request/response protocol.`],
]);

export default class SettingsStore {
	private changed = false;
	private protocol = 'http:';
	private path = '';
	private targetHost = '';
	private targetPort = '';
	private comment = '';

	private statusUpdating = true;
	private entries: ProxyConfig[] = [];
	private messageQueueLimit = messageQueueStore.getLimit();
	private error = '';

	public constructor() {
		makeAutoObservable(this);
	}

	public isStatusUpdating() {
		return this.statusUpdating;
	}

	private setConfig() {
		this.entries.splice(0, this.entries.length);
		const configs = proxyConfigStore.getProxyConfigs();
		configs.forEach((config) => {
			this.entries.push(config);
		});

		this.statusUpdating = true;
		proxyConfigStore.retrieveProxyConfigs()
			.then((configs) => {
				configs.forEach(config => {
					if (config.protocol === 'log:' || config.protocol === 'proxy:') return;
					for (const entry of this.entries) {
						if (entry.hostname === config.hostname && entry.port === config.port) {
							entry.hostReachable = config.hostReachable;
						}
					}
					this.statusUpdating = false;
				})
		})
	}

	@action public async reset() {
		this.changed = false;
		this.protocol = 'http:';
		this.path = '';
		this.targetHost = '';
		this.targetPort = '';
		this.comment = '';
		this.messageQueueLimit = messageQueueStore.getLimit();
		this.setConfig();
		this.error = '';
	}

	public isChanged() {
		return this.changed;
	}

	public getProtocols() {
		return PROTOCOLS;
	}

	public getTooltip(protocol: string): string {
		const tooltip = TOOLTIP.get(protocol);
		return tooltip ? tooltip : 'Tooltip text not found!';
	}

	public getProtocol() {
		return this.protocol;
	}

	@action public setProtocol(protocol: string) {
		this.protocol = protocol;
		this.error = '';
	}

	public isProxyOrLog() {
		return this.protocol === 'proxy:' || this.protocol === 'log:';
	}

	public getPath() {
		return this.path;
	}

	@action public setPath(path: string) {
		this.path = path;
		this.error = '';
	}

	public getTargetHost() {
		return this.targetHost;
	}

	@action public setTargetHost(host: string) {
		this.targetHost = host;
		this.error = '';
	}

	public getTargetPort() {
		return this.targetPort;
	}

	@action public setTargetPort(port: string) {
		this.targetPort = port;
		this.error = '';
	}

	public getComment() {
		return this.comment;
	}

	@action public setComment(comment: string) {
		this.comment = comment;
		this.error = '';
	}

	public isAddDisabled(): boolean {
		if (this.isProxyOrLog()) {
			return this.path.length === 0;
		} else {
			return this.path.length === 0 || this.targetHost.length === 0 || this.targetPort.length === 0;
		}
	}

	@action public addEntry(): void {
		if (this.protocol === 'http:' || this.protocol === 'https:' || this.protocol === 'proxy:') {
			// if (!this.path.startsWith('/')) {
			// 	this.error = `When protocol "${this.protocol}" is selected the path must begin with "/"`;
			// }
		} else if (this.protocol === 'log:') {
		} else {
			if (isNaN(+this.path)) {
				this.error = `'When protocol "${this.protocol}" is selected port number must be specified`;
			}
		}

		if (this.error.length === 0 && this.protocol !== 'proxy:' && this.protocol !== 'log:') {
			if (isNaN(+this.targetPort)) {
				this.error = `Invalid target port number`;
			}
		}

		if (this.error.length === 0) {
			const proxyConfig = new ProxyConfig();
			proxyConfig.protocol = this.protocol;
			proxyConfig.path = this.path;
			proxyConfig.hostname = this.targetHost;
			proxyConfig.port = +this.targetPort;
			proxyConfig.comment = this.comment;
			this.entries.push(proxyConfig);

			this.path = '';
			this.targetHost = '';
			this.targetPort = '';
			this.comment = '';
			this.changed = true;
		}
	}

	@action public deleteEntry(index: number) {
		this.entries.splice(index, 1);
		this.changed = true;
	}

	@action public updateEntryProtocol(index: number, value: string) {
		const entry = { ...this.entries[index] };
		entry.protocol = value;
		this.entries.splice(index, 1, entry);
		this.changed = true;
	}

	@action public updateEntryPath(index: number, value: string) {
		const entry = { ...this.entries[index] };
		entry.path = value;
		this.entries.splice(index, 1, entry);
		this.changed = true;
	}

	@action public updateEntryHost(index: number, value: string) {
		const entry = { ...this.entries[index] };
		entry.hostname = value;
		this.entries.splice(index, 1, entry);
		this.changed = true;
	}

	@action public updateEntryPort(index: number, value: string) {
		if (isNaN(+this.targetPort)) {
			this.error = `Invalid port number: ${this.targetPort}`;
		} else {
			const entry = { ...this.entries[index] };
			entry.port = +value;
			this.entries.splice(index, 1, entry);
			this.changed = true;
		}
	}

	@action public updateComment(index: number, value: string) {
		const entry = { ...this.entries[index] };
		entry.comment = value;
		this.entries.splice(index, 1, entry);
		this.changed = true;
	}

	@action public toggleEntryCapture(index: number) {
		const entry = { ...this.entries[index] };
		entry.recording = !entry.recording;
		this.entries.splice(index, 1, entry);
		this.changed = true;
	}

	public getEntries(): ProxyConfig[] {
		return this.entries;
	}

	public getMessageQueueLimit() {
		return this.messageQueueLimit;
	}

	@action setMessageQueueLimit(messageQueueLimit: number) {
		this.messageQueueLimit = messageQueueLimit;
		this.changed = true;
	}

	public getError(): string {
		return this.error;
	}

	@action public save() {
		this.changed = false;
		proxyConfigStore.setProxyConfigs(this.entries);
		messageQueueStore.setLimit(this.messageQueueLimit);
		proxyConfigStore.load();
	}
}

export const settingsStore = new SettingsStore();