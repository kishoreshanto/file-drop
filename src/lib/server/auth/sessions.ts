import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { env } from '$lib/server/config/env';
import { sqlite } from '$lib/server/db/client';

export type AuthenticatedDevice = {
	id: string;
	name: string;
};

export type CreatedSession = {
	token: string;
	expiresAt: Date;
	device: AuthenticatedDevice;
};

export function hashSecret(value: string) {
	return createHash('sha256').update(value).digest('hex');
}

export function createSessionToken() {
	return randomBytes(32).toString('base64url');
}

export function createDeviceSession(deviceName: string): CreatedSession {
	const now = new Date();
	const deviceId = randomUUID();
	const sessionId = randomUUID();
	const token = createSessionToken();
	const expiresAt = new Date(now.getTime() + env.SESSION_DAYS * 24 * 60 * 60 * 1000);
	const trimmedName = deviceName.trim() || 'Android Phone';

	const createTrustedDevice = sqlite.transaction(() => {
		sqlite
			.prepare(
				`
				insert into devices (id, name, created_at, last_seen_at, revoked_at)
				values (?, ?, ?, ?, null)
			`
			)
			.run(deviceId, trimmedName, now.getTime(), now.getTime());

		sqlite
			.prepare(
				`
				insert into sessions (id, device_id, token_hash, created_at, expires_at, revoked_at)
				values (?, ?, ?, ?, ?, null)
			`
			)
			.run(sessionId, deviceId, hashSecret(token), now.getTime(), expiresAt.getTime());
	});

	createTrustedDevice();

	return {
		token,
		expiresAt,
		device: {
			id: deviceId,
			name: trimmedName
		}
	};
}

export function getDeviceForSessionToken(token: string | undefined): AuthenticatedDevice | null {
	if (!token) {
		return null;
	}

	const now = Date.now();
	const row = sqlite
		.prepare(
			`
			select devices.id, devices.name
			from sessions
			inner join devices on devices.id = sessions.device_id
			where sessions.token_hash = ?
				and sessions.revoked_at is null
				and sessions.expires_at > ?
				and devices.revoked_at is null
			limit 1
		`
		)
		.get(hashSecret(token), now) as AuthenticatedDevice | undefined;

	if (!row) {
		return null;
	}

	sqlite.prepare('update devices set last_seen_at = ? where id = ?').run(now, row.id);

	return {
		id: row.id,
		name: row.name
	};
}
