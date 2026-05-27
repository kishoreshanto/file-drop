## TL;DR

Build a **single SvelteKit application running directly on your Mac**, accessible only over your local network. The Android phone is merely a browser client; the Mac performs authentication, receives uploads, stores files in a chosen folder, and keeps lightweight metadata locally.

**Docker is not needed and is not recommended for the first version.** Running the Node server natively is simpler, especially because the app must write directly to your Mac filesystem.

---

# 1. System goal

A private “phone-to-Mac dropbox” application:

* Runs only on your Mac.
* Accessible from your Android phone while both devices are on the same Wi-Fi network.
* Uploads images, documents, and optionally videos.
* Stores uploaded files in a normal Mac folder.
* Requires pairing or authentication so other devices on the same network cannot upload files.
* Has no cloud dependency and no public deployment.

Assumption: you primarily want **Android → Mac uploads**, with optional browsing/download features later.

---

# 2. Recommended system architecture

```text
┌───────────────────────────────┐
│ Android Phone                  │
│ Browser / Add-to-Home-Screen   │
│                               │
│ - Pair device                  │
│ - Select camera/gallery/files  │
│ - Upload files                 │
│ - View upload results          │
└───────────────┬───────────────┘
                │
                │ Local Wi-Fi only
                │ HTTP initially / HTTPS later
                ▼
┌───────────────────────────────┐
│ MacBook                        │
│ SvelteKit + adapter-node       │
│                               │
│ - Mobile web UI                │
│ - Authentication               │
│ - Upload API                   │
│ - File validation              │
│ - Metadata management          │
│ - Admin/settings UI            │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌───────────────┐  ┌────────────────────────┐
│ SQLite DB     │  │ Mac Filesystem         │
│               │  │                        │
│ - Devices     │  │ ~/Pictures/PhoneDrop/ │
│ - Sessions    │  │ ~/Downloads/PhoneDrop/│
│ - Upload log  │  │                        │
│ - Settings    │  │ Actual uploaded files  │
└───────────────┘  └────────────────────────┘
```

SvelteKit is suitable because server-side routes and form actions can receive uploaded `FormData`, use server-only filesystem code, and set authentication cookies. `@sveltejs/adapter-node` builds a standalone Node server for running locally on your Mac. ([Svelte][1])

---

# 3. Technology choices

| Concern              | Recommended choice                    | Reason                                       |
| -------------------- | ------------------------------------- | -------------------------------------------- |
| Framework            | SvelteKit + TypeScript                | One project for UI and server code           |
| Runtime              | Node.js with `@sveltejs/adapter-node` | Native local server; no cloud required       |
| UI                   | Mobile-first responsive Svelte pages  | Your phone is the primary client             |
| File storage         | Normal directory on the Mac           | Files remain easy to access outside the app  |
| Metadata             | SQLite                                | Small, local, reliable, single-file database |
| Authentication       | Device pairing code + session cookie  | Better than repeatedly entering a PIN        |
| Upload method, MVP   | Multipart upload                      | Simple for images and documents              |
| Upload method, later | Chunked/resumable upload              | Better for large videos or unstable Wi-Fi    |
| Background launch    | macOS `launchd`, later                | Starts automatically without Docker          |
| Deployment           | Native Node process                   | Least complexity for one Mac                 |

---

# 4. Docker: do you need it?

## Recommendation: do not use Docker initially

You do not need Docker because `adapter-node` already generates a standalone Node server that can run locally using `node build`. The official SvelteKit adapter supports host, port, origin, and request-size configuration through environment variables. ([Svelte][2])

Docker would add work without solving your main problem:

| Without Docker                         | With Docker                                          |
| -------------------------------------- | ---------------------------------------------------- |
| App writes directly to Mac folders     | You must configure volume mounts                     |
| Easy local debugging                   | Extra container debugging layer                      |
| Easy access to selected upload folders | macOS folder permission issues can be more confusing |
| One Node process                       | Docker Desktop/container runtime required            |
| Easy `launchd` auto-start later        | Additional startup orchestration                     |

Docker becomes reasonable only if you later want to distribute the application to multiple computers, guarantee an identical runtime environment, or package several services together.

