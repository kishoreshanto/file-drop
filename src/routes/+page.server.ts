import { access, mkdir } from 'node:fs/promises';

import type { PageServerLoad } from './$types';
import { appDataDir, tempUploadDir, uploadRoot } from '$lib/server/config/paths';

export const load: PageServerLoad = async () => {
	let databaseConnected = false;
	let uploadDirectoryReady = false;

	try {
		await mkdir(appDataDir, { recursive: true });
		const { sqlite } = await import('$lib/server/db/client');
		sqlite.prepare('select 1').get();
		databaseConnected = true;
	} catch {
		databaseConnected = false;
	}

	try {
		await mkdir(uploadRoot, { recursive: true });
		await mkdir(tempUploadDir, { recursive: true });
		await access(uploadRoot);
		await access(tempUploadDir);
		uploadDirectoryReady = true;
	} catch {
		uploadDirectoryReady = false;
	}

	return {
		health: {
			database: databaseConnected ? 'connected' : 'unavailable',
			uploadDirectory: uploadDirectoryReady ? 'ready' : 'unavailable'
		}
	};
};
