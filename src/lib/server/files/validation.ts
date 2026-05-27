import { getLowercaseExtension, hasPathTraversalAttempt } from './naming.ts';

const blockedExtensions = new Set(['.app', '.dmg', '.pkg', '.sh', '.command', '.exe']);

export type FileValidationInput = {
	name: string;
	size: number;
	type?: string;
};

export type UploadValidationOptions = {
	maxFileSizeBytes: number;
	maxFilesPerBatch: number;
};

export class FileValidationError extends Error {
	readonly code:
		| 'empty_filename'
		| 'invalid_file_size'
		| 'path_traversal'
		| 'blocked_extension'
		| 'too_many_files';

	constructor(
		message: string,
		code:
			| 'empty_filename'
			| 'invalid_file_size'
			| 'path_traversal'
			| 'blocked_extension'
			| 'too_many_files'
	) {
		super(message);
		this.name = 'FileValidationError';
		this.code = code;
	}
}

export function isBlockedExtension(filename: string) {
	return blockedExtensions.has(getLowercaseExtension(filename));
}

export function validateFileForStorage(
	file: FileValidationInput,
	options: Pick<UploadValidationOptions, 'maxFileSizeBytes'>
) {
	const name = file.name.trim();

	if (!name) {
		throw new FileValidationError('Filename is required.', 'empty_filename');
	}

	if (!Number.isFinite(file.size) || file.size < 0 || file.size > options.maxFileSizeBytes) {
		throw new FileValidationError('File size is not allowed.', 'invalid_file_size');
	}

	if (hasPathTraversalAttempt(name)) {
		throw new FileValidationError('Path-style filenames are not allowed.', 'path_traversal');
	}

	if (isBlockedExtension(name)) {
		throw new FileValidationError('This file extension is not allowed.', 'blocked_extension');
	}
}

export function validateFileBatch(files: FileValidationInput[], options: UploadValidationOptions) {
	if (files.length > options.maxFilesPerBatch) {
		throw new FileValidationError('Too many files selected.', 'too_many_files');
	}

	for (const file of files) {
		validateFileForStorage(file, options);
	}
}
