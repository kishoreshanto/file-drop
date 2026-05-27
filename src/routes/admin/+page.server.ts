import type { Actions, PageServerLoad } from './$types';
import { createPairingCode } from '$lib/server/auth/pairing';
import { requireLocalAdmin } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	requireLocalAdmin(event);

	return {
		adminReady: true
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
	}
};
