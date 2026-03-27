# 🎛️ Music Agent — Master Prompt V1
**Last Updated:** March 27, 2026 — V1 Public Launch
**This is the single source of truth. All previous continuation prompts are archived.**

---

## Project Overview

**Music Agent** is a cloud-hosted, multi-user music catalogue and release management dashboard for electronic music artists. It tracks every release across three paths: Release (platform uploads), Submit (label pitching), and Promote (promo deals). Built as a freemium SaaS — V1 is free for individual artists.

**Live URLs:**
- Frontend: https://musicagentchigui.com (Vercel)
- Backend: https://music-agent-mvp-production.up.railway.app (Railway)

**Philosophy:** Management over automation. The system tracks and organises — it does not auto-upload to platforms.

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Backend | Node.js / Express | Railway — `file-handler/server.js` (~3000+ lines) |
| Frontend | Next.js 14 (App Router) | Vercel — `frontend/src/` |
| Database | PostgreSQL | Railway managed DB |
| File Storage | Cloudflare R2 | S3-compatible object storage |
| Auth | JWT (backend) + NextAuth.js (frontend) | 30-day sessions |
| Email | Resend | Password reset, future notifications |
| DNS / Domain | Namecheap → Vercel DNS | `musicagentchigui.com` |

---

## Repo & Branch

- Repo: `music-agent-mvp` (GitHub)
- **Active branch: `cloud-migration`** — all work goes here, never commit to `main`
- Local path: `~/Documents/music-agent-mvp/`

---

## File Paths (Critical)

```
~/Documents/music-agent-mvp/
├── file-handler/          ← Node.js backend
│   ├── server.js          ← entire Express API (~3000+ lines)
│   ├── routes/
│   │   ├── auth.js        ← register, login, forgot/reset password, settings
│   │   └── admin.js       ← admin user management
│   ├── migrations/        ← PostgreSQL migration SQL files
│   ├── automation/        ← SoundCloud upload automation (experimental)
│   ├── authMiddleware.js  ← JWT verification middleware
│   ├── db.js              ← PostgreSQL pool (pg)
│   ├── r2.js              ← Cloudflare R2 S3 client
│   ├── settings.json      ← local dev settings (defaultArtistName)
│   └── env.example        ← template for .env (never commit .env)
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.js                         ← Home / Catalogue
    │   │   ├── layout.js                       ← Global header + nav
    │   │   ├── globals.css                     ← Global styles
    │   │   ├── error.js                        ← Global error boundary ('use client')
    │   │   ├── not-found.js                    ← Global 404 page
    │   │   ├── login/page.js
    │   │   ├── register/page.js
    │   │   ├── forgot-password/page.js
    │   │   ├── reset-password/page.js          ← reads ?token= from URL
    │   │   ├── settings/page.js
    │   │   ├── admin/page.js                   ← Admin-only: list + delete users
    │   │   ├── contacts/page.js                ← CRM aggregated contacts
    │   │   ├── files/page.js                   ← CRM aggregated files
    │   │   ├── stats/page.js
    │   │   ├── terms/page.js                   ← Terms of Service
    │   │   ├── privacy/page.js                 ← Privacy Policy
    │   │   ├── releases/[releaseId]/
    │   │   │   ├── page.js
    │   │   │   ├── label/[labelId]/page.js
    │   │   │   └── promo/[promoId]/page.js
    │   │   ├── collections/[collectionId]/
    │   │   │   ├── page.js
    │   │   │   ├── label/[labelId]/page.js
    │   │   │   └── promo/[promoId]/page.js
    │   │   └── api/auth/[...nextauth]/         ← NextAuth handler
    │   ├── components/
    │   │   ├── Modal.js
    │   │   ├── BackButton.js
    │   │   ├── LogPlatformForm.js
    │   │   ├── LogSubmissionForm.js
    │   │   ├── DownloadModal.js
    │   │   ├── DeleteTrackModal.js
    │   │   ├── TrackNotes.js
    │   │   ├── EditMetadataModal.js
    │   │   ├── LabelContactForm.js
    │   │   ├── ConfirmDeleteModal.js
    │   │   ├── HeaderNav.js
    │   │   ├── FeedbackButton.js
    │   │   ├── ReleaseCard.js
    │   │   ├── ScrollToTop.js
    │   │   ├── SongLinks.js
    │   │   ├── FileAttachments.js
    │   │   ├── AdminButton.js        ← only visible to isAdmin users
    │   │   ├── UserPill.js           ← user avatar + logout
    │   │   ├── MobileMenu.js         ← hamburger nav for mobile
    │   │   ├── ContactPicker.js
    │   │   ├── ConditionalHeader.js
    │   │   └── Providers.js          ← NextAuth SessionProvider wrapper
    │   └── lib/
    │       ├── api.js                ← fetchRelease, updateDistribution, etc.
    │       └── contacts.js           ← fetchAllContacts(), fetchAllFiles()
    └── env.local.example             ← template for .env.local (never commit)
```

