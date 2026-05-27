import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';

import { json, type RequestHandler } from '@sveltejs/kit';

import { env } from '$lib/server/config/env';
import { tempUploadDir, uploadRoot } from '$lib/server/config/paths';
import { sqlite } from '$lib/server/db/client';
import {
	ensureStorageDirectories,
	prepareTemporaryFile,
	removeTemporaryFile,
	saveCompletedFile,
	writeTemporaryFile
} from '$lib/server/files/storage';
import { FileValidationError, validateFileForStorage } from '$lib/server/files/validation';

type AcceptedUpload = {
	originalName: string;
	storedPath: string;
	mimeType: string;
	sizeBytes: number;
};

type RejectedUpload = {
	originalName: string;
	error: string;
};

function isUploadFile(value: FormDataEntryValue): value is File {
	return (
		typeof value === 'object' &&
		value !== null &&
		'name' in value &&
		'size' in value &&
		'arrayBuffer' in value
	);
}

function validationMessage(error: unknown) {
	if (error instanceof FileValidationError) {
		return error.message;
	}

	return 'File could not be uploaded.';
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.device) {
		return json({ accepted: [], rejected: [], message: 'Pairing required.' }, { status: 401 });
	}

	const formData = await request.formData();
	const files = Array.from(formData.values()).filter(isUploadFile);

	if (files.length === 0) {
		return json(
			{
				accepted: [],
				rejected: [{ originalName: 'Upload', error: 'No files were selected.' }]
			},
			{ status: 400 }
		);
	}

	if (files.length > env.MAX_FILES_PER_BATCH) {
		return json(
			{
				accepted: [],
				rejected: files.map((file) => ({
					originalName: file.name || 'Unnamed file',
					error: `Select ${env.MAX_FILES_PER_BATCH} files or fewer.`
				}))
			},
			{ status: 400 }
		);
	}

	await ensureStorageDirectories({ uploadRoot, tempUploadDir });

	const accepted: AcceptedUpload[] = [];
	const rejected: RejectedUpload[] = [];

	for (const file of files) {
		let tempPath: string | undefined;

		try {
			validateFileForStorage(file, { maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES });

			const prepared = await prepareTemporaryFile({ paths: { uploadRoot, tempUploadDir } });
			tempPath = prepared.tempPath;

			await writeTemporaryFile(tempPath, await file.arrayBuffer());

			const stored = await saveCompletedFile({
				paths: { uploadRoot, tempUploadDir },
				tempPath,
				originalName: file.name,
				mimeType: file.type || 'application/octet-stream',
				sizeBytes: file.size,
				maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES
			});

			try {
				sqlite
					.prepare(
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
						values (?, ?, ?, ?, ?, ?, 'complete', ?)
					`
					)
					.run(
						randomUUID(),
						locals.device.id,
						file.name,
						stored.storedPath,
						file.type || 'application/octet-stream',
						file.size,
						Date.now()
					);
			} catch (error) {
				await rm(stored.absolutePath, { force: true });
				throw error;
			}

			accepted.push({
				originalName: file.name,
				storedPath: stored.storedPath,
				mimeType: file.type || 'application/octet-stream',
				sizeBytes: file.size
			});
		} catch (error) {
			if (tempPath) {
				await removeTemporaryFile(tempPath);
			}

			rejected.push({
				originalName: file.name || 'Unnamed file',
				error: validationMessage(error)
			});
		}
	}

	return json(
		{ accepted, rejected },
		{ status: accepted.length > 0 || rejected.length === 0 ? 200 : 400 }
	);
};
