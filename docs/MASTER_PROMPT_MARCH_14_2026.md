# 🎛️ Music Release Management System — Master Prompt
**Last Updated:** March 14, 2026

---

## Project Overview
A personal release management dashboard for an electronic music artist. Tracks every release
across three paths: Release (platform uploads), Submit (label pitching), and Promote (promo deals).
Built local-first as an MVP, with cloud deployment planned next.

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
- **Always work in Cursor IDE** — paste the Continuation Prompt at the start of every new Cursor session so it has full context.
- **Reference files directly** — use `@filename` in Cursor chat to pull in specific files (e.g. `@server.js`, `@page.js`).
- **Small testable steps** — implement one endpoint or one UI component at a time, restart the server, and test before moving on.
- **Never rebuild working code** — only extend. If a route already exists, patch it.
- **Confirm before touching shared files** — `server.js`, `layout.js`, and `globals.css` affect everything; always double-check before editing.
- **Copy exact IDs and field names** from the master prompt when writing API calls — casing matters (`releaseId`, not `release_id`).
- **After every mutation**, always call `await loadTrack()` or `await loadCollection()` to re-fetch and keep UI in sync.

---

## File Paths (Critical)
```
~/Documents/music-agent-mvp/
  file-handler/
    server.js                  ← entire Express API (~3000+ lines)
    settings.json              ← app settings

~/Documents/Music Agent/
  Releases/
    [releaseId]/
      metadata.json
      versions/primary/audio/  ← WAV, MP3, etc.
      artwork/                 ← cover image
      video/                   ← video files
      label-deal/              ← contract documents
      promo-deal/              ← promo documents
      promo/[promoId]/         ← per-entry promo files
      label/[labelId]/         ← per-entry label files
      notes/                   ← text notes + documents
  Collections/
    [collectionId]/
      metadata.json
      artwork/
      label-deal/
      promo-deal/
      notes/

~/Documents/music-agent-mvp/frontend/
  src/app/
    page.js                                    ← Home / Catalogue
    releases/[releaseId]/
      page.js                                  ← Release detail
      label-deal/page.js                       ← Release label deal
      promo-deal/page.js                       ← Release promo deal
    collections/[collectionId]/
      page.js                                  ← Collection detail
      label-deal/page.js                       ← Collection label deal
      promo-deal/page.js                       ← Collection promo deal
  src/components/
    Modal.jsx
    BackButton.jsx
    LogPlatformForm.jsx
    LogSubmissionForm.jsx
    DownloadModal.jsx
    DeleteTrackModal.jsx
    TrackNotes.jsx
    EditMetadataModal.jsx
    LabelContactForm.jsx
    ConfirmDeleteModal.jsx
  src/lib/
    api.js                                     ← fetchRelease, updateDistribution, etc.
```

---

## ID Formats
```
releaseId:    YYYY-MM-DD_ArtistName_TrackTitle
              e.g. 2024-03-01_Doe_MyTrack

collectionId: YYYY-MM-DD_ArtistName_CollectionTitle
              e.g. 2024-06-01_Doe_SummerEP
```

---

