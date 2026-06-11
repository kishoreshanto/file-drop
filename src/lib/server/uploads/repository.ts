import { sqlite } from '$lib/server/db/client';

export type UploadHistoryItem = {
	id: string;
	originalName: string;
	storedPath: string;
	mimeType: string;
	sizeBytes: number;
	status: string;
	createdAt: number;
};

export function listUploadsForDevice(deviceId: string, limit = 50) {
	return sqlite
		.prepare(
			`
			select
				id,
				original_name as originalName,
				stored_path as storedPath,
				mime_type as mimeType,
				size_bytes as sizeBytes,
				status,
				created_at as createdAt
			from uploads
			where device_id = ?
			order by created_at desc
			limit ?
		`
		)
		.all(deviceId, limit) as UploadHistoryItem[];
}

export function listLatestUploads(limit = 8) {
	return sqlite
		.prepare(
			`
			select
				uploads.id,
				uploads.original_name as originalName,
				uploads.stored_path as storedPath,
				uploads.mime_type as mimeType,
				uploads.size_bytes as sizeBytes,
				uploads.status,
				uploads.created_at as createdAt,
				devices.name as deviceName
			from uploads
			inner join devices on devices.id = uploads.device_id
			order by uploads.created_at desc
			limit ?
		`
		)
		.all(limit) as Array<UploadHistoryItem & { deviceName: string }>;
}

export function countCompleteUploads() {
	const row = sqlite
		.prepare("select count(*) as count from uploads where status = 'complete'")
		.get() as { count: number };

	return row.count;
}