---

## Database Schema

### Tables

**users**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
name TEXT NOT NULL
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
is_admin BOOLEAN NOT NULL DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
```

**releases**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id) ON DELETE CASCADE
release_id TEXT NOT NULL         -- e.g. "2024-03-01_Artist_Title"
metadata JSONB NOT NULL
versions JSONB NOT NULL
song_links JSONB DEFAULT '[]'
notes JSONB DEFAULT '{}'
updated_at TIMESTAMPTZ DEFAULT now()
```

**collections**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id) ON DELETE CASCADE
collection_id TEXT NOT NULL
metadata JSONB NOT NULL
versions JSONB NOT NULL
song_links JSONB DEFAULT '[]'
notes JSONB DEFAULT '{}'
tracks JSONB DEFAULT '[]'
updated_at TIMESTAMPTZ DEFAULT now()
```

**distribution_entries**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id) ON DELETE CASCADE
parent_type TEXT NOT NULL         -- 'release' or 'collection'
parent_id TEXT NOT NULL           -- releaseId or collectionId
entry_type TEXT NOT NULL          -- 'submit' or 'promote'
entry_id TEXT NOT NULL            -- labelId or promoId
data JSONB NOT NULL
follow_up_date DATE               -- migration 006
response_status TEXT NOT NULL DEFAULT 'No Reply'  -- migration 006
last_reminded_at TIMESTAMPTZ      -- migration 007
created_at TIMESTAMPTZ DEFAULT now()
```

