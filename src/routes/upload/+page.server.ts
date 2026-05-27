import type { PageServerLoad } from './$types';
import { requireDevice } from '$lib/server/auth/guards';
import { env } from '$lib/server/config/env';

export const load: PageServerLoad = async ({ locals }) => {
	const device = requireDevice(locals.device);

	return {
		device,
		limits: {
			maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES,
			maxFilesPerBatch: env.MAX_FILES_PER_BATCH
		}
	};
};
