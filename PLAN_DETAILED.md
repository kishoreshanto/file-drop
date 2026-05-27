## TL;DR

**Week 1 target:** a secure local MVP running on your Mac where your Android phone can pair once and upload ordinary images/documents into a Mac folder over Wi-Fi. **Do not use Docker in Week 1**; run SvelteKit through Node directly.

By the end of Day 7, you should have:

* Sv([Svelte][1])roduction server.
* SQLite database for devices, sessions and uploads.
* Mac-only admin pairing screen.
* Android pairing and authenticated upload screen.
* Files saved safely into `~/Pictures/PhoneDrop`.
* Upload history and device revocation.
* Verified real Android → Mac transfer over your local network.

`npx sv create` is the current official SvelteKit scaffolding command; `@sveltejs/adapter-node` generates the standalone Node server needed for local hosting. SvelteKit server actions/endpoints can read submitted `FormData`, and the Node adapter supports local runtime configuration such as `HOST`, `PORT`, `ORIGIN` and `BODY_SIZE_LIMIT`. ([Svelte][1]) scope boundary

## Build this week

* Local SvelteKit server.
* Android-accessible upload interface.
* SQLite database.
* Pairing-code authentication.
* Multiple-file upload for images, PDFs and ordinary files.
* Upload history.
* Trusted-device revocation.
* Production build runnable on your Mac.

## Do not build this week

* Docker.
* HTTPS.
* QR-code pairing.
* Chunked or resumable video uploads.
* Gallery thumbnails.
* Download-to-phone.
* Auto-start on Mac login.
* Multiple destination folders configurable through UI.

Large video transfer should wait until chunked uploads are implemented. The Week 1 multipart upload pipeline should deliberately target normal photos, screenshots, PDFs and documents.

---

# Technical decisions to lock before starting

| Concern                          | Week 1 decision                                   |
| -------------------------------- | ------------------------------------------------- |
| Project name                     | `phone-drop`                                      |
| Framework                        | SvelteKit + TypeScript                            |
| Runtime                          | Node.js, native on macOS                          |
| Adapter                          | `@sveltejs/adapter-node`                          |
| Database                         | SQLite using Drizzle ORM and `better-sqlite3`     |
| Upload storage in development    | `./.local-data/uploads`                           |
| Upload storage in real local use | `~/Pictures/PhoneDrop`                            |
| App data in real local use       | `~/Library/Application Support/PhoneDrop`         |
| Authentication                   | One-time pairing code → persistent session cookie |
| Admin access                     | Mac localhost only                                |
| Initial maximum file size        | 50 MB per file                                    |
| Initial request body limit       | 100 MB                                            |
| Package manager                  | `npm`                                             |
| Docker                           | Not used                                          |

Drizzle supports SQLite using local drivers including `better-sqlite3`, which fits a single-Mac local application. ([Drizzle ORM][2])— Create the project and prove Android can reach the Mac

## Goal

Create the SvelteKit project, switch it to a Node server architecture, and confirm that your Android phone can open the development app over local Wi-Fi.

## Tasks

### 1. Prepare the development directory

* [ ] Open Terminal on the Mac.
* [ ] Confirm Node.js and npm are installed:

```bash
node --version
npm --version
```

* [ ] Confirm Git is installed:

```bash
git --version
```

* [ ] Create or move into your projects directory:

```bash
mkdir -p ~/Projects
cd ~/Projects
```

### 2. Scaffold the SvelteKit app

* [ ] Create the application:

```bash
npx sv create phone-drop
```

* [ ] Choose these options when prompted:

```text
Template:        SvelteKit minimal app
Type checking:   TypeScript
Add-ons:         ESLint, Prettier, Vitest, Playwright
Package manager: npm
Install deps:    Yes
```

* [ ] Enter the project:

```bash
cd phone-drop
```

* [ ] Start the default app locally:

```bash
npm run dev
```