**password_reset_tokens**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
token TEXT UNIQUE NOT NULL
expires_at TIMESTAMPTZ NOT NULL
used_at TIMESTAMPTZ
```

### Migrations Applied (in Railway PostgreSQL)

| File | Description | Status |
|------|-------------|--------|
| `001_initial_schema.sql` | Core tables (users, releases, collections, distribution_entries) | ✅ Applied |
| `002_collections_updates.sql` | Collections schema updates | ✅ Applied |
| `003_add_entry_fields.sql` | Entry-level fields | ✅ Applied |
| `004_add_is_admin.sql` | `is_admin` column on users | ✅ Applied |
| `005_add_password_reset_tokens.sql` | Password reset tokens table | ✅ Applied |
| `006_add_crm_fields.sql` | `follow_up_date`, `response_status` on distribution_entries | ✅ Applied |
| `007_add_last_reminded_at.sql` | `last_reminded_at` on distribution_entries | ✅ Applied |

---

## Environment Variables

### Backend (Railway)
```
DATABASE_URL=postgresql://... (public URL, not internal)
JWT_SECRET=...
R2_ACCOUNT_ID=a1bfaf248e7a05fbf6c2914c9916ff1f
R2_ACCESS_KEY_ID=9fc8c567ce16be99b3ca100fd4190130
R2_SECRET_ACCESS_KEY=ce0d055953ddfee98f954bab14af0ec49112e8b6893979870bc9fc1a31c13415
R2_BUCKET_NAME=music-agent-mvp
R2_PUBLIC_URL=https://pub-3c05591763454110a291e9540ef84fd3.r2.dev
FRONTEND_URL=https://musicagentchigui.com
RESEND_API_KEY=... (set in Railway — do not change)
RESEND_FROM_EMAIL=Music Agent <noreply@musicagentchigui.com>
PORT=(set automatically by Railway — do NOT add manually)
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://music-agent-mvp-production.up.railway.app
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://musicagentchigui.com
```

---

## Auth Flow

- **Register:** POST /auth/register — creates user, returns JWT + user object
- **Login:** POST /auth/login — validates credentials, returns JWT + user object (with `is_admin`)
- **Session:** NextAuth.js on frontend, sessions last 30 days. JWT stored in `token.accessToken`, decoded into `session.user.token`, `session.user.isAdmin`, `session.user.email`, `session.user.name`
- **Protected routes:** `frontend/src/middleware.js` redirects unauthenticated users to `/login`. Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`
- **Admin:** `is_admin: true` in DB unlocks `/admin` page and `AdminButton` in header. Set via: `UPDATE users SET is_admin = true WHERE email = 'x@x.com';`
- **Forgot password:** POST /auth/forgot-password → generates token, emails link via Resend. POST /auth/reset-password → validates token, updates bcrypt hash, marks token used.
- **Settings update:** PATCH /auth/me — accepts `{ name?, email?, currentPassword?, newPassword? }`. Returns fresh JWT so session updates immediately.

---

## ID Formats

```
releaseId:    YYYY-MM-DD_ArtistName_TrackTitle
collectionId: YYYY-MM-DD_ArtistName_CollectionTitle
labelId:      8-char alphanumeric (e.g. "abc12345")
promoId:      8-char alphanumeric (e.g. "def67890")
contactId:    UUID
```

---

## Core Concepts

- **3-Path Tracking:** Every distribution action is `release` (platform upload), `submit` (label pitch), or `promote` (promo deal).
- **Versions:** Audio lives inside `versions.primary`. Additional named versions can be added.
- **Collections:** EPs and Albums that group multiple releases. Identical structure to releases.
- **Badges:** Signed (green), Submitted (yellow), Released (blue), Promoted (pink/orange).
- **Per-entry pages:** Each label submission and promo entry has its own detail page with contacts, files, and notes.
- **CRM Pages:** `/contacts` and `/files` aggregate data client-side from existing APIs — no new backend endpoints.

---

## metadata.json Structure (Release)

```json
{
  "releaseId": "2024-03-01_Artist_Title",
  "metadata": {
    "title": "Track Title",
    "artist": "Artist Name",
    "genre": "Deep House",
    "bpm": 124,
    "key": "Am",
    "trackDate": "2024-03-01",
    "releaseDate": "2024-03-01",
    "releaseType": "Single",
    "releaseFormat": "Single",
    "collectionId": null,
    "distribution": {
      "release":  [{ "platform": "Beatport", "status": "Live", "url": "...", "timestamp": "..." }],
      "submit":   [{ "id": "abc12345", "label": "Anjuna", "platform": "Email", "status": "Pending", "contacts": [], "documents": [], "pageNotes": "", "timestamp": "..." }],
      "promote":  [{ "id": "def67890", "promoName": "Blog Name", "status": "Live", "liveDate": "...", "notes": "", "contacts": [], "documents": [], "pageNotes": "", "timestamp": "..." }]
    },
    "labelInfo": { "isSigned": false, "label": null, "signedDate": null, "contacts": [] },
    "promoInfo": { "contacts": [] }
  },
  "versions": {
    "primary": {
      "versionName": "Primary Version",
      "versionId": "primary",
      "files": {
        "audio":   [{ "filename": "track.wav", "size": 0, "duration": 0, "bitrate": 0, "sampleRate": 0, "channels": 0, "codec": "pcm" }],
        "artwork": [],
        "video":   []
      }
    }
  },
  "songLinks": [{ "id": "1234567890", "label": "Spotify", "url": "https://..." }],
  "notes": { "text": "", "documents": [] },
  "updatedAt": "..."
}
```

