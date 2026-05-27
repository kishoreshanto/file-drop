import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const devices = sqliteTable(
	'devices',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
		revokedAt: integer('revoked_at', { mode: 'timestamp_ms' })
	},
	(table) => [index('devices_revoked_at_idx').on(table.revokedAt)]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		deviceId: text('device_id')
			.notNull()
			.references(() => devices.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		revokedAt: integer('revoked_at', { mode: 'timestamp_ms' })
	},
	(table) => [
		uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
		index('sessions_device_id_idx').on(table.deviceId),
		index('sessions_expires_at_idx').on(table.expiresAt)
	]
);

export const pairingCodes = sqliteTable(
	'pairing_codes',
	{
		id: text('id').primaryKey(),
		codeHash: text('code_hash').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		usedAt: integer('used_at', { mode: 'timestamp_ms' })
	},
	(table) => [
		uniqueIndex('pairing_codes_code_hash_idx').on(table.codeHash),
		index('pairing_codes_expires_at_idx').on(table.expiresAt)
	]
);

export const uploads = sqliteTable(
	'uploads',
	{
		id: text('id').primaryKey(),
		deviceId: text('device_id')
			.notNull()
			.references(() => devices.id, { onDelete: 'cascade' }),
		originalName: text('original_name').notNull(),
		storedPath: text('stored_path').notNull(),
		mimeType: text('mime_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		status: text('status', { enum: ['uploading', 'complete', 'failed', 'deleted'] }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
	},
	(table) => [
		index('uploads_device_id_idx').on(table.deviceId),
		index('uploads_created_at_idx').on(table.createdAt),
		index('uploads_status_idx').on(table.status)
	]
);

export type Device = InferSelectModel<typeof devices>;
export type NewDevice = InferInsertModel<typeof devices>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type PairingCode = InferSelectModel<typeof pairingCodes>;
export type NewPairingCode = InferInsertModel<typeof pairingCodes>;
export type Upload = InferSelectModel<typeof uploads>;
export type NewUpload = InferInsertModel<typeof uploads>;
