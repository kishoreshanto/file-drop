import type { Actions, PageServerLoad } from './$types';
import { createPairingCode } from '$lib/server/auth/pairing';
import { requireLocalAdmin } from '$lib/server/auth/guards';
import { revokeDevice } from '$lib/server/auth/sessions';
import { countActiveDevices, listTrustedDevices } from '$lib/server/devices/repository';
import { getStorageHealth } from '$lib/server/storage/health';
import { countCompleteUploads, listLatestUploads } from '$lib/server/uploads/repository';

export const load: PageServerLoad = async (event) => {
	requireLocalAdmin(event);

	return {
		devices: listTrustedDevices(),
		summary: {
			activeDeviceCount: countActiveDevices(),
			storageHealth: await getStorageHealth(),
			totalSuccessfulUploads: countCompleteUploads()
		},
		latestUploads: listLatestUploads()
	};
};

export const actions: Actions = {
	generate: async (event) => {
		requireLocalAdmin(event);

		const pairingCode = createPairingCode();

		return {
			pairingCode: pairingCode.code,
			expiresAt: pairingCode.expiresAt.toISOString()
		};
	},
	revoke: async (event) => {
		requireLocalAdmin(event);

		const data = await event.request.formData();
		const deviceId = String(data.get('deviceId') ?? '');

		if (deviceId) {
			revokeDevice(deviceId);
		}

		return {
			revokedDeviceId: deviceId
		};
	}
};
