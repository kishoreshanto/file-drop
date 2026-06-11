import type { PageServerLoad } from './$types';
import { requireDevice } from '$lib/server/auth/guards';
import { listUploadsForDevice } from '$lib/server/uploads/repository';

export const load: PageServerLoad = async ({ locals }) => {
	const device = requireDevice(locals.device);

	return {
		device,
		uploads: listUploadsForDevice(device.id)
	};
};
