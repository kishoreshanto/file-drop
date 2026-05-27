import path from 'node:path';

import { env } from './env';

function resolveFromProjectRoot(value: string) {
	return path.resolve(process.cwd(), value);
}

export const appDataDir = resolveFromProjectRoot(env.APP_DATA_DIR);
export const uploadRoot = resolveFromProjectRoot(env.UPLOAD_ROOT);
export const tempUploadDir = resolveFromProjectRoot(env.TEMP_UPLOAD_DIR);
export const databasePath = path.join(appDataDir, 'file-drop.db');

export const paths = {
	appDataDir,
	databasePath,
	uploadRoot,
	tempUploadDir
} as const;