For your current case:

```text
SvelteKit + Node + local folder + SQLite
```

is the correct starting architecture.

---

# 5. Network architecture

## Development

During development, run the app so your Android phone can access it:

```bash
npm run dev -- --host
```

Vite normally listens only on localhost; `--host` exposes the development server to devices on the local network. ([vitejs][3])

## Local production use

Build and run the local application:

```bash
npm run build
HOST=0.0.0.0 PORT=3000 BODY_SIZE_LIMIT=100M node build
```

`adapter-node` listens on `0.0.0.0:3000` by default, and its request body limit defaults to only `512K`; uploads therefore require a larger configured `BODY_SIZE_LIMIT`. ([Svelte][2])

From Android, you open:

```text
http://<mac-local-ip>:3000
```

Example:

```text
http://192.168.0.42:3000
```

## Important network rule

Do **not** configure router port forwarding. The app should be reachable only inside your Wi-Fi network.

For better control, your app should display its current local access URL on the Mac admin screen.

---

# 6. Security architecture

Even though the application is local-only, any device on the same Wi-Fi network may be able to reach the server while it is running.

## Recommended authentication model: device pairing

Do not make the phone enter a permanent password every time. Instead:

1. Open the app locally on the Mac.
2. The Mac displays a temporary pairing code or QR code.
3. The Android phone opens the app and enters/scans that code.
4. The server creates a trusted-device session.
5. Future uploads from that phone use the stored session cookie.
6. The Mac admin page can revoke the phone at any time.

```text
Mac admin page
     │
     │ generates one-time pairing code
     ▼
Android phone pairs once
     │
     │ receives session cookie
     ▼
Uploads allowed until revoked or expired
```

## Security rules

| Area                   | Rule                                                          |
| ---------------------- | ------------------------------------------------------------- |
| Pairing code           | One-time use, expires after 5 minutes                         |
| Device session         | Random token, stored only as a hash in SQLite                 |
| Cookie                 | `HttpOnly`, `SameSite=Strict`; `Secure` once HTTPS is enabled |
| Brute-force protection | Limit pairing attempts per IP/device                          |
| Upload authorization   | Every upload endpoint requires an authenticated session       |
| File destination       | Chosen only by server configuration, never by the phone       |
| Filenames              | Sanitize names and generate safe stored filenames             |
| Admin interface        | Accessible only from the Mac itself, or protected separately  |
| Upload limits          | Maximum size and total storage cap                            |
| Public exposure        | Never enable router port forwarding                           |

SvelteKit supports setting and reading cookies from server-side request handlers and form actions; its cookie APIs default to `httpOnly` and `sameSite=lax`, with secure handling requiring care when using plain local HTTP. ([Svelte][1])

## HTTP versus HTTPS

For the MVP, using HTTP on your private home Wi-Fi is acceptable if you understand the limitation: authentication traffic is not encrypted at the application layer.

A stronger later version should support local HTTPS. Until then:

* Use the app only on trusted home Wi-Fi.
* Use a temporary pairing code rather than a valuable reusable password.
* Keep the server stopped when not needed.
* Do not use the app on public Wi-Fi.

---

# 7. File storage architecture

Do not store uploaded files inside the SvelteKit project directory or the generated `build` directory.

## Recommended Mac storage layout

```text
~/Pictures/PhoneDrop/
├── images/
│   └── 2026/
│       └── 05/
│           └── 27/
│               ├── IMG_20260527_112233_a81c.jpg
│               └── Screenshot_20260527_114530_3db2.png
├── videos/
│   └── 2026/
│       └── 05/
│           └── 27/
├── documents/
│   └── 2026/
│       └── 05/
│           └── 27/
└── other/
    └── 2026/
        └── 05/
            └── 27/
```

Application state should live separately:

```text
~/Library/Application Support/PhoneDrop/
├── app.db
├── config.json
├── logs/
└── temp/
    └── unfinished-uploads/
```

## Storage rules

