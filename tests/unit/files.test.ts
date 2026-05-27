import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { getFileCategory } from '../../src/lib/server/files/categories.ts';
import {
	createStoredFilename,
	hasPathTraversalAttempt
} from '../../src/lib/server/files/naming.ts';
import { saveCompletedFile, writeTemporaryFile } from '../../src/lib/server/files/storage.ts';
import {
	FileValidationError,
	validateFileForStorage
} from '../../src/lib/server/files/validation.ts';

async function createStorageFixture() {
	const root = await mkdtemp(path.join(os.tmpdir(), 'file-drop-storage-'));
	const paths = {
		uploadRoot: path.join(root, 'uploads'),
		tempUploadDir: path.join(root, 'temp')
	};

	await mkdir(paths.tempUploadDir, { recursive: true });

	return {
		root,
		paths,
		async cleanup() {
			await rm(root, { recursive: true, force: true });
		}
	};
}

test('safe filename generation preserves extension and adds suffix', () => {
	assert.equal(
		createStoredFilename('IMG_20260527_143000.jpg', { suffix: 'f5a128' }),
		'IMG_20260527_143000_f5a128.jpg'
	);
	assert.equal(createStoredFilename('', { suffix: 'abc123' }), 'upload_abc123');
	assert.equal(
		createStoredFilename('report final!!.PDF', { suffix: 'def456' }),
		'report_final_def456.pdf'
	);
});

test('path traversal attempts are detected and rejected', () => {
	assert.equal(hasPathTraversalAttempt('../../Documents/private.txt'), true);
	assert.equal(hasPathTraversalAttempt('..\\..\\secret.txt'), true);

	assert.throws(
		() =>
			validateFileForStorage(
				{ name: '../../Documents/private.txt', size: 1, type: 'text/plain' },
				{ maxFileSizeBytes: 50 }
			),
		(error) => error instanceof FileValidationError && error.code === 'path_traversal'
	);
});

test('file category mapping supports known types and falls back to other', () => {
	assert.equal(getFileCategory('image/jpeg', 'photo.jpg'), 'images');
	assert.equal(getFileCategory('application/pdf', 'notes.pdf'), 'documents');
	assert.equal(getFileCategory('video/mp4', 'clip.mp4'), 'videos');
	assert.equal(getFileCategory('application/octet-stream', 'archive.bin'), 'other');
});

test('blocked executable-style extensions are rejected', () => {
	for (const name of [
		'installer.dmg',
		'package.pkg',
		'script.sh',
		'run.command',
		'tool.exe',
		'Bundle.app'
	]) {
		assert.throws(
			() => validateFileForStorage({ name, size: 1 }, { maxFileSizeBytes: 50 }),
			(error) => error instanceof FileValidationError && error.code === 'blocked_extension'
		);
	}
});

test('completed files are moved into date-based upload directories', async () => {
	const fixture = await createStorageFixture();

	try {
		const tempPath = path.join(fixture.paths.tempUploadDir, 'incoming.tmp');
		await writeTemporaryFile(tempPath, Buffer.from('hello'));

		const result = await saveCompletedFile({
			paths: fixture.paths,
			tempPath,
			originalName: 'notes.txt',
			mimeType: 'text/plain',
			sizeBytes: 5,
			maxFileSizeBytes: 50,
			now: new Date('2026-05-27T12:00:00Z'),
			suffix: 'a137c4'
		});

		assert.equal(result.storedPath, 'documents/2026/05/27/notes_a137c4.txt');
		assert.equal(await readFile(result.absolutePath, 'utf8'), 'hello');
		assert.equal(result.absolutePath.startsWith(fixture.paths.uploadRoot), true);
	} finally {
		await fixture.cleanup();
	}
});

test('duplicate original names do not overwrite existing files', async () => {
	const fixture = await createStorageFixture();

	try {
		const firstTempPath = path.join(fixture.paths.tempUploadDir, 'first.tmp');
		const secondTempPath = path.join(fixture.paths.tempUploadDir, 'second.tmp');
		await writeTemporaryFile(firstTempPath, Buffer.from('first'));
		await writeTemporaryFile(secondTempPath, Buffer.from('second'));

		const commonOptions = {
			paths: fixture.paths,
			originalName: 'photo.jpg',
			mimeType: 'image/jpeg',
			sizeBytes: 5,
			maxFileSizeBytes: 50,
			now: new Date('2026-05-27T12:00:00Z')
		};

		const first = await saveCompletedFile({
			...commonOptions,
			tempPath: firstTempPath,
			suffix: '111aaa'
		});
		const second = await saveCompletedFile({
			...commonOptions,
			tempPath: secondTempPath,
			suffix: '222bbb'
		});

		assert.notEqual(first.storedPath, second.storedPath);
		assert.equal(await readFile(first.absolutePath, 'utf8'), 'first');
		assert.equal(await readFile(second.absolutePath, 'utf8'), 'second');
	} finally {
		await fixture.cleanup();
	}
});
