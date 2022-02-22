import Message from './common/Message';
import pickIcon from './PickIcon';

const firefoxColor = 'orangered';
const colors = ['green', 'purple', 'blue',  'brown', 'darkpink', 'slateblue', 'darkorange'];
let count = 0;
let colorMap: Map<string, string> = new Map();

export default function colorPicker(message: Message): string {
	const protocol = message.protocol;

	if (message.proxyConfig!.protocol === 'browser:') {
		if (pickIcon(message.proxyConfig!.protocol, message.requestHeaders['user-agent']).indexOf('keyboard') === -1) {
			return firefoxColor;
		} else {
			return 'black';
		}
	}

	if (protocol === 'log:') {
		return '#007bff';
	}

	let key = '';
	if (message.clientIp) {
		key = message.clientIp.trim();
	}	

	let color = colorMap.get(key);
	if (color === undefined) {
		if (key === 'error') {
			color = 'red';
		} else {
			color = colors[count % colors.length];
			++count;
			colorMap.set(key, color);

			if (!colors.includes(color)) {
				console.error(`Color is undefined key=${key} count=${count}, ${colorMap}`);
			}
		}
	}

	return color;
}