---

## Full API Reference

### Health & Settings
| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Server status |
| GET | /storage/status | Disk space / R2 usage |
| GET | /settings | App settings |
| PATCH | /settings | Update settings |

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login, returns JWT |
| PATCH | /auth/me | Update name/email/password |
| POST | /auth/forgot-password | Send reset email via Resend |
| POST | /auth/reset-password | Validate token, update password |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | /admin/users | List all users (admin only) |
| DELETE | /admin/users/:userId | Delete user + cascade (admin only) |

### Releases — Core
| Method | Route | Description |
|--------|-------|-------------|
| GET | /releases | List all releases (current user) |
| GET | /releases/:releaseId | Get single release |
| POST | /metadata | Create/update metadata |
| PATCH | /releases/:releaseId/metadata | Edit metadata fields |
| DELETE | /releases/:releaseId | Delete release + all files |

### Releases — Files
| Method | Route | Description |
|--------|-------|-------------|
| POST | /releases/:releaseId/versions/primary/audio | Upload audio |
| DELETE | /releases/:releaseId/versions/primary/audio/:filename | Delete audio |
| POST | /releases/:releaseId/video | Upload video |
| DELETE | /releases/:releaseId/video/:filename | Delete video |
| GET | /releases/:releaseId/artwork | Serve artwork |
| POST | /releases/:releaseId/artwork | Upload/replace artwork |
| DELETE | /releases/:releaseId/artwork | Delete artwork |
| GET | /releases/:releaseId/files/:fileType/:filename | Download any file |

### Releases — Distribution
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | /releases/:releaseId/distribution | Add entry |
| PATCH | /releases/:releaseId/distribution/:pathType/:timestamp | Edit entry |
| DELETE | /releases/:releaseId/distribution/:pathType/:timestamp | Delete entry |
| PATCH | /releases/:releaseId/sign | Mark as signed |

### Releases — Per-Entry (Label)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /releases/:releaseId/label/:labelId | Get label entry |
| PATCH | /releases/:releaseId/label/:labelId | Update label entry |
| DELETE | /releases/:releaseId/label/:labelId | Delete label entry |
| POST | /releases/:releaseId/label/:labelId/contacts | Add contact |
| PATCH | /releases/:releaseId/label/:labelId/contacts/:contactId | Edit contact |
| DELETE | /releases/:releaseId/label/:labelId/contacts/:contactId | Delete contact |
| POST | /releases/:releaseId/label/:labelId/files | Upload file |
| GET | /releases/:releaseId/label/:labelId/files/:filename | Download file |
| DELETE | /releases/:releaseId/label/:labelId/files/:filename | Delete file |
| PATCH | /releases/:releaseId/label/:labelId/notes | Save notes |

### Releases — Per-Entry (Promo)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /releases/:releaseId/promo/:promoId | Get promo entry |
| PATCH | /releases/:releaseId/promo/:promoId | Update promo entry |
| DELETE | /releases/:releaseId/promo/:promoId | Delete promo entry |
| POST | /releases/:releaseId/promo/:promoId/contacts | Add contact |
| PATCH | /releases/:releaseId/promo/:promoId/contacts/:contactId | Edit contact |
| DELETE | /releases/:releaseId/promo/:promoId/contacts/:contactId | Delete contact |
| POST | /releases/:releaseId/promo/:promoId/files | Upload file |
| GET | /releases/:releaseId/promo/:promoId/files/:filename | Download file |
| DELETE | /releases/:releaseId/promo/:promoId/files/:filename | Delete file |
| PATCH | /releases/:releaseId/promo/:promoId/notes | Save notes |

