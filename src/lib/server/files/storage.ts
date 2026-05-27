import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getFileCategory, type FileCategory } from './categories.ts';
import { createStoredFilename } from './naming.ts';
import { validateFileForStorage, type FileValidationInput } from './validation.ts';

export type StoragePaths = {
	uploadRoot: string;
	tempUploadDir: string;
};

export type PrepareTemporaryFileOptions = {
	paths: StoragePaths;
	extension?: string;
};

export type SaveCompletedFileOptions = {
	paths: StoragePaths;
	tempPath: string;
	originalName: string;
	mimeType?: string;
	sizeBytes: number;
	maxFileSizeBytes: number;
	now?: Date;
	suffix?: string;
};

export type StoredFileResult = {
	category: FileCategory;
	filename: string;
	storedPath: string;
	absolutePath: string;
};

export async function ensureStorageDirectories(paths: StoragePaths) {
	await Promise.all([
		mkdir(paths.uploadRoot, { recursive: true }),
		mkdir(paths.tempUploadDir, { recursive: true })
	]);
}

export async function prepareTemporaryFile(options: PrepareTemporaryFileOptions) {
	await mkdir(options.paths.tempUploadDir, { recursive: true });

	const extension = options.extension?.startsWith('.') ? options.extension : '';
	const tempPath = path.join(options.paths.tempUploadDir, `${randomUUID()}${extension ?? ''}`);

	return { tempPath };
}

export async function writeTemporaryFile(
	tempPath: string,
	data: ArrayBuffer | Uint8Array | Buffer
) {
	const bytes = data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(data);
	await writeFile(tempPath, bytes, { flag: 'wx' });
}

export async function saveCompletedFile(
	options: SaveCompletedFileOptions
): Promise<StoredFileResult> {
	validateFileForStorage(
		{
			name: options.originalName,
			size: options.sizeBytes,
			type: options.mimeType
		} satisfies FileValidationInput,
		{ maxFileSizeBytes: options.maxFileSizeBytes }
	);

	const category = getFileCategory(options.mimeType, options.originalName);
	const date = options.now ?? new Date();
	const yyyy = String(date.getFullYear());
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const filename = createStoredFilename(options.originalName, { suffix: options.suffix });
	const storedPath = path.posix.join(category, yyyy, mm, dd, filename);
	const destinationDirectory = path.join(options.paths.uploadRoot, category, yyyy, mm, dd);
	const absolutePath = path.join(destinationDirectory, filename);

	await mkdir(destinationDirectory, { recursive: true });
	await rename(options.tempPath, absolutePath);

	return {
		category,
		filename,
		storedPath,
		absolutePath
	};
}

export async function removeTemporaryFile(tempPath: string) {
	await rm(tempPath, { force: true });
}
