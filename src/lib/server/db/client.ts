import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { databasePath } from '$lib/server/config/paths';
import * as schema from './schema';

mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);

export const db = drizzle(sqlite, { schema });
export { sqlite };