* Files are categorised by server-detected MIME type and extension.
* The original filename is preserved in metadata.
* The stored filename includes a generated identifier to prevent collisions.
* Partial uploads go into `temp/`.
* A completed upload is atomically moved into its final directory.
* Database records store paths relative to the configured upload root.
* The app must reject paths containing traversal attempts such as `../`.

## Example stored metadata

```text
Original file: IMG_20260527_112233.jpg
Stored file:   images/2026/05/27/IMG_20260527_112233_a81c.jpg
Device:        Kishore's Android
Uploaded at:   2026-05-27 11:25:08
Size:          4.8 MB
Type:          image/jpeg
Checksum:      optional SHA-256 value
```

---

# 8. Database architecture

SQLite is appropriate because the application is single-user, local, and does not need a database server.

## Core tables

### `settings`

| Column  | Purpose                    |
| ------- | -------------------------- |
| `key`   | Setting name               |
| `value` | Stored configuration value |

Examples:

```text
upload_root
max_upload_size
pairing_enabled
organize_by_date
```

### `devices`

| Column         | Purpose                               |
| -------------- | ------------------------------------- |
| `id`           | Device identifier                     |
| `name`         | Display name, such as `Android Phone` |
| `created_at`   | Pairing timestamp                     |
| `last_seen_at` | Last successful request               |
| `revoked_at`   | Revocation timestamp, nullable        |

### `sessions`

| Column       | Purpose                |
| ------------ | ---------------------- |
| `id`         | Session identifier     |
| `device_id`  | Related trusted device |
| `token_hash` | Hashed session token   |
| `expires_at` | Session expiry         |
| `created_at` | Creation timestamp     |

### `pairing_codes`

| Column       | Purpose                      |
| ------------ | ---------------------------- |
| `id`         | Record identifier            |
| `code_hash`  | Hashed temporary code        |
| `expires_at` | Short expiry                 |
| `used_at`    | Pairing completion timestamp |

### `uploads`

| Column          | Purpose                                      |
| --------------- | -------------------------------------------- |
| `id`            | Upload identifier                            |
| `device_id`     | Uploading device                             |
| `original_name` | Filename from phone                          |
| `stored_path`   | Mac-relative file path                       |
| `mime_type`     | Browser/server-provided media type           |
| `size_bytes`    | Final file size                              |
| `checksum`      | Optional verification hash                   |
| `status`        | `uploading`, `complete`, `failed`, `deleted` |
| `created_at`    | Upload timestamp                             |

---

# 9. Application features by version

## Version 1: secure MVP

This is the version worth building first.

| Feature                          | Included |
| -------------------------------- | -------- |
| Mac server running locally       | Yes      |
| Mobile upload page               | Yes      |
| Select multiple files            | Yes      |
| Images/documents upload          | Yes      |
| Destination folder configuration | Yes      |
| Pair Android device              | Yes      |
| Device session authentication    | Yes      |
| Upload history                   | Yes      |
| File collision prevention        | Yes      |
| Basic error reporting            | Yes      |
| Large video resume support       | No       |
| Gallery/browser view             | Optional |

## Version 2: convenience features

| Feature                 | Purpose                            |
| ----------------------- | ---------------------------------- |
| QR-based pairing        | Faster connection from phone       |
| Image preview           | Confirm correct files were sent    |
| Upload queue            | Better multi-file feedback         |
| Device management       | Revoke or rename phones            |
| Browse uploaded files   | View recent transfers              |
| Download back to phone  | Two-way transfer                   |
| Storage usage dashboard | Show folder size and upload totals |

## Version 3: robust large-file support

| Feature                              | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| Chunked uploads                      | Handle large videos efficiently          |
| Resume interrupted upload            | Recover after Wi-Fi drop                 |
| Per-file progress                    | Better user feedback                     |
| Checksum verification                | Detect incomplete or corrupted transfers |
| Auto-clean abandoned partial uploads | Prevent wasted disk space                |

---

# 10. Upload protocol design

## MVP upload flow

Suitable for photos, screenshots, PDFs, and ordinary files.

```text
1. Android user selects files.
2. Browser submits multipart form upload.
3. Server checks authenticated session.
4. Server validates size and filename.
5. Server writes each file into a temporary location.
6. Server moves completed file into its final folder.
7. Server records metadata in SQLite.
8. Android receives success/failure summary.
```