* [ ] Open the localhost address shown in Terminal on your Mac.
* [ ] Confirm the starter page loads.
* [ ] Stop the server with `Ctrl+C`.

The official SvelteKit creation flow uses `npx sv create`, and Svelte supports adding Vitest and Playwright during project creation for unit and end-to-end testing. ([Svelte][1])e the deployment adapter

New SvelteKit projects normally start with the automatic adapter. For your local server, use `adapter-node`.

* [ ] Install the Node adapter:

```bash
npm install -D @sveltejs/adapter-node
```

* [ ] Open `svelte.config.js`.
* [ ] Replace the adapter import with:

```js
import adapter from '@sveltejs/adapter-node';
```

* [ ] Ensure the configuration contains:

```js
kit: {
	adapter: adapter()
}
```

* [ ] Verify the application still builds:

```bash
npm run build
```

### 4. Create the initial application shell

* [ ] Replace the starter homepage with a simple PhoneDrop landing page.
* [ ] Display:

```text
PhoneDrop
Local Android-to-Mac file transfer
Server is running
```

* [ ] Create a minimal global style file or update the generated styling.
* [ ] Make the page readable on a narrow phone screen.

Files modified:

```text
src/routes/+page.svelte
src/app.css
svelte.config.js
```

### 5. Test local-network access from Android

* [ ] Connect the Mac and Android phone to the same Wi-Fi network.
* [ ] Find the Mac’s Wi-Fi IP address:

```bash
ipconfig getifaddr en0
```

* [ ] If that produces no result, try:

```bash
ipconfig getifaddr en1
```

* [ ] Start the development server exposed to the local network:

```bash
npm run dev -- --host
```

* [ ] On Android, open:

```text
http://<your-mac-ip>:5173
```

Example:

```text
http://192.168.0.42:5173
```

* [ ] Approve the macOS firewall prompt for local-network access if it appears.
* [ ] Confirm the PhoneDrop landing page loads on Android.

### Day 1 acceptance checklist

* [ ] `npm run dev` works on the Mac.
* [ ] `npm run build` succeeds.
* [ ] Android opens the app over Wi-Fi.
* [ ] No Docker installation or configuration exists.
* [ ] The project is committed to Git.

```bash
git init
git add .
git commit -m "Create SvelteKit PhoneDrop project with Node adapter"
```

---

# Day 2 — Establish configuration, SQLite and the data model

## Goal

Create a local application-data directory, an upload directory and a typed SQLite schema for trusted devices, sessions, pairing codes and upload history.

## Tasks

### 1. Install database and validation dependencies

* [ ] Install runtime dependencies:

```bash
npm install drizzle-orm better-sqlite3 zod
```

* [ ] Install development dependencies:

```bash
npm install -D drizzle-kit @types/better-sqlite3
```

### 2. Create local development storage

For development, keep application-generated files inside a local ignored directory. Do not write into your real Pictures folder yet.

* [ ] Create development directories:

```bash
mkdir -p .local-data/app
mkdir -p .local-data/uploads
mkdir -p .local-data/temp
```

* [ ] Add this to `.gitignore`:

```gitignore
.local-data/
.env.local
```

### 3. Create environment configuration

* [ ] Create `.env.example`:

```bash
APP_DATA_DIR="./.local-data/app"
UPLOAD_ROOT="./.local-data/uploads"
TEMP_UPLOAD_DIR="./.local-data/temp"

MAX_FILE_SIZE_BYTES="52428800"
MAX_FILES_PER_BATCH="20"

SESSION_DAYS="30"
PAIRING_CODE_TTL_SECONDS="300"
```

* [ ] Copy it for local development:

```bash
cp .env.example .env.local
```

* [ ] Create:

```text
src/lib/server/config/env.ts
src/lib/server/config/paths.ts
```

