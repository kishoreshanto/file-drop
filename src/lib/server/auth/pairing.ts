import { randomInt, randomUUID } from 'node:crypto';

import { env } from '$lib/server/config/env';
import { sqlite } from '$lib/server/db/client';
import { hashSecret } from './sessions';

export type CreatedPairingCode = {
	code: string;
	expiresAt: Date;
};

function normalizePairingCode(code: string) {
	return code.replace(/\D/g, '');
}

function formatPairingCode(code: string) {
	return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export function createPairingCode(): CreatedPairingCode {
	const now = new Date();
	const rawCode = String(randomInt(0, 1_000_000)).padStart(6, '0');
	const expiresAt = new Date(now.getTime() + env.PAIRING_CODE_TTL_SECONDS * 1000);

	deleteExpiredPairingCodes(now);

	sqlite
		.prepare(
			`
			insert into pairing_codes (id, code_hash, created_at, expires_at, used_at)
			values (?, ?, ?, ?, null)
		`
		)
		.run(randomUUID(), hashSecret(rawCode), now.getTime(), expiresAt.getTime());

	return {
		code: formatPairingCode(rawCode),
		expiresAt
	};
}

export function consumePairingCode(submittedCode: string) {
	const normalizedCode = normalizePairingCode(submittedCode);

	if (!/^\d{6}$/.test(normalizedCode)) {
		return false;
	}

	const now = Date.now();
	const result = sqlite
		.prepare(
			`
			update pairing_codes
			set used_at = ?
			where code_hash = ?
				and used_at is null
				and expires_at > ?
		`
		)
		.run(now, hashSecret(normalizedCode), now);

	return result.changes === 1;
}

export function deleteExpiredPairingCodes(now = new Date()) {
	sqlite.prepare('delete from pairing_codes where expires_at <= ?').run(now.getTime());
}
