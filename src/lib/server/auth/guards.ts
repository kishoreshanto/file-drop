import { error, redirect, type RequestEvent } from '@sveltejs/kit';

export function requireDevice(device: App.Locals['device']) {
	if (!device) {
		redirect(303, '/pair');
	}

	return device;
}

export function isLocalClientAddress(address: string) {
	return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

export function requireLocalAdmin(event: RequestEvent) {
	const clientAddress = event.getClientAddress();

	if (!isLocalClientAddress(clientAddress)) {
		error(403, 'Admin is only available from this Mac.');
	}
}