### Releases — Notes & Song Links
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | /releases/:releaseId/notes | Save notes text |
| POST | /releases/:releaseId/notes/files | Upload notes file |
| DELETE | /releases/:releaseId/notes/files/:filename | Delete notes file |
| POST | /releases/:releaseId/song-links | Add link (include `id` field) |
| DELETE | /releases/:releaseId/song-links/:id | Delete link |

### Collections
All release endpoints mirror identically under `/collections/:collectionId/...`

Additional collection-only:
| Method | Route | Description |
|--------|-------|-------------|
| POST | /collections | Create EP/Album |
| GET | /collections | List all |
| GET | /collections/:collectionId | Get single |
| PATCH | /collections/:collectionId | Update metadata |
| DELETE | /collections/:collectionId | Delete |
| GET | /collections/:collectionId/tracks | Get track list |
| POST | /collections/:collectionId/tracks | Add track |
| DELETE | /collections/:collectionId/tracks/:trackReleaseId | Remove track |
| PATCH | /collections/:collectionId/sign | Mark as signed |

---

## UI Conventions

- **Back button headers:** `position: sticky; top: 0; z-index: 10; background: #0a0a0a` on all detail pages
- **Section order on detail pages:** Contacts → Notes → Files (consistent across release, collection, label entry, promo entry)
- **Home page top-right button order:** [Grid/List Toggle] [👤 Contacts] [📁 Files] [📊 Statistics] [✚ Add Track]
- **All nav buttons same height:** `style={{ height: '36px', minWidth: '110px' }}`
- **View toggle:** persisted in `localStorage` key `'catalogueView'` (default: `'grid'`)
- **Mobile:** `MobileMenu.js` component handles hamburger nav on small screens
- **No Redux/Zustand** — local `useState` only
- **No unnecessary libraries**

---

## Badges

| Badge | Colour | Trigger |
|-------|--------|---------|
| Signed | Green | `isSigned: true` or a submit entry has `status: 'signed'` |
| Submitted | Yellow | Has submit entries, none signed |
| Released | Blue | A release entry has `status: 'live'` |
| Promoted | Pink/Orange | A promote entry has `status: 'Live'` |

---

## CRM — Contact & File Sources

**fetchAllContacts() sources:**
- `metadata.labelInfo.contacts[]`
- `metadata.promoInfo.contacts[]`
- `distribution.submit[].contacts[]`
- `distribution.promote[].contacts[]`

Contacts are deduplicated by name (case-insensitive). Each merged contact has a `sources[]` array listing every release/collection it appears in.

**fetchAllFiles() sources:**

| Category | Source path in metadata | Download URL pattern |
|----------|------------------------|----------------------|
| Audio | `versions.primary.files.audio[]` | `/releases/:id/files/audio/:filename` |
| Video | `versions.primary.files.video[]` | `/releases/:id/video/:filename` |
| Label | `distribution.submit[].documents[]` | `/releases/:id/label/:labelId/files/:filename` |
| Promo | `distribution.promote[].documents[]` | `/releases/:id/promo/:promoId/files/:filename` |
| General | `notes.documents[]` | `/releases/:id/notes/files/:filename` |

---

## Development Rules

- Always work on `cloud-migration` branch — never commit to `main`
- Always run `git ls-files | grep -i env` before pushing — must return nothing
- Small testable steps — run and test before pushing
- Show working code first, explain after
- Never rebuild working API — only extend
- Always `await loadTrack()` / `await loadCollection()` after mutations in frontend
- Explain everything — developer is learning

---

## How to Run Locally (for testing)

**Backend:**
```bash
cd ~/Documents/music-agent-mvp/file-handler && node server.js
# Runs on http://localhost:3001
```

**Frontend:**
```bash
cd ~/Documents/music-agent-mvp/frontend && npm run dev
# Runs on http://localhost:3000
```

