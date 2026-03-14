# 🎛️ Music Release Management System — Master Prompt
**Last Updated:** March 15, 2026

---

## Project Overview
A personal release management dashboard for an electronic music artist. Tracks every release
across three paths: Release (platform uploads), Submit (label pitching), and Promote (promo deals).
Built local-first as an MVP — cloud migration is the immediate next phase.

**Philosophy:** Management over automation. The system tracks and organises — it does not
auto-upload to platforms.

---

## Tech Stack
| Layer      | Tech                              | Port  |
|------------|-----------------------------------|-------|
| Backend    | Node.js / Express                 | 3001  |
| Frontend   | Next.js 14 (App Router)           | 3000  |
| Storage    | JSON files on disk                | —     |
| Dev Tools  | macOS, Cursor IDE, GitHub Desktop | —     |

---

## How We Work with Cursor
- **Always work in Cursor IDE** — paste the Continuation Prompt at the start of every new session.
- **Reference files directly** — use `@filename` in Cursor chat (e.g. `@server.js`, `@page.js`).
- **Small testable steps** — implement one endpoint or one UI component at a time, restart and test.
- **Never rebuild working code** — only extend. If a route already exists, patch it.
- **Confirm before touching shared files** — `server.js`, `layout.js`, `globals.css` affect everything.
- **Copy exact field names** from this prompt — casing matters (`releaseId`, not `release_id`).
- **After every mutation**, always call `await loadTrack()` or `await loadCollection()` to re-fetch.

---

## File Paths (Critical)
~/Documents/music-agent-mvp/
file-handler/
server.js ← entire Express API (~3000+ lines)
settings.json ← app settings

~/Documents/Music Agent/
Releases/
[releaseId]/
metadata.json
versions/primary/audio/ ← WAV, MP3, etc.
artwork/
video/
promo/[promoId]/ ← per-entry promo files
label/[labelId]/ ← per-entry label files
notes/ ← text notes + documents

Collections/
[collectionId]/
metadata.json
artwork/
promo/[promoId]/
label/[labelId]/
notes/

~/Documents/music-agent-mvp/frontend/
src/app/
page.js ← Home / Catalogue
contacts/page.js ← CRM Contacts (read-only aggregation)
files/page.js ← CRM Files (read-only aggregation)
releases/[releaseId]/
page.js ← Release detail
label/[labelId]/page.js ← Per-entry label submission detail
promo/[promoId]/page.js ← Per-entry promo entry detail
collections/[collectionId]/
page.js ← Collection detail
label/[labelId]/page.js ← Per-entry label submission detail
promo/[promoId]/page.js ← Per-entry promo entry detail
stats/page.js ← Statistics
settings/page.js ← Settings
src/components/
Modal.jsx
BackButton.js
LogPlatformForm.js
LogSubmissionForm.js
DownloadModal.js
DeleteTrackModal.js
TrackNotes.js
EditMetadataModal.js
LabelContactForm.js
ConfirmDeleteModal.js
HeaderNav.js
FeedbackButton.js
ReleaseCard.js
ScrollToTop.js
SongLinks.js
src/lib/
api.js ← fetchRelease, updateDistribution, etc.
contacts.js ← fetchAllContacts(), fetchAllFiles()

text

---

## ID Formats
releaseId: YYYY-MM-DD_ArtistName_TrackTitle
collectionId: YYYY-MM-DD_ArtistName_CollectionTitle

text

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
    "labelInfo": {
      "isSigned": false,
      "label": null,
      "signedDate": null,
      "contacts": []
    },
    "promoInfo": {
      "contacts": []
    }
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
Active File Sources (used by fetchAllFiles())
Category	Source path in metadata	Download URL pattern
Audio	versions.primary.files.audio[]	/releases/:id/files/audio/:filename
Video	versions.primary.files.video[]	/releases/:id/video/:filename
Label	distribution.submit[].documents[]	/releases/:id/label/:labelId/files/:filename
Promo	distribution.promote[].documents[]	/releases/:id/promo/:promoId/files/:filename
General	notes.documents[]	/releases/:id/notes/files/:filename
Note: labelInfo.contractDocuments[] and promoInfo.contractDocuments[] exist in the schema but are dead — no UI writes to them. Ignore them.

