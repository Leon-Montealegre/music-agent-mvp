
## CONTINUATION_PROMPT_MAR_13_2026.md

```markdown
# 🎛️ Continuation Prompt — March 13, 2026
**Next Feature: Promo Deal System**

Always read MASTER_PROMPT_MAR_13_2026.md first for full context.

---

## What Was Done This Session

### Bug Fixes
1. **Song link delete** — was passing array `index` to the server, but the server filters by
   `link.id`. Fix: `handleAddLink` now saves `id: Date.now().toString()` with every new link.
   `handleDeleteLink` now passes `link.id` instead of `idx`.
   ⚠️ Links saved before this fix have no `id` — delete button shows an alert asking user to
   re-add them.

2. **Audio upload "Version already exists" error** — `/upload` endpoint checks for duplicate
   version name and rejected any upload to an already-existing primary version. Fixed by adding a
   dedicated endpoint that appends to the existing version instead.

3. **Video upload same error** — video was routed through `/upload` which is version-aware.
   Fixed by dedicated video endpoint that bypasses versions entirely.

### New API Endpoints Added to server.js
```
POST   /releases/:releaseId/versions/primary/audio
  → Appends audio file(s) to existing primary version (no version-conflict check)
  → Validates audio with music-metadata before saving
  → multer writes directly to versions/primary/audio/

POST   /releases/:releaseId/video
  → Dedicated video upload, completely separate from versions system
  → multer writes to releases/:releaseId/video/
  → Saves file entry to metadata.versions.primary.files.video[]

DELETE /releases/:releaseId/video/:filename
  → Deletes file from disk
  → Removes entry from metadata.versions.primary.files.video[]
```

### Frontend Changes

#### releases/[releaseId]/page.jsx
- Added `useRef` for `audioInputRef`, `artworkInputRef`, `videoInputRef`
- Added `uploadingFile` state (`'audio' | 'artwork' | 'video' | null`)
- `handleUploadAudio` now calls `POST /releases/:releaseId/versions/primary/audio`
- `handleUploadVideo` now calls `POST /releases/:releaseId/video`
- `handleDeleteArtwork` calls `DELETE /releases/:releaseId/artwork`
- `handleDeleteVideo` calls `DELETE /releases/:releaseId/video/:filename`
- Files section: each type (audio/artwork/video) now has a `+ Add` button always visible
- Audio/video: show "No files — click Add to upload" when empty
- Artwork: empty state shows vinyl + purple **+ Upload Artwork** button
- Artwork with image: hover overlay shows **Replace** and **Delete** buttons

#### collections/[collectionId]/page.jsx
- Added `useRef` import + `artworkInputRef` ref
- Added `uploadingArtwork` state
- Added `handleQuickArtworkUpload` function (calls `POST /collections/:collectionId/artwork`)
- Sidebar artwork block now matches release page:
  - Empty: vinyl placeholder + **+ Upload Artwork** button
  - Has artwork: hover overlay with **Replace** + **Delete** buttons

---

## Next Feature Spec: Promo Deal System

### Overview
Replace the current placeholder "Marketing Content" section on both
`releases/[releaseId]/page.jsx` and `collections/[collectionId]/page.jsx` with a fully
functional **Promo Deals** section. Follows the same pattern as Label Submissions.

A release or collection can have **multiple promo deals** tracked simultaneously
(e.g. blog, SoundCloud channel, Instagram promo — all separate entries).

---

### Data Structure
Add to `metadata.distribution.promote[]` — this array already exists but is unused.

Each promote entry:
```json
{
  "promoName": "Music Blog Name",
  "status": "Live",
  "scheduledDate": "2024-04-01",
  "liveDate": "2024-04-03",
  "notes": "Featured in weekly roundup",
  "timestamp": "2024-03-15T10:00:00.000Z"
}
```

Status options: `Not Started`, `Scheduled`, `Live`, `Completed`, `Cancelled`

---

### UI: Promo Deals Section (replaces Marketing Content)
Location: Right column on both release and collection detail pages.

**Behaviours:**
- `Scheduled` → show a date picker for "scheduled date"
- `Live` → show a date picker for "date it went live"
- When any entry is `Live` → show **"Promoted"** badge in header (pink/orange,
  same style as Signed/Released badges)
- Edit + delete per entry (same pattern as label submissions)

**Form fields:**
- Promo Name (text, required)
- Status (select: Not Started / Scheduled / Live / Completed / Cancelled)
- Scheduled Date (date picker, shown only when status = Scheduled)
- Live Date (date picker, shown only when status = Live)
- Notes (text, optional)

---

### UI: Sidebar "Promo Deal" section
Location: Left sidebar, below the "Label Deal" shortcut block.

**Show when:** At least one promo entry exists.

**Contents:**
- Section title: "Promo Deals"
- For each `Live` promo: show promo name, status badge, live date
- Link: "Promo Deal Details →" → navigates to `/releases/:releaseId/promo-deal`
  (or `/collections/:collectionId/promo-deal`)

---

### New Pages: Promo Deal Detail
Create these two new pages (mirror structure of label-deal pages):
```
frontend/app/releases/[releaseId]/promo-deal/page.jsx
frontend/app/collections/[collectionId]/promo-deal/page.jsx
```

**Sections:**
1. **Promo Contacts** — same component as `LabelContactForm`, same API pattern
   - Endpoints: POST/PATCH/DELETE `/releases/:releaseId/promo-deal/contacts/:contactId`
2. **Documents** — same drag-and-drop upload as label-deal pages
   - Endpoints: POST/GET/DELETE `/releases/:releaseId/promo-deal/files/:filename`

---

### New API Endpoints Needed (server.js)

No changes to the distribute endpoints — `promote` path already works via:
```
PATCH  /releases/:releaseId/distribution         { path: 'promote', entry: {...} }
PATCH  /releases/:releaseId/distribution/promote/:timestamp
DELETE /releases/:releaseId/distribution/promote/:timestamp
```

New endpoints needed for promo-deal page:
```
POST   /releases/:releaseId/promo-deal/files
GET    /releases/:releaseId/promo-deal/files/:filename
DELETE /releases/:releaseId/promo-deal/files/:filename
POST   /releases/:releaseId/promo-deal/contacts
PATCH  /releases/:releaseId/promo-deal/contacts/:contactId
DELETE /releases/:releaseId/promo-deal/contacts/:contactId