Requires `.env` in `file-handler/` and `.env.local` in `frontend/` — see `env.example` and `env.local.example`.

---

## Test Credentials

```
Email: you@example.com
Password: yourpassword
Name: Mathias
```

**Quick auth token:**
```bash
TOKEN=$(curl -s -X POST https://music-agent-mvp-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' | jq -r .token)
```

**Admin account:** `admin@musicagent.com` (`is_admin = true` in DB)
To promote any user: `UPDATE users SET is_admin = true WHERE email = 'x@x.com';`

---

## Email (Resend)

- Provider: Resend (eu-west-1 region)
- Verified domain: `musicagentchigui.com`
- DNS records added in Vercel DNS panel: DKIM, SPF, MX, DMARC
- From address: `Music Agent <noreply@musicagentchigui.com>`
- Used for: password reset emails (POST /auth/forgot-password)
- Implementation: native Node.js `fetch` to Resend HTTP API — no npm package

---

## V1 Features Complete ✅

| Feature | Notes |
|---------|-------|
| Music catalogue — releases + collections | Grid/list view, badges, filters, sort |
| 3-path distribution tracking | Release / Submit (label pitch) / Promote |
| Per-entry detail pages | Label submission + promo entry each have own page |
| File uploads | Audio, video, artwork, documents — stored on Cloudflare R2 |
| Song links | Per release |
| Notes | Text + documents per release/collection/entry |
| CRM — Contacts page | Aggregated, deduplicated, searchable |
| CRM — Files page | All files, filterable by type |
| Statistics page | Release stats |
| Settings page | Name, email, password, default artist name |
| Auth — Register + Login | JWT + NextAuth.js, 30-day sessions |
| Auth — Forgot/reset password | Via Resend email |
| Admin panel | List + delete users (is_admin only) |
| 404 + error boundary pages | Global not-found.js + error.js |
| Mobile responsive design | MobileMenu hamburger nav |
| Terms of Service + Privacy Policy | Static pages |
| Feedback button | Google Sheets integration |
| Custom domain | musicagentchigui.com live on Vercel |

---

## V2 Roadmap

### Business Model — Freemium + B2B Subscriptions

**V1 (current):** Free for individual artists — full feature access, no limits enforced. This acts as the freemium tier to attract users and build traction.

**V2 target model:**
- **Individual (Free):** Keep V1 features free forever. Potentially add soft limits on storage or tracks for new free signups.
- **B2B Subscription — Artist Manager / Label / Collection House:** A dedicated paid plan for professionals who manage multiple artists. Monthly subscription charge. Key differentiator: ability to manage multiple artist catalogues under a single account, each fully separated.

**B2B Feature Vision:**
- After login/register, a manager selects which artist they are working on before entering the app — similar to choosing a workspace or project
- Each artist has their own isolated catalogue, contacts, and files
- The manager can switch between artists without logging out
- Billing: monthly subscription per seat or per number of artists managed
- The subscription gate should be enforced on the backend (check subscription status on every API call) and gracefully communicated on the frontend

---

### V2 Feature Priorities

**Priority 1 — Core V2 (before B2B launch)**

| Feature | Description |
|---------|-------------|
| File upload size limit | Enforce 1GB per file cap (multer `limits: { fileSize: 1GB }`). Add MulterError middleware: `if (err.code === 'LIMIT_FILE_SIZE') return 413` |
| Storage usage monitoring | Per-user storage tracking; display in admin panel. Options: track file sizes at upload in a `files` table, or use R2 metrics |
| Rate limiting on auth | Add `express-rate-limit` on /auth/login, /auth/register, /auth/forgot-password to prevent brute force |
| SEO metadata | `og:title`, `og:description`, favicon, site description for link previews |
| Landing / marketing page | At root `/` — explain what Music Agent is before redirect to login. Separate from app. |
| Email verification on register | Low friction: send verification email, show "Please verify" banner — don't block login yet |
| Onboarding flow | Empty state for new users: guided first-track creation |