* [ ] In `env.ts`, validate required values with Zod.
* [ ] Read runtime-private settings through SvelteKit server-only environment access.
* [ ] In `paths.ts`, expose resolved absolute paths for:

```text
appDataDir
databasePath
uploadRoot
tempUploadDir
```

SvelteKit provides `$env/dynamic/private` for values that are available only on the server and are read at runtime, which is appropriate for local filesystem paths and size limits. ([Svelte][3]) the database layer

* [ ] Create the database folder structure:

```text
src/lib/server/db/
├── client.ts
├── schema.ts
└── migrations/
```

* [ ] Create `drizzle.config.ts` in the project root.
* [ ] Configure SQLite to use:

```text
.local-data/app/phone-drop.db
```

### 5. Define the initial database schema

* [ ] Add a `devices` table:

```text
id
name
created_at
last_seen_at
revoked_at
```

* [ ] Add a `sessions` table:

```text
id
device_id
token_hash
created_at
expires_at
revoked_at
```

* [ ] Add a `pairing_codes` table:

```text
id
code_hash
created_at
expires_at
used_at
```

* [ ] Add an `uploads` table:

```text
id
device_id
original_name
stored_path
mime_type
size_bytes
status
created_at
```

### 6. Generate and apply the database migration

* [ ] Add scripts to `package.json`:

```json
{
	"scripts": {
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate"
	}
}
```

* [ ] Generate migrations:

```bash
npm run db:generate
```

* [ ] Apply migrations:

```bash
npm run db:migrate
```

* [ ] Confirm the SQLite database file exists:

```bash
ls -la .local-data/app
```

### 7. Add a database health-check page

* [ ] Create a temporary server-loaded status indicator on the homepage.
* [ ] It should display:

```text
Database: connected
Upload directory: ready
```

* [ ] Ensure it exposes only status, not full filesystem paths.

Files created or modified:

```text
.env.example
.gitignore
drizzle.config.ts
src/lib/server/config/env.ts
src/lib/server/config/paths.ts
src/lib/server/db/client.ts
src/lib/server/db/schema.ts
src/routes/+page.server.ts
src/routes/+page.svelte
```

### Day 2 acceptance checklist

* [ ] Application starts with `.env.local`.
* [ ] Database is created locally.
* [ ] Migration can run from a clean state.
* [ ] Upload and temporary directories are created.
* [ ] No database or uploaded file is committed to Git.
* [ ] Home page reports healthy server-side storage setup.

```bash
git add .
git commit -m "Add local configuration and SQLite data model"
```

---

# Day 3 — Build the safe filesystem storage layer

## Goal

Implement the core service that receives a file-like object and safely stores it on the Mac without filename collisions or unsafe paths.

## Tasks

### 1. Create server-only file modules

* [ ] Create this structure:

```text
src/lib/server/files/
├── categories.ts
├── naming.ts
├── validation.ts
└── storage.ts
```

### 2. Implement file categorisation

* [ ] In `categories.ts`, map files into:

```text
images/
videos/
documents/
other/
```

* [ ] Support at least:

```text
image/jpeg
image/png
image/webp
image/heic
application/pdf
text/plain
application/vnd.openxmlformats-officedocument.wordprocessingml.document
video/mp4
```

* [ ] Categorise unknown file types as `other`.
* [ ] Do not trust the phone to choose the destination path.

### 3. Implement safe filenames

