import type { Handle } from '@sveltejs/kit';

import { sessionCookieName } from '$lib/server/auth/cookies';
import { getDeviceForSessionToken } from '$lib/server/auth/sessions';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(sessionCookieName);
	event.locals.device = getDeviceForSessionToken(sessionToken);

	return resolve(event);
};
