# 🎛️ Continuation Prompt — March 14, 2026

Always read `MASTER_PROMPT_MARCH_14_2026.md` first for full context.

---

## What Was Completed This Session (March 13–14, 2026)

### Promo Deal System — FULLY COMPLETE
Both releases and collections now have a complete Promo Deal system:

**Backend (server.js)**
- `GET/PATCH/DELETE /releases/:releaseId/promo/:promoId` — per-entry promo detail
- `POST/PATCH/DELETE /releases/:releaseId/promo/:promoId/contacts/:contactId`
- `POST/GET/DELETE /releases/:releaseId/promo/:promoId/files/:filename`
- `PATCH /releases/:releaseId/promo/:promoId/notes`
- `POST/PATCH/DELETE /releases/:releaseId/promo-deal/contacts/:contactId`
- `POST/GET/DELETE /releases/:releaseId/promo-deal/files/:filename`
- All of the above mirrored for `/collections/:collectionId/...`
- `PATCH /releases/:releaseId/sign` — correctly persists `labelInfo.isSigned`, `label`, `signedDate` and updates the matching submit entry status to `'signed'`
- `PATCH /collections/:collectionId/sign` — same, persists to `labelInfo`

**Frontend**
- `releases/[releaseId]/page.js` — Promo Deals section replaces Marketing Content placeholder; `handleMarkAsSigned` calls `await loadTrack()` after signing
- `collections/[collectionId]/page.js` — same; `handleMarkAsSigned` calls `await loadCollection()` after signing
- `releases/[releaseId]/promo-deal/page.js` — new page: top-level promo deal contacts + documents
- `collections/[collectionId]/promo-deal/page.js` — same for collections
- Per-entry promo detail pages created
- Promoted badge appears when any promote entry has `status: 'Live'`
- Home page: Promoted filter added

### Bug Fixes This Session
1. **Signed status stale UI** — confirmed the issue was backend-only. Both `handleMarkAsSigned` functions already call `await loadTrack()` / `await loadCollection()` after a successful sign. The fix was ensuring the `/sign` endpoints in server.js correctly persist `labelInfo.isSigned = true` to the JSON file. No frontend changes needed.

---

## Current App State

### Pages
```
/                                      ← Home / Catalogue (grid view, filters, badges)
/releases/[releaseId]                  ← Release detail
/releases/[releaseId]/label-deal       ← Label deal (contacts + docs)
/releases/[releaseId]/promo-deal       ← Promo deal (contacts + docs)
/collections/[collectionId]            ← Collection detail
/collections/[collectionId]/label-deal ← Label deal (contacts + docs)
/collections/[collectionId]/promo-deal ← Promo deal (contacts + docs)
```

### Sidebar (Release + Collection detail pages)
- Artwork block (upload / replace / delete)
- Audio files block (add / delete)
- Video files block (add / delete)
- Label Deal shortcut block
- Promo Deal shortcut block

### Badge States
| Badge | Trigger |
|-------|---------|
| Signed | `labelInfo.isSigned === true` |
| Submitted | Has submit entries, not signed |
| Released | Any release entry `status === 'live'` |
| Promoted | Any promote entry `status === 'Live'` |

---

## Next Feature: Fix Sticky Back Button Header

### Problem
The back button row (header) at the top of detail pages scrolls up with the page content and eventually sits at the very top of the viewport, obscuring the app logo.

### Fix
In every page that has a back button header row, change the container from plain `div` to sticky:

```jsx
// Change this pattern:
<div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a2a' }}>
  <BackButton />
</div>

// To this:
<div style={{
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: '#0a0a0a',   // match page background
  padding: '16px 24px',
  borderBottom: '1px solid #2a2a2a'
}}>
  <BackButton />
</div>
```

### Pages to Update
- `releases/[releaseId]/page.js`
- `releases/[releaseId]/label-deal/page.js`
- `releases/[releaseId]/promo-deal/page.js`
- `collections/[collectionId]/page.js`
- `collections/[collectionId]/label-deal/page.js`
- `collections/[collectionId]/promo-deal/page.js`
- Any per-entry label/promo detail pages

**Test:** Scroll down on a detail page — the back button row should stay fixed just below the logo, not scroll off the top.

---

## Next Feature: Grid / List View Toggle

### Goal
Allow users to toggle between the current grid card layout and a compact list layout on the home page catalogue. Useful for large catalogues.

### Toggle Button
- Small icon button pair in the top-right of the catalogue section header
- Grid icon (current default) | List icon
- Save preference to `localStorage` key `'catalogueView'` (default: `'grid'`)