* [ ] In `naming.ts`, create a function that:

  * Removes `/`, `\`, null characters and unsafe path components.
  * Handles blank filenames.
  * Preserves a reasonable extension.
  * Adds a generated suffix to prevent overwrites.

Example expected transformation:

```text
Original: IMG_20260527_143000.jpg
Stored:   IMG_20260527_143000_f5a128.jpg
```

* [ ] Use built-in cryptographic randomness or UUID generation for the suffix.
* [ ] Ensure two uploads with the same original filename never overwrite each other.

### 4. Implement validation

* [ ] In `validation.ts`, implement checks for:

```text
maximum file size
maximum files per request
empty filename
path traversal attempt
blocked filename patterns
supported versus unknown MIME type
```

* [ ] Reject dangerous path-style names such as:

```text
../../Documents/private.txt
..\..\secret.txt
```

* [ ] Permit unknown ordinary files only into `other/`.
* [ ] Reject executable/script transfer for the MVP:

```text
.app
.dmg
.pkg
.sh
.command
.exe
```

### 5. Implement safe storage

* [ ] In `storage.ts`, create functions for:

```ts
ensureStorageDirectories()
prepareTemporaryFile()
saveCompletedFile()
removeTemporaryFile()
```

* [ ] Organise completed uploads using date-based folders:

```text
images/2026/05/27/
documents/2026/05/27/
other/2026/05/27/
```

* [ ] Write into the temporary directory first.
* [ ] Move the completed file to the final folder only after successful validation.
* [ ] Return a relative stored path suitable for recording in SQLite.

### 6. Unit-test storage rules

* [ ] Create unit tests for:

```text
safe filename generation
duplicate-name handling
path traversal rejection
file category mapping
blocked extension rejection
date-based destination creation
```

* [ ] Run unit tests:

```bash
npm run test
```

Use the exact test script generated in `package.json` if its name differs.

### Day 3 acceptance checklist

* [ ] Safe filename functions are tested.
* [ ] Upload directory layout is generated correctly.
* [ ] A test file can be written into `.local-data/uploads`.
* [ ] No uploaded file can choose its own absolute destination.
* [ ] Filename collisions cannot overwrite existing files.
* [ ] Unsafe extensions and path traversal names are rejected.

```bash
git add .
git commit -m "Implement safe local file storage service"
```

---

# Day 4 — Implement device pairing and authentication

## Goal

Only a paired Android phone should be able to upload files. The Mac should generate pairing codes, and the phone should retain a revocable authenticated session.

## Authentication flow

```text
Mac opens /admin locally
        ↓
Generate temporary pairing code
        ↓
Android opens /pair and submits code
        ↓
Server creates trusted device and session cookie
        ↓
