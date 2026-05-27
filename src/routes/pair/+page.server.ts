import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { setSessionCookie } from '$lib/server/auth/cookies';
import { consumePairingCode } from '$lib/server/auth/pairing';
import { createDeviceSession } from '$lib/server/auth/sessions';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.device) {
		redirect(303, '/upload');
	}

	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const deviceName = String(data.get('deviceName') ?? '').trim();
		const pairingCode = String(data.get('pairingCode') ?? '').trim();

		if (!deviceName || !pairingCode || !consumePairingCode(pairingCode)) {
			return fail(400, {
				deviceName,
				message: 'Pairing failed. Check the code and try again.'
			});
		}

		const session = createDeviceSession(deviceName);
		setSessionCookie(event.cookies, session.token, session.expiresAt);
		event.locals.device = session.device;

		redirect(303, '/upload');
	}
};
