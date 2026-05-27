import path from 'node:path';

export type FileCategory = 'images' | 'videos' | 'documents' | 'other';

const mimeCategory = new Map<string, FileCategory>([
	['image/jpeg', 'images'],
	['image/png', 'images'],
	['image/webp', 'images'],
	['image/heic', 'images'],
	['application/pdf', 'documents'],
	['text/plain', 'documents'],
	['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'documents'],
	['video/mp4', 'videos']
]);

const extensionCategory = new Map<string, FileCategory>([
	['.jpg', 'images'],
	['.jpeg', 'images'],
	['.png', 'images'],
	['.webp', 'images'],
	['.heic', 'images'],
	['.pdf', 'documents'],
	['.txt', 'documents'],
	['.docx', 'documents'],
	['.mp4', 'videos']
]);

export function getFileCategory(mimeType: string | undefined, filename = ''): FileCategory {
	const normalizedMimeType = mimeType?.trim().toLowerCase();

	if (normalizedMimeType && mimeCategory.has(normalizedMimeType)) {
		return mimeCategory.get(normalizedMimeType) ?? 'other';
	}

	const extension = path.extname(filename).toLowerCase();
	return extensionCategory.get(extension) ?? 'other';
}

export function isKnownMimeType(mimeType: string | undefined) {
	const normalizedMimeType = mimeType?.trim().toLowerCase();
	return Boolean(normalizedMimeType && mimeCategory.has(normalizedMimeType));
}
