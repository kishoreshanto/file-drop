# File Drop

Local Android-to-Mac file transfer that runs on your Mac and stays on your private network.

The Mac hosts the SvelteKit server, stores files on disk, and keeps lightweight metadata in SQLite. The Android phone is just a browser client.

## Goals

- Local network only. No cloud dependency.
- Pair devices once with a short-lived code.
- Upload multiple files with safe server-side validation.
- Save files into normal Mac folders with organized paths.
- Keep metadata in a local SQLite database.

For deeper design notes, see `PLAN.md`.

## What is implemented

- Mac-only admin page to generate pairing codes.
- Device pairing flow and session cookie.
- Upload page with queue, progress, and per-file status.
- Multipart upload API with validation and safe filename handling.
- Storage layout by category and date (images, videos, documents, other).
- SQLite persistence for devices, sessions, pairing codes, and uploads.

## Routes

- `/` - server health and storage status (Mac view)
- `/admin` - generate pairing codes (Mac only)
- `/pair` - enter pairing code on the phone
- `/upload` - upload files after pairing
- `/api/uploads` - multipart upload endpoint

## Tech stack

- SvelteKit + adapter-node
- SQLite (better-sqlite3 + drizzle)
- TypeScript, Zod, Tailwind

## Configuration

Copy the sample env file and edit paths and limits as needed:

```sh
cp .env.example .env
```

Environment variables:

```ini
APP_DATA_DIR=./.local-data/app
UPLOAD_ROOT=./.local-data/uploads
TEMP_UPLOAD_DIR=./.local-data/temp

MAX_FILE_SIZE_BYTES=52428800
MAX_FILES_PER_BATCH=20

SESSION_DAYS=30
PAIRING_CODE_TTL_SECONDS=300
```

Recommended Mac values for local use (example):

```ini
APP_DATA_DIR="/Users/yourname/Library/Application Support/FileDrop"
UPLOAD_ROOT="/Users/yourname/Pictures/FileDrop"
TEMP_UPLOAD_DIR="/Users/yourname/Library/Application Support/FileDrop/temp"
```

If you change `APP_DATA_DIR`, update `drizzle.config.ts` so migrations target the same database path.

## Setup

```sh
npm install
npm run db:migrate
```

## Development

```sh
npm run dev
```

To access from a phone on the same Wi-Fi:

```sh
npm run dev -- --host
```

Then open `http://<mac-local-ip>:5173` on Android.

## Local production run

```sh
npm run build
HOST=0.0.0.0 PORT=3000 node build
```

If you plan to upload large files, also set `BODY_SIZE_LIMIT` (SvelteKit adapter-node) to a larger value.

## Typical flow

1. Start the server on the Mac.
2. Open `http://localhost:5173/admin` on the Mac and generate a pairing code.
3. Open `http://<mac-local-ip>:5173/pair` on the phone and enter the code.
4. Upload files from `http://<mac-local-ip>:5173/upload`.

## Storage layout

Uploads are categorized and stored by date:

```text
uploads/
  images/2026/05/27/IMG_20260527_112233_a81c.jpg
  documents/2026/05/27/Report_1e2f.pdf
  videos/2026/05/27/Clip_9b7a.mp4
  other/2026/05/27/Archive_7c01.zip
```

The database lives in `APP_DATA_DIR` as `file-drop.db`.

## Scripts

- `npm run dev` - dev server
- `npm run build` - production build
- `npm run preview` - preview build
- `npm run db:generate` - generate migrations
- `npm run db:migrate` - run migrations
- `npm run lint` - lint and format check
- `npm run format` - format code
- `npm test` - run unit tests

## Security notes

- The admin page is localhost-only.
- Pairing codes are one-time and time-limited.
- Sessions are stored as hashes and use httpOnly cookies.
- Keep the server on trusted Wi-Fi only.