### List View Design (UX spec)
Each row shows — in one horizontal line:
```
[artwork 40px] [title bold]  [artist muted]  [genre chip]  [BPM]  [key]  [date]  [badges]
```
- Row height: ~56px with 12px vertical padding
- Thin `1px` divider between rows
- Hover: subtle row highlight (`rgba(255,255,255,0.04)`)
- Artwork: 40×40 rounded square, fallback to vinyl icon
- Title: white, font-weight 600, max-width truncated
- Artist / genre / BPM / key: muted (`#888`), smaller font
- Badges: same pill components as grid view, right-aligned
- Clicking a row navigates to the detail page (same as grid card)

### Grid View
Unchanged — keep exactly as is.

---

## Next Feature: CRM — Global Contacts Page

### Route
`/contacts`

### Nav
Add a "Contacts" button in the top nav bar, between the existing nav items and the Statistics button.

### Data Source
Aggregate contacts from:
- `metadata.metadata.labelInfo.contacts[]` (releases)
- `metadata.metadata.promoInfo.contacts[]` (releases)
- `metadata.metadata.distribution.submit[].contacts[]` (per-entry label contacts)
- `metadata.metadata.distribution.promote[].contacts[]` (per-entry promo contacts)
- Same paths for collections

Call: `GET /releases` + `GET /releases/:id` for each + `GET /collections` + `GET /collections/:id` for each.

### UI
- Search bar (name, label/company)
- Filter chips: All / Label / Promo / Other
- List view: name, label/company, email, phone, role, linked release/collection name (clickable)
- Click contact row → show detail panel or modal with all fields + linked context

### No new backend endpoints needed for MVP
Fetch data from existing endpoints and aggregate client-side.

---

## Next Feature: CRM — Global Documents Page

### Route
`/documents`

### Nav
Add a "Documents" button next to the Contacts button.

### Data Source
Aggregate file entries from:
- `metadata.notes.documents[]`
- `metadata.metadata.labelInfo.contractDocuments[]`
- `metadata.metadata.promoInfo.contractDocuments[]`
- Per-entry `distribution.submit[].documents[]`
- Per-entry `distribution.promote[].documents[]`
- Same for collections

### UI
- Search bar (filename)
- Filter: All / Contract / Audio / Image / Other (derived from file extension)
- List: filename, type icon, size, upload date, linked release/collection (clickable), download button
- Download calls existing `GET /releases/:releaseId/files/:fileType/:filename` or label-deal/promo-deal file endpoints

---

## CRM Feature Suggestions (Low-Hanging Fruit)

These are the most valuable next CRM additions after Contacts + Documents:

| # | Feature | Value | Effort |
|---|---------|-------|--------|
| 1 | **Follow-up reminders** — set a follow-up date on any submission; overdue ones show a red badge on home page | High | Low |
| 2 | **Label response tracking** — dropdown per submission: No Reply / Passed / Interested / Signed | High | Low |
| 3 | **Last-contacted date** on contacts — "Last contacted: 3 weeks ago" | Medium | Low |
| 4 | **Activity feed** — chronological log: submitted to X, signed by Y, promoted on Z | High | Medium |
| 5 | **Submission stats** — total pitched, % signed, avg response time, top labels | High | Medium |
| 6 | **Pipeline / Kanban view** — submissions grouped by status column | Medium | Medium |
| 7 | **Email pitch template** — fill in label/promo name, generates a ready-to-copy pitch email | Medium | Low |
| 8 | **Bulk status update** — select multiple submissions, update all to same status | Medium | Low |

Recommended order: 1 → 2 → 3 → 5 → 4

---

## Future Phases

### Cloud Deployment
- Backend: Railway or Render
- Frontend: Vercel
- DB: PostgreSQL (replace JSON files)
- Auth: NextAuth.js (Google + email)
- Mobile-responsive redesign (Tailwind CSS recommended for this phase)

### Mass Upload / Catalogue Import
- CSV import — user fills a template spreadsheet, app batch-creates all releases
- SoundCloud API import — OAuth, pulls tracks + metadata + artwork automatically
- Build post-cloud so new users onboard in minutes

### Platform Integrations
- SoundCloud embed + live play-count display
- YouTube video embed on release detail page

### Media Player
- **Wavesurfer.js** — waveform visualiser + player (WAV/MP3/FLAC)
- **Video.js** — video player (MP4/MOV)
- Collapsible persistent bar at the bottom of detail pages
- Audio served from: `GET /releases/:releaseId/files/audio/:filename`
