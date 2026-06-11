import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { env } from '$lib/server/config/env';
import { sqlite } from '$lib/server/db/client';

export type AuthenticatedDevice = {
	id: string;
	name: string;
};

export type SessionLookup =
	| {
			status: 'active';
			device: AuthenticatedDevice;
	  }
	| {
			status: 'missing' | 'expired' | 'revoked' | 'invalid';
			device: null;
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

export function getSessionForToken(token: string | undefined): SessionLookup {
	if (!token) {
		return { status: 'missing', device: null };
	}

	const now = Date.now();
	const row = sqlite
		.prepare(
			`
			select
				devices.id,
				devices.name,
				devices.revoked_at as deviceRevokedAt,
				sessions.revoked_at as sessionRevokedAt,
				sessions.expires_at as expiresAt
			from sessions
			inner join devices on devices.id = sessions.device_id
			where sessions.token_hash = ?
			limit 1
		`
		)
		.get(hashSecret(token)) as
		| {
				id: string;
				name: string;
				deviceRevokedAt: number | null;
				sessionRevokedAt: number | null;
				expiresAt: number;
		  }
		| undefined;

	if (!row) {
		return { status: 'invalid', device: null };
	}

	if (row.deviceRevokedAt || row.sessionRevokedAt) {
		return { status: 'revoked', device: null };
	}

	if (row.expiresAt <= now) {
		return { status: 'expired', device: null };
	}

	sqlite.prepare('update devices set last_seen_at = ? where id = ?').run(now, row.id);

	return {
		status: 'active',
		device: {
			id: row.id,
			name: row.name
		}
	};
}

export function getDeviceForSessionToken(token: string | undefined): AuthenticatedDevice | null {
	const session = getSessionForToken(token);
	return session.status === 'active' ? session.device : null;
}

export function revokeDevice(deviceId: string) {
	const now = Date.now();

	const revoke = sqlite.transaction(() => {
		sqlite
			.prepare('update devices set revoked_at = ? where id = ? and revoked_at is null')
			.run(now, deviceId);
		sqlite
			.prepare('update sessions set revoked_at = ? where device_id = ? and revoked_at is null')
			.run(now, deviceId);
	});

	revoke();
}
