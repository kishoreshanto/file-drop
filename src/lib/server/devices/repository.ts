import { sqlite } from '$lib/server/db/client';

export type TrustedDevice = {
	id: string;
	name: string;
	createdAt: number;
	lastSeenAt: number | null;
	revokedAt: number | null;
};

export function listTrustedDevices() {
	return sqlite
		.prepare(
			`
			select
				id,
				name,
				created_at as createdAt,
				last_seen_at as lastSeenAt,
				revoked_at as revokedAt
			from devices
			order by created_at desc
		`
		)
		.all() as TrustedDevice[];
}

export function countActiveDevices() {
	const row = sqlite
		.prepare('select count(*) as count from devices where revoked_at is null')
		.get() as { count: number };

	return row.count;
}
