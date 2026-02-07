# Music Agent - Master Project Context v2.7

**Document Info**  
Last Updated: February 8, 2026, 3:00 PM CET  
Status: Milestones 1-4 Complete | Mini-MVP 1 (SoundCloud) IN PROGRESS  
Version: 2.7 (Restructured to mini-MVP approach — vertical slices by platform)

---

## About Me

I'm learning to code through hands-on building ("vibe coding"). I'm a beginner building a workflow automation system for electronic music releases. I use Cursor IDE with Claude Code, and I'm comfortable with terminal commands but need explanations for technical concepts.

**Current Skill Level:**
- Comfortable with: Terminal basics, file system navigation, Git via GitHub Desktop, copying/pasting code
- Learning: Node.js/Express, n8n workflows, API design, async/await, error handling, file I/O, Next.js
- Goal: Understand how systems work together (not just copy-paste, but comprehend WHY)

---

## Current Tech Stack

- **Backend:** Node.js v24.13.0 + Express + Multer (file-handler API on port 3001)
- **Workflow Engine:** n8n (Docker container on localhost:5678)
- **Storage:** Local folders: ~/Documents/Music Agent/Releases/
- **Development:** macOS, Cursor IDE, GitHub Desktop for version control
- **Frontend:** Next.js (starting with Mini-MVP 1)
- **Browser Automation:** Playwright MCP (for semi-automated platform uploads)

---

## Development Environment Startup

Run these commands at the start of each development session:

**Step 1: Start n8n Docker Container**
```bash
docker start n8n
```
Verify: Open http://localhost:5678

**Step 2: Start File-Handler API**
```bash
cd ~/Documents/music-agent-mvp/file-handler
node server.js
```
Success message: `✅ File-handler server running on port 3001`  
Keep this terminal window open.

**Step 3: Verify Health Check**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","message":"File handler is running"}`

