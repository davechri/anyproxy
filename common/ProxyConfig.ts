import net from "net";
import tls from 'tls';

export default class ProxyConfig {
	path: string = '';
	protocol: string = '';
	hostname: string = '';
	port: number = 0;
	recording: boolean = true;
	hostReachable: boolean = true;
	logProxyProcess?: any = undefined;
	_server?: net.Server | tls.Server;
	comment:string = '';

	static isHttpOrHttps(config: ProxyConfig): boolean {
		switch (config.protocol) {
			case 'http:':
			case 'https:':
			case 'browser:':
				return true;
			default:
				return false;
		}
	}
}