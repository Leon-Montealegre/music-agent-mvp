## CONTINUATION PROMPT

```markdown
# 🎛️ Continuation Prompt — March 15, 2026

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.

---

## MVP Status — COMPLETE ✅

The local MVP is fully shipped as of March 15, 2026. All features are working and tested.

---

## What Was Completed (Full MVP)

### Core App
- Release + Collection management — metadata, audio, video, artwork, versions
- 3-path distribution: Release (platforms), Submit (labels), Promote (promo deals)
- Per-entry detail pages for every label submission and promo entry
- Signed/Released/Promoted/Submitted badge system

### CRM Pages (read-only, client-side aggregation)
- `/contacts` — aggregates all contacts from every release + collection, deduplicated by name, searchable, filterable by Label/Promo/Other, detail modal per contact
- `/files` — aggregates all uploaded files, filterable by Audio/Video/Label/Promo/General, download button per file
- Both pages use `frontend/src/lib/contacts.js` — exports `fetchAllContacts()` and `fetchAllFiles()`

### UI Polish
- Home page: grid/list toggle (localStorage persisted), sticky back button headers on all detail pages
- Section order on all detail pages: Contacts → Notes → Files
- Home page nav buttons (uniform height 36px, minWidth 110px): 👤 Contacts | 📁 Files | 📊 Statistics | ✚ Add Track
- Header buttons (FeedbackButton, Settings, Buy Me Coffee) all same height via `style={{ height: '36px' }}`

---

## Current Page Structure
/ ← Home / Catalogue
/contacts ← CRM Contacts
/files ← CRM Files
/stats ← Statistics
/settings ← Settings
/releases/[releaseId] ← Release detail
/releases/[releaseId]/label/[labelId] ← Label submission entry
/releases/[releaseId]/promo/[promoId] ← Promo entry
/collections/[collectionId] ← Collection detail
/collections/[collectionId]/label/[labelId] ← Label submission entry
/collections/[collectionId]/promo/[promoId] ← Promo entry

text

---

## Dead Schema Paths (ignore these — nothing writes to them)
- `labelInfo.contractDocuments[]`
- `promoInfo.contractDocuments[]`

These exist in old metadata.json files but have no UI. Do not read from or write to them.

---

## What's Next — Phase 2: Cloud Migration

### Goal
Move the app from local JSON files to a hosted cloud stack so it's accessible from anywhere and ready for multi-user support.

### Target Stack
| Layer | Service |
|-------|---------|
| Backend | Railway or Render (Node.js/Express) |
| Frontend | Vercel (Next.js) |
| Database | PostgreSQL (replaces all JSON files) |
| Auth | NextAuth.js (Google + email) |

### Key Decisions Already Made
- **No data migration needed** — existing contact and file data is dummy/test data, start fresh
- **Schema redesign** — contacts become a proper `contacts` table with foreign keys; this enables the full CRM shared contacts store (Phase 3)
- **Mobile-responsive redesign** post-cloud using Tailwind CSS

### Phase 3 After Cloud (CRM Upgrade)
Once on PostgreSQL, build the shared contacts store:
- `contacts` table — one row per contact, referenced by ID from releases/submissions/promo entries
- "Choose existing contact" picker on all label + promo entry pages
- Edit once → updates everywhere
- Follow-up reminders, activity feed, submission pipeline view

---

## Development Principles (reminders)
- Never rebuild working code — only extend
- Small testable steps — one change at a time, test before moving on
- After every mutation: `await loadTrack()` or `await loadCollection()`
- No Redux/Zustand — local useState only
- Confirm before editing `server.js`, `layout.js`, or `globals.css`
