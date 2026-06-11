import type { Handle } from '@sveltejs/kit';

import { sessionCookieName } from '$lib/server/auth/cookies';
import { getSessionForToken } from '$lib/server/auth/sessions';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(sessionCookieName);
	const session = getSessionForToken(sessionToken);

	event.locals.device = session.device;
	event.locals.sessionStatus = session.status;

	return resolve(event);
};