## Core Concepts
- **3-Path Tracking:** Every distribution action is `release` (platform upload), `submit` (label pitch), or `promote` (promo deal).
- **Versions:** Audio lives inside `versions.primary`. Additional named versions (e.g. "Radio Edit") can be added.
- **Collections:** EPs and Albums that group multiple releases. Identical distribution structure to releases.
- **Signed Badge:** When a label submission is marked `signed`, a green badge appears on home and detail pages.
- **Released Badge:** Blue badge when a platform entry has status `live`.
- **Promoted Badge:** Pink/orange badge when a promo entry has status `Live`.
- **Per-entry detail pages:** Each label submission and promo entry has its own detail page with contacts, documents, and notes.

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
      "contractDocuments": [],
      "contacts": []
    },
    "promoInfo": {
      "contacts": [],
      "contractDocuments": []
    }
  },
  "versions": {
    "primary": {
      "versionName": "Primary Version",
      "versionId": "primary",
      "createdAt": "...",
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
| GET | `/health` | Server status |
| GET | `/storage/status` | Disk space |
| GET | `/settings` | App settings |
| PATCH | `/settings` | Update settings |

### Releases — Core
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/releases` | List all releases |
| GET | `/releases/:releaseId` | Get single release |
| POST | `/metadata` | Create/update metadata |
| PATCH | `/releases/:releaseId/metadata` | Edit metadata fields |
| DELETE | `/releases/:releaseId` | Delete release + all files |

### Releases — Files
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/versions/primary/audio` | Add audio to existing primary version |
| DELETE | `/releases/:releaseId/versions/primary/audio/:filename` | Delete audio file |
| POST | `/releases/:releaseId/video` | Upload video |
| DELETE | `/releases/:releaseId/video/:filename` | Delete video |
| GET | `/releases/:releaseId/artwork` | Serve artwork |
| POST | `/releases/:releaseId/artwork` | Upload/replace artwork |
| DELETE | `/releases/:releaseId/artwork` | Delete artwork |
| GET | `/releases/:releaseId/files/:fileType/:filename` | Download any file |

### Releases — Distribution
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/releases/:releaseId/distribution` | Add entry (body: `{ path, entry }`) |
| PATCH | `/releases/:releaseId/distribution/:pathType/:timestamp` | Edit entry |
| DELETE | `/releases/:releaseId/distribution/:pathType/:timestamp` | Delete entry |
| PATCH | `/releases/:releaseId/sign` | Mark as signed (body: `{ labelName, signedDate }`) |

### Releases — Per-Entry (Label Submit)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/releases/:releaseId/label/:labelId` | Get label entry detail |
| PATCH | `/releases/:releaseId/label/:labelId` | Update label entry fields |
| DELETE | `/releases/:releaseId/label/:labelId` | Delete label entry |
| POST | `/releases/:releaseId/label/:labelId/contacts` | Add contact |
| PATCH | `/releases/:releaseId/label/:labelId/contacts/:contactId` | Edit contact |
| DELETE | `/releases/:releaseId/label/:labelId/contacts/:contactId` | Delete contact |
| POST | `/releases/:releaseId/label/:labelId/files` | Upload document |
| GET | `/releases/:releaseId/label/:labelId/files/:filename` | Download document |
| DELETE | `/releases/:releaseId/label/:labelId/files/:filename` | Delete document |
| PATCH | `/releases/:releaseId/label/:labelId/notes` | Save page notes |

### Releases — Per-Entry (Promo)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/releases/:releaseId/promo/:promoId` | Get promo entry detail |
| PATCH | `/releases/:releaseId/promo/:promoId` | Update promo entry fields |
| DELETE | `/releases/:releaseId/promo/:promoId` | Delete promo entry |
| POST | `/releases/:releaseId/promo/:promoId/contacts` | Add contact |
| PATCH | `/releases/:releaseId/promo/:promoId/contacts/:contactId` | Edit contact |
| DELETE | `/releases/:releaseId/promo/:promoId/contacts/:contactId` | Delete contact |
| POST | `/releases/:releaseId/promo/:promoId/files` | Upload file |
| GET | `/releases/:releaseId/promo/:promoId/files/:filename` | Download file |
| DELETE | `/releases/:releaseId/promo/:promoId/files/:filename` | Delete file |
| PATCH | `/releases/:releaseId/promo/:promoId/notes` | Save page notes |

### Releases — Label Deal (top-level)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/label-deal/files` | Upload contract |
| GET | `/releases/:releaseId/label-deal/files/:filename` | Download contract |
| DELETE | `/releases/:releaseId/label-deal/files/:filename` | Delete contract |
| POST | `/releases/:releaseId/label-deal/contacts` | Add contact |
| PATCH | `/releases/:releaseId/label-deal/contacts/:contactId` | Edit contact |
| DELETE | `/releases/:releaseId/label-deal/contacts/:contactId` | Delete contact |

### Releases — Promo Deal (top-level)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/promo-deal/files` | Upload document |
| GET | `/releases/:releaseId/promo-deal/files/:filename` | Download document |
| DELETE | `/releases/:releaseId/promo-deal/files/:filename` | Delete document |
| POST | `/releases/:releaseId/promo-deal/contacts` | Add contact |
| PATCH | `/releases/:releaseId/promo-deal/contacts/:contactId` | Edit contact |
| DELETE | `/releases/:releaseId/promo-deal/contacts/:contactId` | Delete contact |

### Releases — Song Links & Notes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/song-links` | Add link (include `id` field) |
| DELETE | `/releases/:releaseId/song-links/:id` | Delete link |
| PATCH | `/releases/:releaseId/notes` | Save notes text |
| POST | `/releases/:releaseId/notes/files` | Upload notes document |
| DELETE | `/releases/:releaseId/notes/files/:filename` | Delete notes document |

### Collections — Core
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/collections` | Create EP/Album |
| GET | `/collections` | List all |
| GET | `/collections/:collectionId` | Get single |
| PATCH | `/collections/:collectionId` | Update metadata |
| DELETE | `/collections/:collectionId` | Delete |
| GET | `/collections/:collectionId/tracks` | Get enriched track list |
| POST | `/collections/:collectionId/tracks` | Add track |
| DELETE | `/collections/:collectionId/tracks/:trackReleaseId` | Remove track |

### Collections — Distribution & Files (mirrors releases)
All release distribution, per-entry label/promo, label-deal, promo-deal, notes, song-links endpoints exist identically under `/collections/:collectionId/...`

### Collections — Sign
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/collections/:collectionId/sign` | Mark collection as signed |

---

## Badges
| Badge | Colour | Trigger |
|-------|--------|---------|
| Signed | Green | A submit entry has `status: 'signed'` or `isSigned: true` |
| Submitted | Yellow | Has submit entries, none signed |
| Released | Blue | A release entry has `status: 'live'` |
| Promoted | Pink/Orange | A promote entry has `status: 'Live'` |

---

## Home Page Filters
All · Released · Submitted · Signed · Promoted · Singles · EPs/Albums

---

## Development Principles
- Show working code first, explain after
- Small testable steps — run and test immediately
- Never rebuild working API — only extend
- JSON files are the source of truth (no DB migrations needed)
- No Redux/Zustand — local `useState` only
- No unnecessary libraries
- Always `await loadTrack()` / `await loadCollection()` after mutations
- Back buttons must be `position: sticky; top: 0` — never scroll off screen

---

## Roadmap

### ✅ Completed (as of March 14, 2026)
- Full backend API (server.js, ~3000+ lines)
- Release detail page — distribution, submissions, label deal, notes, files, song links, versions
- Collection detail page — identical feature set to releases
- Label Deal pages (contacts + documents) — releases and collections
- Promo Deal pages (contacts + documents) — releases and collections
- Promo Deals section on detail pages (replaces Marketing Content placeholder)
- Per-entry detail pages for label submissions and promo entries
- Home page catalogue with grid view, filters, sorting, badges
- Quick artwork upload from sidebar (releases + collections)
- Audio/video upload + delete from sidebar
- Song link delete fix (uses `link.id`)
- Signed status fix (backend persists correctly, frontend re-fetches)

### 🔜 Immediate Next Steps (Priority Order)

#### 1. Fix Back Button — Sticky Header (Quick Win)
- Back button header scrolls to the top and covers the logo when scrolling down
- Fix: set `position: sticky; top: 0; z-index: 10` on all back button containers
- Apply to ALL detail pages: release, collection, label-deal, promo-deal, per-entry pages

#### 2. Grid / List View Toggle on Home Page
- Current: grid of cards only
- Add a toggle button (grid icon / list icon) in the header of the catalogue section
- **Grid view:** current card layout (unchanged)
- **List view:** compact single-row per item — artwork thumbnail (small), title, artist, genre, BPM, key, date, badges — all on one line
- Persist toggle preference in `localStorage`
- Purely aesthetic — no data changes

#### 3. CRM — Global Contacts Page
- New page: `/contacts`
- Aggregates ALL contacts from every release, collection, label deal, promo deal, per-entry contacts
- Display: name, label/company, email, phone, role, linked release/collection
- Features: search by name or label, filter by role (Label, Promo, Other)
- Future: click contact to see all activity linked to them
- Nav button next to Statistics button

#### 4. CRM — Global Documents Page
- New page: `/documents`
- Aggregates ALL uploaded files from notes, label-deal, promo-deal, per-entry files across all releases and collections
- Display: filename, size, type, upload date, linked release/collection, download button
- Features: search by filename, filter by type (contract, audio, image, other)
- Nav button next to Contacts button

### 🗓️ Medium-Term Roadmap

#### 5. CRM Feature Ideas (Low-Hanging Fruit)
- **Follow-up reminders** — set a date to follow up on a label submission or promo deal; show overdue badge
- **Label response tracking** — track No Reply / Passed / Interested / Signed per submission
- **Contact notes & last-contacted date** — log when you last reached out per contact
- **Activity feed** — chronological log of all actions (submitted to X, signed by Y, promoted on Z)
- **Pipeline view** — Kanban-style board showing submissions by status column
- **Email template generator** — fill in label/promo name and generate a pitch email draft
- **Statistics page** — total tracks, signed %, submission conversion rate, top labels pitched

#### 6. Cloud Deployment
- Backend: Railway or Render (Node.js)
- Frontend: Vercel (Next.js)
- Storage: migrate JSON files → PostgreSQL or PlanetScale
- Auth: NextAuth.js with Google/email login
- Mobile-first responsive redesign post-cloud

#### 7. Mass Upload / Catalogue Import
- CSV import tool — user fills spreadsheet, app creates all releases in one batch
- SoundCloud API import — OAuth, pull existing tracks with metadata + artwork
- Build post-cloud so all new users can onboard quickly

#### 8. Platform Integrations
- SoundCloud embed + play count display
- YouTube video embed

#### 9. Media Player
- Wavesurfer.js — audio waveform visualiser + playback for WAV/MP3/FLAC
- Video.js — video playback for MP4/MOV
- Collapsible player bar at bottom of detail pages
- Audio served from Express: `GET /releases/:releaseId/files/audio/:filename`