**Priority 2 — B2B Multi-Artist Management**

| Feature | Description |
|---------|-------------|
| Artist profiles | New `artists` table: `id`, `user_id`, `name`, `image`, `created_at`. All releases + collections belong to an artist, not just a user |
| Artist switcher | After login, show "Which artist are you working on?" selector before entering catalogue. Store selection in session. |
| Per-artist isolation | All API queries scoped to `artist_id` (not just `user_id`) |
| Subscription system | Stripe integration. Free plan = 1 artist. Paid plan = unlimited artists. Check `subscription_status` on every protected API call |
| Subscription page | `/billing` — show current plan, upgrade button, managed via Stripe Customer Portal |
| Manager registration flow | Dedicated onboarding for managers with multiple artists |

**Priority 3 — Bulk Catalog Import (for new users with big catalogs)**

The biggest friction for new users with existing catalogues is adding tracks one by one. V2 should solve this.

| Feature | Description |
|---------|-------------|
| Cloud storage integration | Connect Dropbox, Google Drive, or iCloud — scan for audio files + artwork, auto-populate releases |
| CSV / spreadsheet import | Upload a CSV with track metadata (title, artist, BPM, key, genre, date) to bulk-create releases |
| Folder scan import | Upload a zip of a folder structure — auto-detect tracks and artwork |
| Drag-and-drop bulk upload | Multi-file drag onto the catalogue page — creates a release stub for each audio file |

**Priority 4 — Media & Playback**

| Feature | Description |
|---------|-------------|
| In-app audio player | Wavesurfer.js — waveform visualisation + playback bar. Collapsible bar at bottom of detail pages. |
| In-app video player | Video.js for uploaded video files |
| Streaming from R2 | Stream audio/video directly from R2 (signed URLs with short expiry) rather than full download |

**Priority 5 — CRM Upgrades (Post-V2)**

| Feature | Description |
|---------|-------------|
| Follow-up reminders | Overdue badge on home page when follow_up_date passes with no response |
| Pipeline / Kanban | Submissions grouped by status column (drag to move) |
| Contact sync | Edit a contact once, updates everywhere they appear |
| Submission analytics | Conversion rates, avg response time, top labels pitched |
| Activity feed | Chronological log of all actions across the catalogue |

---

## Known Technical Debt / Future Fixes

| Issue | Priority | Notes |
|-------|----------|-------|
| Artwork CDN custom domain | Low | Replace `pub-xxx.r2.dev` with custom domain when ready |
| `PATCH /auth/me` doesn't update `isAdmin` in NextAuth session | Low | Admin flag doesn't change via settings, no practical impact |
| `labelInfo.contractDocuments[]` and `promoInfo.contractDocuments[]` | Low | Exist in schema but no UI writes to them — dead fields, ignore |
| Resend DNS verification | ✅ Should be done | Check resend.com/domains to confirm `musicagentchigui.com` is verified |
| Mobile responsive polish | Ongoing | MobileMenu done; individual pages may need responsive refinement |
| No file upload size limit | 🔴 Do this first | Add 1GB multer limit as first V2 task |

---

## Backend Dependencies

```
@aws-sdk/client-s3   ← Cloudflare R2 uploads
archiver             ← zip downloads
bcrypt               ← password hashing
check-disk-space     ← storage status endpoint
cors                 ← cross-origin requests
dotenv               ← .env loading
express              ← HTTP server
file-type-checker    ← validate uploaded file types
googleapis           ← Google Sheets (feedback button)
jsonwebtoken         ← JWT auth
multer               ← file upload handling
music-metadata       ← audio file analysis (BPM, duration, etc.)
pg                   ← PostgreSQL client
playwright           ← SoundCloud automation (experimental)
resend               ← email sending
```

## Frontend Dependencies

```
next          ← Next.js 14 App Router
next-auth     ← Auth session management
react         ← UI framework
react-dom     ← DOM rendering
```