Contact Sources (used by fetchAllContacts())
Role	Source path
Label	metadata.labelInfo.contacts[]
Promo	metadata.promoInfo.contacts[]
Label	distribution.submit[].contacts[]
Promo	distribution.promote[].contacts[]
Contacts are deduplicated by name (case-insensitive). Each merged contact has a sources[] array listing every release/collection it appears in.

Full API Reference
Health & Settings
Method	Route	Description
GET	/health	Server status
GET	/storage/status	Disk space
GET	/settings	App settings
PATCH	/settings	Update settings
Releases — Core
Method	Route	Description
GET	/releases	List all releases
GET	/releases/:releaseId	Get single release
POST	/metadata	Create/update metadata
PATCH	/releases/:releaseId/metadata	Edit metadata fields
DELETE	/releases/:releaseId	Delete release + all files
Releases — Files
Method	Route	Description
POST	/releases/:releaseId/versions/primary/audio	Add audio
DELETE	/releases/:releaseId/versions/primary/audio/:filename	Delete audio
POST	/releases/:releaseId/video	Upload video
DELETE	/releases/:releaseId/video/:filename	Delete video
GET	/releases/:releaseId/artwork	Serve artwork
POST	/releases/:releaseId/artwork	Upload/replace artwork
DELETE	/releases/:releaseId/artwork	Delete artwork
GET	/releases/:releaseId/files/:fileType/:filename	Download any file
Releases — Distribution
Method	Route	Description
PATCH	/releases/:releaseId/distribution	Add entry (body: { path, entry })
PATCH	/releases/:releaseId/distribution/:pathType/:timestamp	Edit entry
DELETE	/releases/:releaseId/distribution/:pathType/:timestamp	Delete entry
PATCH	/releases/:releaseId/sign	Mark as signed
Releases — Per-Entry (Label)
Method	Route	Description
GET	/releases/:releaseId/label/:labelId	Get label entry
PATCH	/releases/:releaseId/label/:labelId	Update label entry
DELETE	/releases/:releaseId/label/:labelId	Delete label entry
POST	/releases/:releaseId/label/:labelId/contacts	Add contact
PATCH	/releases/:releaseId/label/:labelId/contacts/:contactId	Edit contact
DELETE	/releases/:releaseId/label/:labelId/contacts/:contactId	Delete contact
POST	/releases/:releaseId/label/:labelId/files	Upload file
GET	/releases/:releaseId/label/:labelId/files/:filename	Download file
DELETE	/releases/:releaseId/label/:labelId/files/:filename	Delete file
PATCH	/releases/:releaseId/label/:labelId/notes	Save notes
Releases — Per-Entry (Promo)
Method	Route	Description
GET	/releases/:releaseId/promo/:promoId	Get promo entry
PATCH	/releases/:releaseId/promo/:promoId	Update promo entry
DELETE	/releases/:releaseId/promo/:promoId	Delete promo entry
POST	/releases/:releaseId/promo/:promoId/contacts	Add contact
PATCH	/releases/:releaseId/promo/:promoId/contacts/:contactId	Edit contact
DELETE	/releases/:releaseId/promo/:promoId/contacts/:contactId	Delete contact
POST	/releases/:releaseId/promo/:promoId/files	Upload file
GET	/releases/:releaseId/promo/:promoId/files/:filename	Download file
DELETE	/releases/:releaseId/promo/:promoId/files/:filename	Delete file
PATCH	/releases/:releaseId/promo/:promoId/notes	Save notes
Releases — Notes & Song Links
Method	Route	Description
PATCH	/releases/:releaseId/notes	Save notes text
POST	/releases/:releaseId/notes/files	Upload notes file
DELETE	/releases/:releaseId/notes/files/:filename	Delete notes file
POST	/releases/:releaseId/song-links	Add link (include id field)
DELETE	/releases/:releaseId/song-links/:id	Delete link
Collections
All release endpoints mirror identically under /collections/:collectionId/...
Additional collection-only endpoints:

Method	Route	Description
POST	/collections	Create EP/Album
GET	/collections	List all
GET	/collections/:collectionId	Get single
PATCH	/collections/:collectionId	Update metadata
DELETE	/collections/:collectionId	Delete
GET	/collections/:collectionId/tracks	Get track list
POST	/collections/:collectionId/tracks	Add track
DELETE	/collections/:collectionId/tracks/:trackReleaseId	Remove track
PATCH	/collections/:collectionId/sign	Mark as signed
UI Conventions
Back button headers: position: sticky; top: 0; z-index: 10; background: #0a0a0a on all detail pages

Section order on detail pages: Contacts → Notes → Files (consistent across release, collection, label entry, promo entry pages)

Home page top-right button order: [Grid/List Toggle] [👤 Contacts] [📁 Files] [📊 Statistics] [✚ Add Track]

All nav buttons same height: style={{ height: '36px', minWidth: '110px' }}

View toggle: persisted in localStorage key 'catalogueView' (default: 'grid')

No Redux/Zustand — local useState only

No unnecessary libraries

Badges
Badge	Colour	Trigger
Signed	Green	isSigned: true or a submit entry has status: 'signed'
Submitted	Yellow	Has submit entries, none signed
Released	Blue	A release entry has status: 'live'
Promoted	Pink/Orange	A promote entry has status: 'Live'
Development Principles
Show working code first, explain after

Small testable steps — run and test immediately

Never rebuild working API — only extend

JSON files are the source of truth (pre-cloud)

Always await loadTrack() / await loadCollection() after mutations

Roadmap
✅ MVP Complete (March 15, 2026)
Full backend API (server.js ~3000+ lines)

Release + Collection detail pages — distribution, submissions, promo deals, notes, files, song links, versions

Per-entry detail pages for label submissions and promo entries (contacts, files, notes)

Home page catalogue — grid/list toggle, filters, sorting, badges

CRM Contacts page (/contacts) — aggregated, searchable, deduplicated by name

CRM Files page (/files) — all uploaded files, filterable by Audio/Video/Label/Promo/General

Statistics page

Settings page

Feedback button (Google Sheets integration)

Sticky back button headers on all detail pages

🔜 Phase 2 — Cloud Migration (Next)
Backend: Railway or Render (Node.js)

Frontend: Vercel (Next.js)

Database: PostgreSQL (replace JSON files)

Auth: NextAuth.js (Google + email login)

No existing contact/file data needs migrating — fresh start on new schema

Mobile-responsive redesign post-cloud (Tailwind CSS recommended)

🔜 Phase 3 — Full CRM (Post-Cloud)
Shared contacts store — contacts table in PostgreSQL, contacts referenced by ID across all releases

"Choose existing contact" picker when adding contacts to label/promo entries

Contact sync — edit once, updates everywhere

Follow-up reminders — set a follow-up date on submissions, overdue badge on home page

Label response tracking — No Reply / Passed / Interested / Signed per submission

Activity feed — chronological log of all actions

Submission stats — conversion rates, avg response time, top labels pitched

Pipeline / Kanban view — submissions grouped by status column

🗓️ Phase 4 — Integrations & Media (Post-Cloud)
SoundCloud API import — OAuth, pull tracks + metadata + artwork

YouTube video embed on release detail page

Media player — Wavesurfer.js (audio waveform) + Video.js, collapsible bar at bottom of detail pages

CSV catalogue import — batch create releases from spreadsheet

Email pitch template generator

text

***