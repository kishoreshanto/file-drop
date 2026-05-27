import type { PageServerLoad } from './$types';
import { requireDevice } from '$lib/server/auth/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const device = requireDevice(locals.device);

	return {
		device
	};
};