For this version, use:

```text
POST /api/uploads
Content-Type: multipart/form-data
```

SvelteKit can access submitted multipart values through `request.formData()` in server-side handlers. ([Svelte][1])

## Later: large-file upload flow

For videos or hundreds of files, use chunked uploads:

```text
POST /api/uploads/init
PUT  /api/uploads/:id/chunks/:number
POST /api/uploads/:id/complete
DELETE /api/uploads/:id
```

Suggested behaviour:

| Step         | Behaviour                                             |
| ------------ | ----------------------------------------------------- |
| Initialise   | Server creates upload record and temporary file       |
| Chunk upload | Phone sends 4–16 MB chunks                            |
| Resume       | Server reports already received chunks                |
| Complete     | Server verifies size/checksum and moves file          |
| Cancel       | Partial file is deleted                               |
| Cleanup      | Unfinished uploads older than a threshold are removed |

This avoids treating a very large video as one monolithic upload request.

---

# 11. Route architecture

## Page routes

```text
src/routes/
├── +layout.svelte
├── +layout.server.ts
├── login/
│   ├── +page.svelte
│   └── +page.server.ts
├── pair/
│   ├── +page.svelte
│   └── +page.server.ts
├── upload/
│   ├── +page.svelte
│   └── +page.server.ts
├── history/
│   ├── +page.svelte
│   └── +page.server.ts
└── admin/
    ├── +layout.server.ts
    ├── +page.svelte
    ├── devices/
    │   └── +page.svelte
    └── settings/
        └── +page.svelte
```

## API routes

```text
src/routes/api/
├── auth/
│   ├── pair/
│   │   └── +server.ts
│   ├── logout/
│   │   └── +server.ts
│   └── session/
│       └── +server.ts
├── uploads/
│   ├── +server.ts
│   └── [uploadId]/
│       └── +server.ts
├── files/
│   └── [fileId]/
│       └── +server.ts
└── admin/
    ├── pairing-code/
    │   └── +server.ts
    ├── devices/
    │   └── +server.ts
    └── settings/
        └── +server.ts
```

For the MVP, the essential routes are:

```text
/pair
/upload
/history
/admin
/api/auth/pair
/api/uploads
/api/admin/pairing-code
/api/admin/devices
```

---

# 12. Source-code project architecture

```text
phone-drop/
├── package.json
├── svelte.config.js
├── vite.config.ts
├── .env.example
├── .env.local
├── static/
│   ├── favicon.png
│   └── icons/
├── src/
│   ├── app.d.ts
│   ├── hooks.server.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── FilePicker.svelte
│   │   │   ├── UploadQueue.svelte
│   │   │   ├── UploadProgress.svelte
│   │   │   ├── UploadResult.svelte
│   │   │   ├── PairingCode.svelte
│   │   │   └── DeviceList.svelte
│   │   ├── client/
│   │   │   ├── uploads.ts
│   │   │   └── format.ts
│   │   ├── server/
│   │   │   ├── auth/
│   │   │   │   ├── pairing.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   └── guards.ts
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── repositories/
│   │   │   ├── files/
│   │   │   │   ├── storage.ts
│   │   │   │   ├── naming.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── cleanup.ts
│   │   │   ├── uploads/
│   │   │   │   ├── upload-service.ts
│   │   │   │   ├── multipart-upload.ts
│   │   │   │   └── chunked-upload.ts
│   │   │   ├── config/
│   │   │   │   ├── config.ts
│   │   │   │   └── paths.ts
│   │   │   ├── security/
│   │   │   │   ├── tokens.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   └── filename.ts
│   │   │   └── logging/
│   │   │       └── logger.ts
│   │   └── types/
│   │       ├── auth.ts
│   │       └── uploads.ts
│   └── routes/
│       └── ...
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── initialise-storage.ts
    └── cleanup-temp-files.ts
```

## Design rule

All filesystem, authentication, database, and secret-handling code should remain inside:

```text
src/lib/server/
```