Android may access /upload
```

SvelteKit server hooks run on incoming requests and can place authenticated state into `event.locals`, making them suitable for loading the trusted device session for protected routes. ([Svelte][4]) 1. Define application locals

* [ ] Update `src/app.d.ts`.
* [ ] Add a typed authenticated-device local:

```ts
interface Locals {
	device: {
		id: string;
		name: string;
	} | null;
}
```

### 2. Create authentication modules

* [ ] Create:

```text
src/lib/server/auth/
├── pairing.ts
├── sessions.ts
├── cookies.ts
└── guards.ts
```

### 3. Implement temporary pairing codes

* [ ] Generate a random human-enterable code, for example:

```text
583 291
```

* [ ] Hash the code before storing it.
* [ ] Store expiry time.
* [ ] Default expiry:

```text
5 minutes
```

* [ ] Ensure a pairing code can only be used once.
* [ ] Delete or invalidate expired codes.

### 4. Implement device sessions

* [ ] Generate a strong random session token.
* [ ] Store only its hash in SQLite.
* [ ] Send the raw token to the phone only as a cookie.
* [ ] Set the cookie with:

```text
HttpOnly
SameSite=Strict
Path=/
```

* [ ] Do not set `Secure` yet because Week 1 uses local HTTP.
* [ ] Add an expiry based on `SESSION_DAYS`.

### 5. Load session state in `hooks.server.ts`

* [ ] Create:

```text
src/hooks.server.ts
```

* [ ] For every request:

  * Read the session cookie.
  * Hash and look it up.
  * Reject revoked or expired sessions.
  * Place the trusted device into `event.locals.device`.
  * Continue the request.

### 6. Create the Mac-only admin page

* [ ] Create:

```text
src/routes/admin/
├── +page.server.ts
└── +page.svelte
```

* [ ] Restrict `/admin` access to requests originating from the Mac itself:

```text
127.0.0.1
::1
```

* [ ] Open the admin page from the Mac using:

```text
http://localhost:5173/admin
```

* [ ] Add a button:

```text
Generate pairing code
```

* [ ] Display:

```text
Pairing code
Expiry time
```

### 7. Create the Android pairing page

* [ ] Create:

```text
src/routes/pair/
├── +page.server.ts
└── +page.svelte
```

* [ ] Add fields:

```text
Device name
Pairing code
```

* [ ] On successful pairing:

  * Create device.
  * Create session.
  * Set cookie.
  * Redirect to `/upload`.

* [ ] On failure:

  * Return a safe validation error.
  * Do not reveal whether a stored code existed.

### 8. Protect future upload pages

* [ ] Create a server guard helper:

```ts
requireDevice(event.locals.device)
```

* [ ] Ensure `/upload` redirects unpaired phones to `/pair`.

### Day 4 acceptance checklist

* [ ] `/admin` opens on the Mac using localhost.
* [ ] `/admin` is blocked when opened from Android.
* [ ] Mac can generate a temporary pairing code.
* [ ] Android can pair using the code.
* [ ] A paired Android browser receives a session cookie.
* [ ] Expired pairing codes fail.
* [ ] Reusing the same pairing code fails.
* [ ] An unpaired Android browser cannot open `/upload`.

```bash
git add .
git commit -m "Add device pairing and session authentication"
```

---

# Day 5 — Build authenticated file upload from Android to Mac

## Goal

Upload real files from Android and save them safely into the Mac development upload directory.

## Week 1 upload limits

Set conservative MVP limits:

```text
Maximum file size:       50 MB
Maximum files per batch: 20
Maximum HTTP request:    100 MB
```

For Week 1, use `multipart/form-data`. SvelteKit server handlers can read submitted form data using `request.formData()`. This is appropriate for ordinary photos and documents, while larger resumable videos should be a later chunked-upload feature. ([Svelte][5]) 1. Create the upload page

* [ ] Create:

```text
src/routes/upload/
├── +page.server.ts
└── +page.svelte
```

* [ ] Protect the route using the authenticated device session.
* [ ] Display the paired device name.
* [ ] Add a multiple-file input:

```html
<input type="file" multiple />
```

* [ ] Configure mobile-friendly selection for:

```text
images
documents
camera/gallery files
```

### 2. Create upload UI components

* [ ] Create:

```text
src/lib/components/
├── FilePicker.svelte
├── UploadQueue.svelte
├── UploadProgress.svelte
└── UploadResult.svelte
```

* [ ] Show selected filenames before transfer.
* [ ] Show total selected file count.
* [ ] Show validation errors before submission where possible.
* [ ] Disable the submit button while transferring.

### 3. Create the upload endpoint

* [ ] Create:

```text
src/routes/api/uploads/+server.ts
```

* [ ] Implement authenticated `POST` handling.
* [ ] Read multipart form data.
* [ ] Extract every submitted `File`.
* [ ] Reject requests without an authenticated device.
* [ ] Enforce:

```text
file-count limit
per-file size limit
safe filename validation
blocked extension validation
```

### 4. Connect uploads to the storage layer

* [ ] For each accepted file:

  * Generate safe stored filename.
  * Choose category folder.
  * Write to temporary storage.
  * Finalise into date-based destination directory.
  * Insert an `uploads` database record.

* [ ] For each rejected file:

  * Return a clear file-specific error.
  * Do not leave a partial file behind.

* [ ] Return a JSON summary:

```json
{
	"accepted": [],
	"rejected": []
}
```

### 5. Add browser upload progress

A basic HTML form works, but an Android transfer screen benefits from visible progress.

* [ ] Implement client-side upload using `XMLHttpRequest` so upload progress events are available.
* [ ] Show:

```text
upload percentage
current status
success or failure
```

* [ ] Prevent accidental double submission.
* [ ] Preserve selected error results after completion.

### 6. Perform the first real Android upload

* [ ] Start development mode on the Mac:

```bash
npm run dev -- --host
```

* [ ] Open the app from Android.
* [ ] Pair the phone.
* [ ] Upload:

```text
one camera photo
one screenshot
one PDF or document
```

* [ ] Verify the actual files appear under:

```text
.local-data/uploads/
```

* [ ] Verify uploaded file records exist in SQLite.

### Day 5 acceptance checklist

* [ ] Unpaired phones cannot upload.
* [ ] Paired Android phone can select multiple files.
* [ ] Real files appear on the Mac.
* [ ] Original names are preserved in metadata.
* [ ] Stored filenames do not collide.
* [ ] Upload progress appears on Android.
* [ ] Invalid or oversized files fail cleanly.
* [ ] No temporary file remains after failed upload.

```bash
git add .
git commit -m "Implement authenticated Android file upload"
```

---

# Day 6 — Add history, trusted-device controls and safety hardening

## Goal

Make the MVP manageable: view uploads, revoke a paired device, and ensure the server fails safely.

## Tasks

### 1. Create Android upload history

* [ ] Create:

```text
src/routes/history/
├── +page.server.ts
└── +page.svelte
```

* [ ] Allow the authenticated phone to view its own recent uploads only.
* [ ] Show:

```text
original filename
file category
size
upload date/time
success status
```

* [ ] Do not expose absolute Mac filesystem paths.
* [ ] Link `/upload` and `/history` in the mobile navigation.

### 2. Create admin device management

* [ ] Extend:

```text
src/routes/admin/+page.server.ts
src/routes/admin/+page.svelte
```

* [ ] Display trusted devices:

```text
device name
paired date
last seen date
status
```

* [ ] Add a `Revoke` action.
* [ ] On revoke:

  * Mark the device revoked.
  * Revoke all of that device’s sessions.
  * Ensure future uploads from that phone fail.

### 3. Create admin upload summary

* [ ] Display on the Mac admin page:

```text
total successful uploads
latest uploads
storage folder health
paired device count
```

* [ ] Keep the admin page localhost-only.

### 4. Add safer error handling

* [ ] Add consistent server errors for:

```text
unauthenticated access
revoked device
expired session
oversized file
too many files
storage write failure
database failure
```

* [ ] Ensure errors shown on Android are useful but do not expose:

```text
raw stack traces
absolute paths
database details
session tokens
```

### 5. Add route and service tests

* [ ] Add unit tests for:

```text
expired pairing code
revoked session
unsafe filename
oversized file
blocked extension
```

* [ ] Add integration tests for:

```text
pair device successfully
reject unpaired upload
accept paired upload
revoke device
reject upload after revocation
```

* [ ] Add one Playwright browser test for the pairing-to-upload navigation flow.

### 6. Test realistic failure cases manually

* [ ] Attempt upload from an incognito Android browser before pairing.
* [ ] Attempt upload after revoking the device.
* [ ] Upload two files with the same name.
* [ ] Upload a file larger than your configured limit.
* [ ] Attempt uploading a blocked extension.
* [ ] Interrupt Wi-Fi during an upload.
* [ ] Confirm failed transfers do not show as completed.

### Day 6 acceptance checklist

* [ ] Android displays its own recent transfer history.
* [ ] Mac displays paired devices.
* [ ] Mac can revoke Android access.
* [ ] Revoked device cannot upload again without re-pairing.
* [ ] Errors do not leak internal data.
* [ ] Unit and integration tests pass.

```bash
git add .
git commit -m "Add upload history device revocation and safety checks"
```

---

# Day 7 — Run the local production build on the Mac

## Goal

Stop relying on the development server and operate the application as the actual local Mac-hosted service.

## Tasks

### 1. Create the real Mac storage directories

* [ ] Create the production application-data folder:

```bash
mkdir -p "$HOME/Library/Application Support/PhoneDrop"
mkdir -p "$HOME/Library/Application Support/PhoneDrop/temp"
```

* [ ] Create the production upload folder:

```bash
mkdir -p "$HOME/Pictures/PhoneDrop"
```

### 2. Create production-local environment configuration

* [ ] Find your Mac local-network IP again:

```bash
ipconfig getifaddr en0
```

* [ ] Create `.env.production.local`:

```bash
HOST="0.0.0.0"
PORT="3000"
ORIGIN="http://192.168.0.42:3000"
BODY_SIZE_LIMIT="100M"