(same set for /collections/:collectionId/promo-deal/...)
```

Store promo deal info in `metadata.promoInfo`:
```json
{
  "promoInfo": {
    "contacts": [],
    "contractDocuments": []
  }
}
```

---

### Home Page Updates
1. **"Promoted" badge** — show on release/collection cards when any promote entry is `Live`
2. **"Promoted" filter** — add to the filter bar alongside Released, Submitted, Signed

---

### Build Order (recommended)
1. Server: add promo-deal contact + file endpoints (copy from label-deal, rename paths)
2. Releases detail page: replace Marketing Content section with Promo Deals
3. Collections detail page: same replacement
4. Home page: add Promoted badge + filter
5. Sidebar: add Promo Deal shortcut block on both detail pages
6. New pages: releases promo-deal page
7. New pages: collections promo-deal page

---

## After Promo Deals: Full Roadmap

### Phase: Cloud Deployment
- Host backend (Railway, Render, or Fly.io recommended)
- Host frontend (Vercel recommended for Next.js)
- Replace JSON file storage with a lightweight DB (SQLite or PlanetScale)
- Add user authentication (NextAuth.js)

### Phase: CRM
- Feature requests from real usage
- Possible: contact history, follow-up reminders, label response tracking

### Phase: Mass Upload / Catalogue Import
- **CSV import tool** — user fills spreadsheet (title, artist, genre, bpm, key, date),
  app creates all release folders + metadata.json in one batch
- **SoundCloud API import** — OAuth login, pull existing tracks with metadata + artwork
- Build post-cloud so new users benefit immediately

### Phase: Platform Plugins
- SoundCloud embed / play counts
- YouTube video embed

### Phase: Media Player
- **Wavesurfer.js** — audio waveform visualiser + player for WAV/MP3/FLAC
- **Video.js** — video playback for MP4/MOV files
- Both served from local Express API (`/releases/:releaseId/files/audio/:filename`)
- Add a collapsible player bar at the bottom of detail pages
```

***