The Android browser must never receive direct filesystem paths, database details, session hashes, or configuration secrets.

---

# 13. Important server modules

| Module                      | Responsibility                                                          |
| --------------------------- | ----------------------------------------------------------------------- |
| `config/paths.ts`           | Determines application-data and upload directories                      |
| `db/client.ts`              | Creates SQLite connection                                               |
| `auth/pairing.ts`           | Creates and verifies temporary pairing codes                            |
| `auth/sessions.ts`          | Creates, verifies, and revokes device sessions                          |
| `files/storage.ts`          | Saves, moves, deletes, and lists files                                  |
| `files/naming.ts`           | Produces safe collision-resistant filenames                             |
| `files/validation.ts`       | Validates extension, MIME type, size, and destination                   |
| `uploads/upload-service.ts` | Coordinates authentication, validation, storage, and DB record creation |
| `security/rate-limit.ts`    | Limits pairing/login abuse                                              |
| `hooks.server.ts`           | Loads authenticated device identity into every request                  |

Node provides built-in cryptographic functionality suitable for generating random session tokens and hashing or comparing sensitive values; the app should never store raw session tokens in SQLite. ([Node.js][4])

---

# 14. Authentication request flow

```text
Android                  SvelteKit Server                  SQLite
   │                            │                            │
   │ GET /pair                  │                            │
   │───────────────────────────>│                            │
   │                            │                            │
   │ POST pairing code          │                            │
   │───────────────────────────>│ Verify one-time code       │
   │                            │───────────────────────────>│
   │                            │ Create device/session      │
   │                            │───────────────────────────>│
   │ Set session cookie         │                            │
   │<───────────────────────────│                            │
   │                            │                            │
   │ POST /api/uploads          │                            │
   │───────────────────────────>│ Validate session           │
   │                            │───────────────────────────>│
   │                            │ Save file locally          │
   │ Upload success             │                            │
   │<───────────────────────────│                            │
```

## Admin access model

The administrator is the person physically using the Mac.

Recommended rule:

* `/admin` is accessible from `localhost` only.
* The phone can upload and view its own recent uploads.
* Only the Mac can generate pairing codes, change storage folders, or revoke devices.

This avoids needing a second permanent administrator password in the first version.

---

# 15. Upload validation rules

| Validation              | Recommended behaviour                                  |
| ----------------------- | ------------------------------------------------------ |
| Maximum file size       | Configurable; start with 100 MB for MVP                |
| Maximum files per batch | Example: 50                                            |
| Filename                | Sanitize; remove path separators and unsafe characters |
| Destination path        | Server-controlled only                                 |
| Duplicate filename      | Add generated suffix; never silently overwrite         |
| Disk capacity           | Check free storage before accepting large uploads      |
| Empty file              | Permit or reject according to setting                  |
| Executables             | Store only if explicitly allowed; otherwise reject     |
| Incomplete upload       | Delete temporary file after failure                    |
| Hidden system files     | Never expose internal app files to phone               |

Because `adapter-node` enforces a maximum request body size, configure a server-level limit as well as application-level per-file validation. ([Svelte][2])

---

# 16. Configuration architecture

Use environment variables for server/network behaviour and a local config file or SQLite settings for application behaviour.

## `.env.local`

```bash
HOST=0.0.0.0
PORT=3000
ORIGIN=http://192.168.0.42:3000
BODY_SIZE_LIMIT=100M

APP_DATA_DIR="/Users/yourname/Library/Application Support/PhoneDrop"
UPLOAD_ROOT="/Users/yourname/Pictures/PhoneDrop"
SESSION_DAYS=30
PAIRING_CODE_TTL_SECONDS=300
MAX_FILES_PER_UPLOAD=50
```

SvelteKit recommends configuring `ORIGIN` when running `adapter-node`, because server-side form handling needs to determine the expected application URL correctly. Since the IP address may change, either reserve a stable local IP for your Mac or update `ORIGIN` when necessary. ([Svelte][2])

---

# 17. User-interface architecture

## Android upload page

Primary mobile screen:

