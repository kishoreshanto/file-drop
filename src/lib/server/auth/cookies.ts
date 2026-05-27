import type { Cookies } from '@sveltejs/kit';

export const sessionCookieName = 'file_drop_session';

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		secure: false
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(sessionCookieName, { path: '/' });
}