APP_DATA_DIR="/Users/YOUR_MAC_USERNAME/Library/Application Support/PhoneDrop"
UPLOAD_ROOT="/Users/YOUR_MAC_USERNAME/Pictures/PhoneDrop"
TEMP_UPLOAD_DIR="/Users/YOUR_MAC_USERNAME/Library/Application Support/PhoneDrop/temp"

MAX_FILE_SIZE_BYTES="52428800"
MAX_FILES_PER_BATCH="20"

SESSION_DAYS="30"
PAIRING_CODE_TTL_SECONDS="300"
```

* [ ] Replace `192.168.0.42` with your real Mac IP.
* [ ] Replace `YOUR_MAC_USERNAME` with your real macOS username.
* [ ] Ensure `.env.production.local` is ignored by Git.

`adapter-node` builds a standalone server with `npm run build`. Its server can be configured with `HOST`, `PORT`, `ORIGIN` and `BODY_SIZE_LIMIT`; setting an adequate body-size limit is essential because the adapter’s default request limit is too small for ordinary phone photos. ([Svelte][6])the application

* [ ] Stop the development server.
* [ ] Run all checks:

```bash
npm run check
npm run test
npm run build
```

* [ ] Confirm a `build/` output directory exists.

### 4. Run the built local server

For Node versions supporting environment-file loading:

* [ ] Start the production-local server:

```bash
node --env-file=.env.production.local build
```

* [ ] On the Mac, open:

```text
http://localhost:3000/admin
```

* [ ] On Android, open:

```text
http://<your-mac-ip>:3000
```

* [ ] Pair the Android phone again in this production-local environment.
* [ ] Upload several real files.

### 5. Verify actual Mac storage

* [ ] Confirm uploaded files appear under:

```text
~/Pictures/PhoneDrop/
```

Expected example:

```text
~/Pictures/PhoneDrop/
├── images/
│   └── 2026/
│       └── 05/
│           └── 27/
│               └── IMG_20260527_143000_f5a128.jpg
└── documents/
    └── 2026/
        └── 05/
            └── 27/
                └── notes_a137c4.pdf