```text
┌──────────────────────────┐
│ PhoneDrop                 │
│ Connected: Android Phone  │
├──────────────────────────┤
│                          │
│   Select photos/files     │
│                          │
│   [ Choose Files ]        │
│   [ Camera / Gallery ]    │
│                          │
├──────────────────────────┤
│ Upload queue              │
│ IMG_001.jpg     100% ✓    │
│ lecture.pdf      42%      │
│ video.mp4        queued   │
├──────────────────────────┤
│ Recent uploads            │
│ Today: 14 files           │
└──────────────────────────┘
```

## Mac admin page

```text
┌─────────────────────────────────────┐
│ PhoneDrop Admin                     │
├─────────────────────────────────────┤
│ Local address:                      │
│ http://192.168.0.42:3000            │
│                                     │
│ Pair a device                       │
│ Code: 583 291      Expires: 04:12   │
│ [ Generate New Code ]               │
│                                     │
│ Storage folder                      │
│ ~/Pictures/PhoneDrop                │
│                                     │
│ Trusted devices                     │
│ Android Phone       Last seen today │
│                    [ Revoke ]       │
└─────────────────────────────────────┘
```

---

# 18. Testing architecture

## Unit tests

Test server-only utilities:

* Filename sanitisation.
* File categorisation.
* Pairing code expiry.
* Session validation.
* Collision-resistant naming.
* Path traversal rejection.

## Integration tests

Test full server behaviour:

* Pair a device.
* Upload authenticated file.
* Reject unauthenticated upload.
* Store file in correct folder.
* Record upload metadata.
* Revoke device and block future upload.

## Manual device tests

Test from Android:

* Upload one image.
* Upload multiple images.
* Upload a PDF.
* Upload a large file close to configured limit.
* Disconnect Wi-Fi during upload.
* Use wrong pairing code repeatedly.
* Revoke phone from Mac and verify access is blocked.

---

# 19. Recommended development roadmap

## Phase 1: project foundation

* Create SvelteKit TypeScript project.
* Add `adapter-node`.
* Add SQLite storage layer.
* Create configuration and local filesystem directories.
* Build basic mobile layout and Mac admin layout.

## Phase 2: secure pairing

* Admin-only pairing-code generation.
* Android pairing page.
* Session cookie creation.
* Server hook protecting upload routes.
* Device revocation.

## Phase 3: upload MVP

* Multiple-file picker.
* Multipart upload endpoint.
* File validation.
* Safe filename generation.
* Folder categorisation.
* Upload history.

## Phase 4: local usability

* Display local network URL.
* Better upload progress UI.
* Settings for upload root and size limits.
* Auto-start on Mac using `launchd`.

## Phase 5: advanced reliability

* Chunked video uploads.
* Resume interrupted uploads.
* SHA-256 verification.
* Temporary-file cleanup.
* Optional local HTTPS.

---

# 20. Final recommended architecture

```text
Application:
  SvelteKit + TypeScript + adapter-node

Runtime:
  Native Node process on macOS
  No Docker

Client:
  Android browser on same Wi-Fi network

Authentication:
  One-time device pairing code
  Persistent revocable session cookie

Storage:
  Uploaded files in ~/Pictures/PhoneDrop
  Metadata and sessions in local SQLite DB
  Temporary files in Application Support directory

Security:
  Admin interface from Mac only
  Authenticated uploads only
  No router port forwarding
  Safe server-controlled file paths
  HTTPS considered after MVP

Upload strategy:
  Multipart uploads first
  Chunked/resumable uploads later for large videos

Operations:
  Manual start initially
  macOS launchd auto-start later
```

The next implementation step is to define the **MVP specification and exact folder/API/data-model contracts**, then scaffold the SvelteKit project accordingly.

[1]: https://svelte.dev/docs/kit/form-actions "Form actions • SvelteKit Docs"
[2]: https://svelte.dev/docs/kit/adapter-node "Node servers • SvelteKit Docs"
[3]: https://vite.dev/config/server-options?utm_source=chatgpt.com "Server Options"
[4]: https://nodejs.org/api/crypto.html?utm_source=chatgpt.com "Crypto | Node.js v26.2.0 Documentation"