**Quick Verification Checklist:**
- n8n accessible at http://localhost:5678
- File-handler API responds to /health endpoint
- ~/Documents/Music Agent/Releases/ folder exists
- Terminal window with `node server.js` is running (don't close it)

---

## Project Structure

```
~/Documents/music-agent-mvp/
├── file-handler/
│   ├── server.js (Express API - main backend)
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/
├── workflows/
│   └── Release_Form_Workflow.json (exported n8n workflow)
├── docs/
│   ├── MASTER_PROMPT.md (this file - current version)
│   └── archive/
│       ├── MASTER_PROMPT_2026-02-05_22-03.md
│       ├── MASTER_PROMPT_2026-02-05_23-33.md
│       ├── MASTER_PROMPT_2026-02-06_01-09.md
│       ├── MASTER_PROMPT_2026-02-06_02-36.md
│       ├── MASTER_PROMPT_2026-02-07_03-27.md
│       └── MASTER_PROMPT_2026-02-08_11-00.md
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── MILESTONE_4_COMPLETE.md
├── README.md
└── .gitignore
```

---

## Architecture Overview

### 3-Path Distribution Architecture

This is the core design principle of the entire system. Every action a user takes falls into one of three paths:

**Path 1: Release (Self-Release to Fans + Streaming)**
- Purpose: "I'm putting this out myself" — all platforms, one coordinated release
- Includes: Direct uploads (SoundCloud, Bandcamp), aggregator distribution (DistroKid → Spotify/Apple Music/Beatport/Deezer/Tidal), privacy/scheduling options
- Key insight: A self-releasing artist does ALL of these together, not as separate actions
- If a label rejects the track (Path 2), the artist may then choose Path 1 themselves

**Path 2: Submit (Label Pitching)**
- Purpose: "I want a label to release this" — completely different workflow because the track isn't public yet
- Includes: LabelRadar submissions, private SoundCloud links for previewing, direct A&R emails
- If a label signs it, THEY handle distribution (Path 1 becomes the label's responsibility)
- Sequential flow: Submit → wait for response → if rejected by all labels → optionally self-release via Path 1

**Path 3: Promote (Marketing Content)**
- Purpose: "I want to create marketing content" — runs alongside Path 1 or Path 2
- Includes: Captions, clips, visuals for Instagram, TikTok, Facebook, X
- Used both when self-releasing AND when a label wants promo assets from the artist

### Automation Philosophy: Human-in-the-Loop

The system automates everything EXCEPT actions with legal or financial consequences.

**✅ Automated (system does this):**
- Open upload pages and navigate to correct forms
- Identify form fields and map our metadata to them
- Pre-fill text fields from release metadata
- Upload audio files and artwork to platform forms
- Generate metadata text files, ZIP packages, captions
- Track distribution status in metadata.json

**❌ Manual — Human Required (user clicks these):**
- Final "Submit" / "Publish" / "Upload" / "Go Live" buttons
- Payment confirmations
- Terms of Service acceptance
- Copyright attestations
- Any action with legal/financial consequences

**Why this balance:**
- Eliminates the tedious prep work (filling in 15 form fields manually)
- User retains control over legally binding actions
- Semi-automation: prep work automated, final commitment manual
- Human-in-the-loop is industry best practice for music rights

### Artist vs Label User Types

**MVP = Artist workflow only.** But architected so the label layer wraps around it later.

**Artist Workflow (MVP):**
Finish track → Decide: submit to labels OR self-release → Upload assets → Choose platforms → Promote → Track results

**Label Workflow (V3 — future):**
Receive demos → A&R review → Sign track → Manage release (scheduling, ISRC/UPC, metadata) → Coordinate artist promo → Distribute → Track royalties → Manage catalog

**What labels need that artists don't:** Catalog management across many artists, royalty tracking and payment splits, ISRC/UPC generation, Beatport-exclusive scheduling windows, contract and rights management, bulk operations (2-4 releases/month across artists), DDEX standard support.

---

## MVP Roadmap: Mini-MVP Approach

Instead of building all backend → all content generation → all UI (horizontal), the MVP is structured as vertical slices by platform. Each mini-MVP delivers a complete, usable workflow: backend endpoint + UI + automation.

### Shared Foundation (Already Built — Milestones 1-4)

Everything below is shared by all mini-MVPs:

- ✅ **Release Intake:** n8n form → webhook → metadata generation
- ✅ **File Upload:** Express/Multer API with classify(), version management, validation
- ✅ **Metadata:** releaseId generation, metadata.json, genre dropdown, validation
- ✅ **Storage:** Release listing, disk monitoring, duplicate detection, audio validation
- ✅ **Distribution Tracking:** PATCH endpoint, 3-path structure in metadata.json
- ✅ **Version Management:** generateVersionId(), getVersionInfo(), multi-version audio support

### Mini-MVP 1: SoundCloud (IN PROGRESS)

**Goal:** Upload a track → system prepares everything → browser automation fills SoundCloud's form → user clicks "Upload" button only.

**What's Done:**
- ✅ POST /distribute/soundcloud/package — ZIP generator (audio + artwork + metadata.txt)
- ✅ SoundCloud upload form fully audited (5 screenshots, all fields documented)
- ✅ Distribution tracking updates automatically

**What's Left:**
| Step | Task | Status |
|------|------|--------|
| 1 | Update soundcloud-metadata.txt — match real SoundCloud form fields (tags, description, permissions guide, advanced details) | ⏳ Next |
| 2 | Next.js UI — upload form (replaces n8n form) | ⏳ Pending |
| 3 | Next.js UI — SoundCloud distribution page (select release → configure → generate package) | ⏳ Pending |
| 4 | Playwright MCP — semi-automated SoundCloud upload (open form, fill fields, upload files, stop before "Upload" button) | ⏳ Pending |
| 5 | Test end-to-end with real track | ⏳ Pending |

**SoundCloud Automation Scope:**
- Playwright opens soundcloud.com/upload
- Uploads the audio file to SoundCloud's dropzone
- Fills: title, artist, genre (searches dropdown), tags, description, privacy setting
- Uploads artwork image
- Sets release date if provided
- **STOPS** — user reviews everything and clicks "Upload" button themselves

**Mini-MVP 1 Definition of Done:**
- Can upload a track through Next.js UI
- Click "Distribute to SoundCloud" → system opens SoundCloud with everything pre-filled
- User reviews and clicks Upload
- Distribution status tracked in metadata.json

### Mini-MVP 2: Marketing Captions

**Goal:** Generate platform-specific social media captions for any release.

**Why second:** Every release needs social posts regardless of platform. This provides immediate value alongside SoundCloud.

| Step | Task | Status |
|------|------|--------|
| 1 | POST /marketing/captions — generate captions for Instagram, TikTok, Facebook, X | ⏳ Pending |
| 2 | Next.js UI — caption generation page (select release → generate → copy/edit) | ⏳ Pending |
| 3 | Platform-specific formatting (Instagram hashtag limits, X character limits, TikTok style) | ⏳ Pending |

**Mini-MVP 2 Definition of Done:**
- Select any release → click "Generate Captions"
- Get formatted captions for all 4 platforms
- Copy to clipboard or edit before posting
- Track in metadata.json promote path

### Mini-MVP 3: LabelRadar (Submit Path)

**Goal:** Submit unreleased tracks to labels via LabelRadar with maximum automation.

| Step | Task | Status |
|------|------|--------|
| 1 | Audit LabelRadar submission form (screenshots, same as SoundCloud audit) | ⏳ Pending |
| 2 | POST /distribute/labelradar/package — submission package generator | ⏳ Pending |
| 3 | Next.js UI — label submission page (select release → choose labels → submit) | ⏳ Pending |
| 4 | Playwright MCP — semi-automated LabelRadar submission (fill form, stop before submit) | ⏳ Pending |
| 5 | Submission tracking (multiple labels per release, response status) | ⏳ Pending |

**Mini-MVP 3 Definition of Done:**
- Select release → choose target labels → system prepares LabelRadar submission
- Playwright fills the form, user clicks Submit
- Track submission status per label in metadata.json submit path
- Can submit same track to multiple labels

### Mini-MVP 4: DistroKid (Aggregator Distribution)

**Goal:** Distribute to Spotify, Apple Music, Beatport, and all major streaming platforms via DistroKid.

| Step | Task | Status |
|------|------|--------|
| 1 | Audit DistroKid upload form (screenshots) | ⏳ Pending |
| 2 | POST /distribute/distrokid/package — package + checklist generator | ⏳ Pending |
| 3 | Next.js UI — DistroKid distribution page | ⏳ Pending |
| 4 | Playwright MCP — semi-automated DistroKid upload (fill form, stop before submit) | ⏳ Pending |
| 5 | Beatport-specific handling (genre tagging, artwork validation, exclusive windows) | ⏳ Pending |

**Beatport as First-Class Citizen:**
- DistroKid distributes to Beatport, but we track Beatport-specific data
- Proper genre/subgenre tagging (Beatport has specific categories)
- Artwork validation (1400x1400 minimum for Beatport)
- Exclusive release windows (common: 2 weeks on Beatport before Spotify)

**Mini-MVP 4 Definition of Done:**
- Select release → system prepares DistroKid submission with all metadata
- Playwright fills form, user clicks Upload
- Track distribution status including individual platform statuses (Beatport live, Spotify pending, etc.)
- ISRC tracking when received from DistroKid

### Mini-MVP 5: YouTube (API Automation)

**Goal:** Fully automated YouTube upload via API (most complex — requires OAuth).

| Step | Task | Status |
|------|------|--------|
| 1 | Set up Google Cloud project + YouTube Data API v3 credentials | ⏳ Pending |
| 2 | OAuth2 authentication flow | ⏳ Pending |
| 3 | POST /distribute/youtube — automated video upload | ⏳ Pending |
| 4 | Next.js UI — YouTube upload page (select release, configure, upload) | ⏳ Pending |
| 5 | Auto-generate video from artwork + audio (if no video file uploaded) | ⏳ Pending |

**Why last:** Requires Google API credentials and OAuth setup — most technically complex. Also the only platform where we can achieve FULL automation (no human-in-the-loop needed since YouTube API handles the upload directly).

**Mini-MVP 5 Definition of Done:**
- Select release → click "Upload to YouTube" → fully automated
- Video uploaded with title, description, tags, thumbnail
- Distribution status tracked in metadata.json
- No manual steps required (YouTube API handles everything)

---

## Completed Work (Milestones 1-4)

### ✅ Milestone 1 Complete: Release Intake
- n8n "Release Intake" workflow receives JSON metadata via webhook
- Transforms metadata (generates releaseId: YYYY-MM-DD_Artist_Title format)
- Responds with confirmation

### ✅ Milestone 2 Complete: File Upload Handler
- File-handler API fully functional (server.js)
- Successfully tested: curl + n8n Form uploads work perfectly
- Server uses .any() to accept any field name, classify() function sorts by mimetype + file extension fallback
- n8n Form Trigger with 7 fields: artist, title, genre (dropdown), releaseType, audioFile, artworkFile, videoFile (optional)
- Docker networking working: using host.docker.internal:3001
- IF node conditional routing: handles video vs no-video uploads correctly
- Tested with real files: audio (56MB WAV), artwork (3MB PNG), video (6MB MP4)

### ✅ Milestone 3 Complete: Metadata Transformer
- Input validation: artist (1-100 chars), title (1-200 chars), genre (dropdown), releaseType (Singles only in MVP)
- Genre dropdown: 10 options (Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other)
- metadata.json generation: releaseId, artist, title, genre, releaseType, releaseDate, createdAt, files array
- Files array catalogs: filename, size, mimetype for each uploaded file
- Metadata saved to each release folder alongside audio/artwork/video files
- Works with and without video uploads
- Validation errors provide helpful feedback to user

### ✅ Milestone 4 Complete: Storage Manager
- Release listing: GET /releases endpoint returns all releases sorted by date (newest first)
- Disk space monitoring: GET /storage/status endpoint tracks available storage (warns if < 10GB free)
- Duplicate detection: Blocks re-uploads of existing releaseIds with 409 Conflict status
- Audio validation: music-metadata package validates WAV/MP3 files, checks duration (1s-1hr) and format integrity
- Console logging: Helpful emoji indicators (🚫 duplicate, 🎵 validating, ✅ valid, 💾 disk check, 📂 listing)
- Installed packages: music-metadata, check-disk-space, file-type-checker

---

## SoundCloud Upload Form — Field Reference

This section documents every field in SoundCloud's upload form (audited February 7, 2026). Used to ensure our package generator and Playwright automation provide accurate, complete data.

**Basic Info Tab:**

| Field | Type | Required? | Our System Has It? | Automation |
|-------|------|-----------|-------------------|------------|
| Track title | Text input | ✅ Yes | ✅ Yes | Playwright fills |
| Track link | URL slug | Auto-generated | N/A | Auto-fills from title |
| Main Artist(s) | Text input | Likely required | ✅ Yes | Playwright fills |
| Genre | Searchable dropdown | Optional | ✅ Yes | Playwright searches + selects |
| Tags | Text input | Optional | ❌ Build in metadata.txt update | Playwright fills |
| Description | Text area | Optional | ✅ Yes (needs improvement) | Playwright fills |
| Track Privacy | Radio: Public/Private/Schedule | Required | ✅ Yes | Playwright selects |
| Artwork | Image upload | Optional | ✅ Yes (in ZIP) | Playwright uploads |

**Permissions Tab:**

| Field | Type | Default | Action |
|-------|------|---------|--------|
| Enable direct downloads | Toggle | OFF | Document in guide (default is fine) |
| Offline listening | Toggle | ON | Document in guide (default is fine) |
| Include in RSS feed | Toggle | ON | Document in guide (default is fine) |
| Display embed code | Toggle | ON | Document in guide (default is fine) |
| Enable app playback | Toggle | ON | Document in guide (default is fine) |
| Allow comments | Toggle | ON | Document in guide (default is fine) |
| Show comments to public | Toggle | OFF | Document in guide (default is fine) |
| Show track insights to public | Toggle | ON | Document in guide (default is fine) |
| Geoblocking | Radio: Worldwide/Exclusive/Blocked | Worldwide | Document in guide (default is fine) |

**Audio Clip Tab:**
- 20-second preview clip selector — user configures manually (leave as default first 20 seconds)

**Licensing Tab:**

| Field | Type | Default | Action |
|-------|------|---------|--------|
| All rights reserved | Radio | ✅ Selected | Recommend as default |
| Creative Commons | Radio | Not selected | Mention as option |

**Options Tab:**
- "Set to public for reach" — Artist Pro feature, public tracks only
- "Get paid for streams" — Artist Pro monetization
- Both are account-level features, not per-upload

**Advanced Details Tab:**

| Field | Type | Required? | Our System Has It? | Automation |
|-------|------|-----------|-------------------|------------|
| Buy link | URL input | Optional | ❌ Include as empty in guide | User fills manually |
| Buy link title | Text (default "Buy") | Optional | ❌ Include in guide | User fills manually |
| Record label | Text input | Optional | ❌ Include in guide | User fills manually |
| Release date | Date picker (MM/DD/YYYY) | Optional | ✅ Yes | Playwright fills |
| Publisher | Text input | Optional | ❌ Include in guide | User fills manually |
| ISRC | Text input | Optional | ❌ Planned for DistroKid | User fills manually |
| Contains explicit content | Checkbox | Optional | ❌ Include in guide | User checks manually |
| P line | Text input | Optional | ❌ Include in guide | User fills manually |

**Known Character Limits:**
- Title: 100 characters
- Description: 4,000 characters
- Tags: up to 30 tags total

---

## Distribution Tracking Structure (metadata.json)

```json
{
  "releaseId": "2026-02-07_Artist_Track",
  "artist": "Artist Name",
  "title": "Track Title",
  "genre": "Melodic House and Techno",
  "releaseType": "Single",
  "releaseDate": "2026-02-07",
  "createdAt": "2026-02-07T04:00:00.000Z",
  "versions": {
    "primary": {
      "versionName": "Primary Version",
      "versionId": "primary"
    },
    "extended-mix": {
      "versionName": "Extended Mix",
      "versionId": "extended-mix"
    }
  },
  "files": {
    "audio": [{ "filename": "track.wav", "size": 56379422, "mimetype": "audio/wav" }],
    "artwork": [{ "filename": "cover.png", "size": 3437306, "mimetype": "image/png" }],
    "video": [{ "filename": "promo.mp4", "size": 6024736, "mimetype": "video/mp4" }]
  },
  "distribution": {
    "release": [
      {
        "platform": "SoundCloud",
        "versionId": "primary",
        "status": "package_generated",
        "privacy": "public",
        "packagePath": "packages/soundcloud-primary.zip",
        "generatedAt": "2026-02-07T04:00:00.000Z"
      }
    ],
    "submit": [
      {
        "platform": "LabelRadar",
        "label": "Anjunadeep",
        "status": "submitted",
        "submittedAt": "2026-02-07T03:30:00.000Z"
      }
    ],
    "promote": [
      {
        "platform": "Instagram",
        "contentType": "caption",
        "status": "generated",
        "generatedAt": "2026-02-07T06:00:00.000Z"
      }
    ]
  }
}
```

**Distribution Tracking Rules:**
- `release` path: One entry per platform+versionId. Updates existing entry if same combo.
- `submit` path: Can have MULTIPLE entries for same platform but different labels. Tracked by platform + label combination.
- `promote` path: One entry per platform per content type.
- All entries get automatic `updatedAt` timestamps.

---

### Storage Strategy
- **MVP:** Local storage only (files on Mac, no cloud costs)
- **V2:** 30-day temporary cloud storage (AWS S3, files deleted after distribution)
- **V3:** Permanent storage tier for paid users

### Storage Structure (Version-Aware)

```
Releases/
  └── 2026-02-07_Artist_Track/
        ├── versions/
        │   ├── primary/
        │   │   └── audio/
        │   │       └── track.wav
        │   └── extended-mix/
        │       └── audio/
        │           └── track-extended.wav
        ├── artwork/              (shared by all versions)
        │   └── cover.png
        ├── video/                (shared by all versions)
        │   └── promo.mp4
        ├── packages/             (generated ZIP files)
        │   └── soundcloud-primary.zip
        └── metadata.json
```

---

## File-Handler API Details (server.js)

**server.js is organized into 8 sections:**

| Section | Purpose |
|---------|---------|
| 1. Imports | Loading packages (express, multer, cors, path, fs, checkDiskSpace, musicMetadata, archiver) |
| 2. Server Configuration | Express app, port 3001, middleware (CORS, JSON parser) |
| 3. Constants | RELEASES_BASE path |
| 4. Helper Functions | requireReleaseId(), classify(), validateAudioFile(), generateVersionId(), getVersionInfo() |
| 5. Multer Configuration | File upload storage settings (version-aware for audio) |
| 6. API Routes | All endpoint handlers (6a through 6i+) |
| 7. Error Handler | Catch-all for unhandled errors |
| 8. Start Server | app.listen() |

**Current Endpoints:**

| Method | Path | Purpose | Section | Status |
|--------|------|---------|---------|--------|
| GET | /health | Server status check | 6a | ✅ |
| POST | /upload?releaseId=...&artist=...&title=...&genre=...&versionName=... | File upload with duplicate detection + audio validation | 6b | ✅ |
| POST | /metadata | Save metadata.json for a release | 6c | ✅ |
| GET | /releases | List all releases (sorted newest first) | 6d | ✅ |
| GET | /storage/status | Disk space information | 6h | ✅ |
| GET | /releases/:releaseId | Get single release details | 6e | ✅ |
| PATCH | /releases/:releaseId/distribution | Update distribution tracking | 6f | ✅ |
| POST | /releases/:releaseId/versions | Add audio version to existing release | 6g | ✅ |
| POST | /distribute/soundcloud/package | Generate SoundCloud upload package (ZIP) | 6i | ✅ (metadata.txt needs update) |

**Endpoints Still to Build (by Mini-MVP):**

| Mini-MVP | Method | Path | Purpose |
|----------|--------|------|---------|
| 2 | POST | /marketing/captions | Generate social media captions |
| 3 | POST | /distribute/labelradar/package | Generate LabelRadar submission package |
| 4 | POST | /distribute/distrokid/package | Generate DistroKid submission package |
| 5 | POST | /distribute/youtube | Upload video to YouTube via API |

**V2 Endpoints (deferred):**

| Method | Path | Purpose |
|--------|------|---------|
| POST | /releases/:releaseId/archive | Archive a release |
| DELETE | /releases/:releaseId | Delete a release (with confirmation) |

**Helper Functions (Section 4):**

| Function | Purpose |
|----------|---------|
| `requireReleaseId(req)` | Extracts releaseId from URL params or query string, throws 400 if missing |
| `classify(file)` | Determines file type (audio/artwork/video) by mimetype then extension fallback |
| `validateAudioFile(filePath)` | Validates audio with music-metadata: checks duration (1s-1hr), format, codec |
| `generateVersionId(versionName)` | Converts version name to URL-safe folder name ("Extended Mix" → "extended-mix") |
| `getVersionInfo(req)` | Extracts version data from request, defaults to "Primary Version" |

**Multer Configuration (Section 5):**
- Uses .any() to accept any field name
- classify() function: mimetype first, file extension fallback
  - Audio: .wav, .mp3, .flac, .aiff, .m4a, .ogg → `versions/<versionId>/audio/` folder
  - Image: .jpg, .jpeg, .png, .gif, .webp, .bmp → `artwork/` folder (shared)
  - Video: .mp4, .mov, .avi, .mkv, .webm → `video/` folder (shared)

**Installed npm Packages:**
- express, multer, cors (core server)
- music-metadata (audio validation)
- check-disk-space (disk monitoring)
- file-type-checker (reserved for V2 enhanced validation)
- archiver (ZIP file creation for distribution packages)

---

## n8n Workflow Structure

### Current: Release Intake Workflow (Milestones 1-3)
```
Form Trigger (7 fields: artist, title, genre dropdown, releaseType, audio, artwork, video)
  ↓
Validate Inputs (Code node: checks required fields, format, genre list)
  ↓
Set Node (generates releaseId: YYYY-MM-DD_ArtistName_TrackTitle, timestamp)
  ↓
IF Node (checks if video file uploaded)
  ├─→ HTTP Request (with video) → Create Metadata (with video) → Save Metadata (with video) → Respond
  └─→ HTTP Request (no video) → Create Metadata (no video) → Save Metadata (no video) → Respond
```

**Note:** The n8n Form Trigger will be replaced by the Next.js UI in Mini-MVP 1. The n8n workflow continues to handle backend orchestration.

---

## Product Roadmap (Beyond MVP)

### V2 (Multi-User SaaS — Target: 2-3 Months After MVP)

**Scope:**
- Users: 10-100 beta artists
- Infrastructure: Cloud-hosted (Railway/Render backend, Vercel frontend, AWS S3 storage)
- Authentication: Email/password + OAuth (Google, Spotify)
- Storage: 30-day temporary storage
- Payments: Stripe (free tier + Pro at $10/month)

**V2 Additions:**
- PostgreSQL database (user accounts, release metadata, distribution tracking)
- User dashboard (all releases, distribution status, analytics)
- Release archiving + deletion
- Batch operations (distribute multiple releases at once)
- Enhanced validation (artwork dimensions for Beatport, audio quality checks)
- SoundCloud API integration (if approved)
- LabelRadar API integration (if available)
- Email notifications (distribution confirmations, label responses)
- Beatport-exclusive release scheduling
- ISRC/UPC tracking and management

### V3 (Full Platform with Label Support — Target: 6-12 Months After V2)

**Artist Features:**
- EP/Album support (multi-track releases)
- Advanced analytics (streaming stats, demographic data)
- Pre-save campaign management
- Collaboration features (multiple artists per release)
- Beatport/Traxsource chart tracking

**Label Features (New User Type):**
- Multi-artist catalog management
- A&R demo review pipeline
- Royalty tracking and payment splits
- ISRC/UPC generation and management
- Beatport-exclusive scheduling windows
- DDEX standard support for label-level distribution
- Contract and rights management
- Bulk release operations

**Business Model:**

| Tier | Price | Users | Features |
|------|-------|-------|----------|
| Free | $0/mo | Beta artists | 5 releases/month, 30-day storage, basic distribution |
| Pro | $10/mo | Artists | Unlimited releases, 90-day storage, all platforms, analytics |
| Label | $50/mo | Labels | Multi-artist, permanent 1TB storage, DDEX, Beatport scheduling |
| Enterprise | $500-2,000/mo | Distributors | White-label, API access, custom workflows |

---

## Key Technical Decisions & Rationale

**Mini-MVP Approach (not horizontal milestones)**
- Each mini-MVP delivers a complete, usable vertical slice: backend + UI + automation for one platform
- User can release music through the system after Mini-MVP 1, not after all milestones
- Faster feedback loops — catch design mistakes early before building 4 more platforms on a broken foundation
- Learning compounds: Next.js knowledge from Mini-MVP 1 makes Mini-MVP 2 much faster

**3-Path Distribution (not 4)**
- Merged "Publish" and "Distribute" into "Release" because artists think in intentions, not mechanisms
- SoundCloud + Spotify + Beatport are all part of one release strategy
- Cleaner UX, matches real producer workflows

**Semi-Automation via Playwright (not full-manual packages)**
- Playwright MCP opens platform upload forms, fills fields, uploads files
- System stops before the final Submit/Publish button — user clicks that
- Much faster than "download ZIP, open SoundCloud, fill everything manually"
- Respects legal boundaries (user confirms Terms of Service, copyright attestation)

**releaseId Format: YYYY-MM-DD_ArtistName_TrackTitle**
- Sortable by date, human-readable, filesystem-safe, unique per release
- Spaces removed from artist and title for filesystem compatibility

**Genre Dropdown (Not Free Text)**
- 10 options: Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other
- Ensures data consistency, prevents typos, easier for analytics

**Version Management Architecture**
- Audio files are version-specific: `versions/<versionId>/audio/`
- Artwork and video are shared across all versions
- `generateVersionId()` converts names to URL-safe folder names
- Default version is "Primary Version" (versionId: "primary")

**No Database in MVP**
- metadata.json files in release folders
- Simpler for learning, fewer moving parts, easy to inspect
- V2 adds PostgreSQL for multi-user queries

**SoundCloud Package + Playwright (not SoundCloud API)**
- SoundCloud's API access is restricted and requires application approval
- MVP uses Playwright browser automation to fill the upload form
- metadata.txt in ZIP serves as backup / reference if Playwright isn't available
- V2: Apply for SoundCloud API access, add full automation if approved

**Beatport as First-Class Citizen**
- DistroKid distributes to Beatport, but we track Beatport-specific data
- Exclusive windows, genre tagging, artwork requirements
- Reflects Beatport's importance in electronic music

**Local Storage First, Cloud Later**
- MVP: local filesystem, zero costs
- V2: AWS S3 with 30-day temporary storage
- V3: permanent storage tier for paid users

---

## Common Issues & Solutions

| Issue | Solution | Why |
|-------|----------|-----|
| ECONNREFUSED when n8n calls file-handler | Use `http://host.docker.internal:3001` | Docker networking isolation |
| "Referenced node doesn't exist" in n8n | Don't use `$('Node Name')`; pass data through workflow | Node name references are fragile |
| req.body is undefined in Express | Add `app.use(express.json())` before routes | Express doesn't parse JSON by default |
| metadata.json shows "[object Object]" | Use "Using Fields Below" mode in n8n HTTP Request | Quoted expressions serialize objects to strings |
| Merge node not executing in n8n | Don't use Merge after IF; duplicate nodes on each branch | Merge expects both inputs, IF sends one |
| Genre showing "Unknown" | Pass genre as query parameter, return in response | Metadata code can't access Form Trigger directly |
| Git tracking node_modules/ | Add to .gitignore + `git rm -r --cached file-handler/node_modules` | node_modules regenerates with npm install |
| Route 6g (add version) broken | Missing upload.any() middleware + code was in wrong function scope | 3 middleware functions must be chained: check → upload.any() → async handler |

---

## Learning Preferences

**How I Learn Best:**
- Show working code first, then explain WHY
- Real-world analogies (music production, workflows)
- Small, testable steps
- Run/test immediately to see results
- Explain "what could go wrong" scenarios

**Explanation Style:**
- High-level goal first ("We're building X so you can Y")
- Code implementation
- Key concepts in plain language
- Common pitfalls
- Next steps

---

## Master Prompt Management

**This document lives in two places:**
1. `docs/MASTER_PROMPT.md` in the GitHub repo (source of truth — edit here)
2. Claude Project Knowledge (copy for AI context — update after editing repo version)

**When to Update:**
- ✅ After completing each mini-MVP
- ✅ When making significant architectural decisions
- ✅ After solving tricky bugs
- ✅ When changing tech stack or dependencies
- ❌ Not for minor code tweaks

**Version History:**
- v2.0: Milestone 1 complete
- v2.1: Milestone 2 complete
- v2.2: Milestone 3 complete
- v2.3: Milestone 4 complete
- v2.4: Milestone 5 scoped (4-path architecture)
- v2.5: Milestone 5 re-architected (3-path: Release, Submit, Promote) + Artist/Label user types defined
- v2.6: Version management built, SoundCloud package generator built, SoundCloud form field audit complete, route 6g bug fixed
- v2.7: Restructured from horizontal milestones to mini-MVP vertical slices. Added Playwright automation vision. Preserved 3-path architecture and human-in-the-loop philosophy.
- v2.8: (future) Mini-MVP 1 complete — SoundCloud end-to-end working
- v3.0: (future) V2 phase begins

**Archive Process:**
1. Copy current MASTER_PROMPT.md to docs/archive/ before major changes
2. Name: MASTER_PROMPT_YYYY-MM-DD_HH-MM.md
3. Update version number and "Last Updated" in new version
4. Update the copy in Claude Project Knowledge

---

**Changes in v2.7:**
- Restructured entire roadmap from horizontal milestones (5→6→7) to vertical mini-MVPs (SoundCloud→Captions→LabelRadar→DistroKid→YouTube)
- Each mini-MVP delivers complete backend + UI + automation for one platform
- Added Playwright MCP automation philosophy: automate everything except legal/financial actions
- Defined human-in-the-loop boundaries (what system does vs what user clicks)
- Moved 3-path architecture and artist/label vision into top-level Architecture Overview section
- Added Definition of Done for each mini-MVP
- Added SoundCloud automation scope (exactly what Playwright will fill)
- Preserved all existing technical decisions and completed work documentation
- Added Playwright MCP to tech stack
- Updated version history and archive list