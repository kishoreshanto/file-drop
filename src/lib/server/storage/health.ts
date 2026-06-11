import { access, mkdir } from 'node:fs/promises';

import { tempUploadDir, uploadRoot } from '$lib/server/config/paths';

export async function getStorageHealth() {
	try {
		await mkdir(uploadRoot, { recursive: true });
		await mkdir(tempUploadDir, { recursive: true });
		await access(uploadRoot);
		await access(tempUploadDir);

		return 'ready' as const;
	} catch {
		return 'unavailable' as const;
	}
}
