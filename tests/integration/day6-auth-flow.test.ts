import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import test from 'node:test';

function hashSecret(value: string) {
	return createHash('sha256').update(value).digest('hex');
}

function createTestDb() {
	const db = new Database(':memory:');

	db.exec(`
		create table devices (
			id text primary key not null,
			name text not null,
			created_at integer not null,
			last_seen_at integer,
			revoked_at integer
		);

		create table sessions (
			id text primary key not null,
			device_id text not null references devices(id) on delete cascade,
			token_hash text not null,
			created_at integer not null,
			expires_at integer not null,
			revoked_at integer
		);

		create table pairing_codes (
			id text primary key not null,
			code_hash text not null,
			created_at integer not null,
			expires_at integer not null,
			used_at integer
		);

		create table uploads (
			id text primary key not null,
			device_id text not null references devices(id) on delete cascade,
			original_name text not null,
			stored_path text not null,
			mime_type text not null,
			size_bytes integer not null,
			status text not null,
			created_at integer not null
		);
	`);

	return db;
}

function consumePairingCode(db: Database.Database, code: string, now: number) {
	const result = db
		.prepare(
			`
			update pairing_codes
			set used_at = ?
			where code_hash = ?
				and used_at is null
				and expires_at > ?
		`
		)
		.run(now, hashSecret(code), now);

	return result.changes === 1;
}

function getSessionStatus(db: Database.Database, token: string, now: number) {
	const row = db
		.prepare(
			`
			select
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
				deviceRevokedAt: number | null;
				sessionRevokedAt: number | null;
				expiresAt: number;
		  }
		| undefined;

	if (!row) return 'invalid';
	if (row.deviceRevokedAt || row.sessionRevokedAt) return 'revoked';
	if (row.expiresAt <= now) return 'expired';
	return 'active';
}

test('expired pairing code cannot be consumed', () => {
	const db = createTestDb();
	const now = Date.now();

	try {
		db.prepare(
			`
			insert into pairing_codes (id, code_hash, created_at, expires_at, used_at)
			values (?, ?, ?, ?, null)
		`
		).run(randomUUID(), hashSecret('123456'), now - 10_000, now - 1);

		assert.equal(consumePairingCode(db, '123456', now), false);
	} finally {
		db.close();
	}
});

test('pair upload revoke flow blocks future session use', () => {
	const db = createTestDb();
	const now = Date.now();
	const deviceId = randomUUID();
	const token = 'session-token';

	try {
		db.prepare(
			`
			insert into devices (id, name, created_at, last_seen_at, revoked_at)
			values (?, 'Android Phone', ?, ?, null)
		`
		).run(deviceId, now, now);

		db.prepare(
			`
			insert into sessions (id, device_id, token_hash, created_at, expires_at, revoked_at)
			values (?, ?, ?, ?, ?, null)
		`
		).run(randomUUID(), deviceId, hashSecret(token), now, now + 100_000);

		assert.equal(getSessionStatus(db, token, now), 'active');

		db.prepare(
			`
			insert into uploads (
				id,
				device_id,
				original_name,
				stored_path,
				mime_type,
				size_bytes,
				status,
				created_at
			)
			values (?, ?, 'photo.jpg', 'images/2026/05/28/photo_abc123.jpg', 'image/jpeg', 123, 'complete', ?)
		`
		).run(randomUUID(), deviceId, now);

		const upload = db
			.prepare(
				'select original_name as originalName, stored_path as storedPath, status from uploads'
			)
			.get() as { originalName: string; storedPath: string; status: string };

		assert.deepEqual(upload, {
			originalName: 'photo.jpg',
			storedPath: 'images/2026/05/28/photo_abc123.jpg',
			status: 'complete'
		});

		db.prepare('update devices set revoked_at = ? where id = ?').run(now + 1, deviceId);
		db.prepare('update sessions set revoked_at = ? where device_id = ?').run(now + 1, deviceId);

		assert.equal(getSessionStatus(db, token, now + 2), 'revoked');
	} finally {
		db.close();
	}
});
