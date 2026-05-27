import { env as privateEnv } from '$env/dynamic/private';
import { z } from 'zod';

const envSchema = z.object({
	APP_DATA_DIR: z.string().trim().min(1),
	UPLOAD_ROOT: z.string().trim().min(1),
	TEMP_UPLOAD_DIR: z.string().trim().min(1),
	MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive(),
	MAX_FILES_PER_BATCH: z.coerce.number().int().positive(),
	SESSION_DAYS: z.coerce.number().int().positive(),
	PAIRING_CODE_TTL_SECONDS: z.coerce.number().int().positive()
});

export const env = envSchema.parse({
	APP_DATA_DIR: privateEnv.APP_DATA_DIR,
	UPLOAD_ROOT: privateEnv.UPLOAD_ROOT,
	TEMP_UPLOAD_DIR: privateEnv.TEMP_UPLOAD_DIR,
	MAX_FILE_SIZE_BYTES: privateEnv.MAX_FILE_SIZE_BYTES,
	MAX_FILES_PER_BATCH: privateEnv.MAX_FILES_PER_BATCH,
	SESSION_DAYS: privateEnv.SESSION_DAYS,
	PAIRING_CODE_TTL_SECONDS: privateEnv.PAIRING_CODE_TTL_SECONDS
});

export type ServerEnv = typeof env;