```

* [ ] Confirm application state exists separately:

```text
~/Library/Application Support/PhoneDrop/
├── phone-drop.db
└── temp/
```

### 6. Add operational documentation

* [ ] Create `README.md` sections for:

```text
Purpose
Development setup
Environment configuration
How to run locally
How to find Mac IP address
How to pair Android
Where files are stored
How to revoke a device
Known Week 1 limitations
```

* [ ] Add a clear warning:

```text
Do not configure router port forwarding for this application.
```

### 7. Final real-device acceptance test

* [ ] Mac and Android are on the same Wi-Fi network.
* [ ] Production server starts from the built application.
* [ ] Mac opens `/admin` through `localhost`.
* [ ] Android cannot access `/admin`.
* [ ] Android pairs successfully.
* [ ] Android uploads at least:

```text
3 photos
1 screenshot
1 PDF/document
```

* [ ] All files appear in `~/Pictures/PhoneDrop`.
* [ ] Uploaded filenames do not overwrite one another.
* [ ] Upload history displays correctly.
* [ ] Revoking Android blocks further uploads.
* [ ] Re-pairing restores access.
* [ ] Server stops when you terminate the Node process.
* [ ] No router or public internet configuration was used.

### Day 7 acceptance checklist

* [ ] App runs using the production Node build.
* [ ] Android-to-Mac transfer works over local Wi-Fi.
* [ ] Real files save in `~/Pictures/PhoneDrop`.
* [ ] SQLite state saves in Application Support.
* [ ] Pairing and revocation work.
* [ ] README explains startup and usage.
* [ ] Week 1 MVP is complete.

```bash
git add .
git commit -m "Complete local PhoneDrop MVP production workflow"
```

---

# Expected project structure at the end of Week 1

```text
phone-drop/
├── .env.example
├── .env.production.local        # ignored
├── .env.local                   # ignored
├── .gitignore
├── README.md
├── drizzle.config.ts
├── package.json
├── svelte.config.js
├── src/
│   ├── app.css
│   ├── app.d.ts
│   ├── hooks.server.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── FilePicker.svelte
│   │   │   ├── UploadProgress.svelte
│   │   │   ├── UploadQueue.svelte
│   │   │   └── UploadResult.svelte
│   │   └── server/
│   │       ├── auth/
│   │       │   ├── cookies.ts
│   │       │   ├── guards.ts
│   │       │   ├── pairing.ts
│   │       │   └── sessions.ts
│   │       ├── config/
│   │       │   ├── env.ts
│   │       │   └── paths.ts
│   │       ├── db/
│   │       │   ├── client.ts
│   │       │   ├── migrations/
│   │       │   └── schema.ts
│   │       └── files/
│   │           ├── categories.ts
│   │           ├── naming.ts
│   │           ├── storage.ts
│   │           └── validation.ts
│   └── routes/
│       ├── +page.server.ts
│       ├── +page.svelte
│       ├── admin/
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       ├── api/
│       │   └── uploads/
│       │       └── +server.ts
│       ├── history/
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       ├── pair/
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       └── upload/
│           ├── +page.server.ts
│           └── +page.svelte
├── static/
├── tests/
└── .local-data/                 # ignored, development only
```

---

# Week 1 definition of done

The MVP is complete only when all of the following are true:

* [ ] The app is built with SvelteKit and `adapter-node`.
* [ ] Docker is not required.
* [ ] The production-local Node build runs on the Mac.
* [ ] Android can connect over the same Wi-Fi network.
* [ ] Upload access requires pairing.
* [ ] The admin interface is available only from the Mac.
* [ ] Android can upload multiple ordinary files.
* [ ] Files are stored safely in `~/Pictures/PhoneDrop`.
* [ ] SQLite tracks devices, sessions and upload history.
* [ ] Revoking the Android device immediately blocks further uploads.
* [ ] Filename collisions and path traversal attacks are prevented.
* [ ] The app is not exposed through router port forwarding.
* [ ] Known limitation is documented: large videos and resumable transfers are postponed until a later phase.

[1]: https://svelte.dev/docs/kit/creating-a-project?utm_source=chatgpt.com "Creating a project • SvelteKit Docs"
[2]: https://orm.drizzle.team/docs/get-started-sqlite?utm_source=chatgpt.com "SQLite - Drizzle ORM"
[3]: https://svelte.dev/docs/kit/%24env-dynamic-private?utm_source=chatgpt.com "$env/dynamic/private • SvelteKit Docs"
[4]: https://svelte.dev/docs/kit/hooks?utm_source=chatgpt.com "Hooks • SvelteKit Docs"
[5]: https://svelte.dev/docs/kit/form-actions?utm_source=chatgpt.com "Form actions • SvelteKit Docs"
[6]: https://svelte.dev/docs/kit/adapter-node?utm_source=chatgpt.com "Node servers • SvelteKit Docs"
