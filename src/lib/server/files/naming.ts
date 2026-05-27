import { randomBytes } from 'node:crypto';
import path from 'node:path';

const maxBaseLength = 120;
const maxExtensionLength = 16;
const fallbackBaseName = 'upload';

export function hasPathTraversalAttempt(filename: string) {
	const normalized = filename.replaceAll('\\', '/');
	const parts = normalized.split('/');

	return (
		filename.includes('\0') ||
		path.isAbsolute(filename) ||
		normalized.startsWith('/') ||
		parts.some((part) => part === '..')
	);
}

export function getLowercaseExtension(filename: string) {
	const extension = path.extname(filename.trim()).toLowerCase();

	if (!extension || extension.length > maxExtensionLength) {
		return '';
	}

	return extension.replace(/[^.\da-z]/g, '');
}

export function sanitizeFilenameBase(filename: string) {
	const basename = path.basename(filename.replaceAll('\\', '/'));
	const extension = getLowercaseExtension(basename);
	const withoutExtension = extension ? basename.slice(0, -extension.length) : basename;
	const cleaned = withoutExtension
		.replaceAll('\0', '')
		.normalize('NFKD')
		.replace(/[^\w .-]+/g, '')
		.replace(/[.\s_-]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, maxBaseLength);

	return cleaned || fallbackBaseName;
}

export function createStorageSuffix(bytes = 3) {
	return randomBytes(bytes).toString('hex');
}

export function createStoredFilename(originalName: string, options: { suffix?: string } = {}) {
	const base = sanitizeFilenameBase(originalName);
	const extension = getLowercaseExtension(originalName);
	const suffix = options.suffix ?? createStorageSuffix();

	return `${base}_${suffix}${extension}`;
}
