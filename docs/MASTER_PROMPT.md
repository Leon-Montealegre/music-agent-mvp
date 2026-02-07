# Music Agent - Master Project Context v2.6

**Document Info**  
Last Updated: February 7, 2026, 11:00 AM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) IN PROGRESS  
Version: 2.6 (Version management + SoundCloud package generator built, SoundCloud form analysis complete)

---

## About Me

I'm learning to code through hands-on building ("vibe coding"). I'm a beginner building a workflow automation system for electronic music releases. I use Cursor IDE with Claude Code, and I'm comfortable with terminal commands but need explanations for technical concepts.

**Current Skill Level:**
- Comfortable with: Terminal basics, file system navigation, Git via GitHub Desktop, copying/pasting code
- Learning: Node.js/Express, n8n workflows, API design, async/await, error handling, file I/O
- Goal: Understand how systems work together (not just copy-paste, but comprehend WHY)

---

## Current Tech Stack

- **Backend:** Node.js v24.13.0 + Express + Multer (file-handler API on port 3001)
- **Workflow Engine:** n8n (Docker container on localhost:5678)
- **Storage:** Local folders: ~/Documents/Music Agent/Releases/
- **Development:** macOS, Cursor IDE, GitHub Desktop for version control
- **Future Frontend:** Next.js (Milestone 7)

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
│       └── MASTER_PROMPT_2026-02-07_03-27.md
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── MILESTONE_4_COMPLETE.md
├── README.md
└── .gitignore
```

---

## Current State (MVP Progress)

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

### ⏳ Milestone 5: Distribution Orchestrator (IN PROGRESS)

**Build Order & Status:**

| Step | Feature | Status |
|------|---------|--------|
| 1 | GET /releases/:releaseId — fetch single release | ✅ Complete |
| 2 | PATCH /releases/:releaseId/distribution — update tracking | ✅ Complete |
| 3 | Version management — multi-version support per release | ✅ Complete |
| 4a | POST /distribute/soundcloud/package — SoundCloud ZIP package | ✅ Complete (metadata.txt needs update) |
| 4b | SoundCloud form field analysis — screenshot audit of real upload form | ✅ Complete |
| 4c | Update soundcloud-metadata.txt generation — match real SoundCloud fields | ⏳ Next |
| 4d | POST /distribute/distrokid/package — DistroKid package + checklist | ⏳ Pending |
| 4e | POST /distribute/labelradar — LabelRadar submission | ⏳ Pending |
| 5 | POST /marketing/captions — social media caption generator | ⏳ Pending |
| 6 | POST /distribute/youtube — YouTube API automated upload | ⏳ Pending |

**What Was Built in This Session:**

**Version Management System (new helper functions + updated Multer):**
- `generateVersionId()` — converts version names to URL-safe folder names (e.g., "Extended Mix" → "extended-mix")
- `getVersionInfo()` — extracts version data from request, defaults to "Primary Version"
- Multer updated: audio files route to `versions/<versionId>/audio/`, artwork and video stay shared at release level
- POST /releases/:releaseId/versions — add new audio versions to existing releases
- Bug fix: route 6g had structural issues (missing upload.any() middleware, code in wrong function scope, undefined variables) — all fixed

**SoundCloud Package Generator (route 6i):**
- POST /distribute/soundcloud/package endpoint working
- Creates ZIP containing: audio file, artwork, soundcloud-metadata.txt
- Accepts: releaseId, versionId, privacy (public/private)
- Auto-updates distribution tracking in metadata.json
- Uses archiver package for ZIP creation

**SoundCloud Form Analysis (completed — informs next step):**
- Audited all 5 sections of the real SoundCloud upload form via screenshots
- Documented every field: type, required/optional, defaults
- Identified gaps in our current metadata.txt generation
- See "SoundCloud Field Reference" section below for full details

---

### SoundCloud Upload Form — Field Reference

This section documents every field in SoundCloud's upload form (audited February 7, 2026). Used to ensure our package generator provides accurate, complete metadata.

**Basic Info Tab:**

| Field | Type | Required? | Our System Has It? | Notes |
|-------|------|-----------|-------------------|-------|
| Track title | Text input | ✅ Yes | ✅ Yes | Shows red error if empty |
| Track link | URL slug | Auto-generated | N/A | Auto-fills from title |
| Main Artist(s) | Text input | Likely required | ✅ Yes | "Use commas for multiple artists" |
| Genre | Searchable dropdown | Optional | ✅ Yes | SoundCloud has predefined list |
| Tags | Text input | Optional | ❌ Missing | "styles, moods, tempo" — high discoverability value |
| Description | Text area | Optional | ✅ Yes | "Tracks with descriptions get more plays" |
| Track Privacy | Radio: Public/Private/Schedule | Required | ✅ Yes | |
| Artwork | Image upload | Optional | ✅ Yes (in ZIP) | |

**Permissions Tab:**

| Field | Type | Default | Action for MVP |
|-------|------|---------|---------------|
| Enable direct downloads | Toggle | OFF | Document in guide |
| Offline listening | Toggle | ON | Document in guide |
| Include in RSS feed | Toggle | ON | Document in guide |
| Display embed code | Toggle | ON | Document in guide |
| Enable app playback | Toggle | ON | Document in guide |
| Allow comments | Toggle | ON | Document in guide |
| Show comments to public | Toggle | OFF | Document in guide |
| Show track insights to public | Toggle | ON | Document in guide |
| Geoblocking | Radio: Worldwide/Exclusive/Blocked | Worldwide | Document in guide |

**Audio Clip Tab:**
- 20-second preview clip selector (users pick which 20 seconds play in feeds)
- Default: first 20 seconds — document this, user configures manually

**Licensing Tab:**

| Field | Type | Default | Action for MVP |
|-------|------|---------|---------------|
| All rights reserved | Radio | ✅ Selected | Recommend as default |
| Creative Commons | Radio | Not selected | Mention as option |

**Options Tab:**
- "Set to public for reach" — Artist Pro feature, public tracks only
- "Get paid for streams" — Artist Pro monetization
- Both are SoundCloud account-level features, not per-upload

**Advanced Details Tab:**

| Field | Type | Required? | Our System Has It? | Notes |
|-------|------|-----------|-------------------|-------|
| Buy link | URL input | Optional | ❌ Missing | Link fans to purchase |
| Buy link title | Text (default "Buy") | Optional | ❌ Missing | |
| Record label | Text input | Optional | ❌ Missing | |
| Release date | Date picker (MM/DD/YYYY) | Optional | ✅ Yes | |
| Publisher | Text input | Optional | ❌ Missing | |
| ISRC | Text input | Optional | ❌ Missing (planned for DistroKid) | |
| Contains explicit content | Checkbox | Optional | ❌ Missing | |
| P line | Text input | Optional | ❌ Missing | Rights holder info |

**Known Character Limits:**
- Title: 100 characters
- Description: 4,000 characters
- Tags: up to 30 tags total

**Key Findings for Metadata.txt Update:**
1. **Tags** — biggest gap. High-value for discoverability. Auto-generate from genre + artist + title
2. **Description** — current format is basic. Should be richer with more hashtags
3. **Permissions/Licensing** — don't need automation, just guidance text with recommended defaults
4. **Advanced Details** — Buy link, record label, ISRC are optional but valuable. Include as empty fields with guidance
5. **Multiple artists** — commas separate artists. Our single `artist` field works fine

---

### 3-Path Distribution Architecture

**Path 1: Release (Direct-to-Fan + Streaming Platforms)**
- Purpose: Make music publicly available
- Platforms: SoundCloud (package + guide), YouTube (API automation), Bandcamp (package + guide), DistroKid → Spotify/Apple Music/Beatport
- Privacy options per platform: Public, Private, Unlisted

**Path 2: Submit (A&R / Demo Submission)**
- Purpose: Pitch unreleased tracks to record labels
- Platforms: LabelRadar
- Allows multiple entries per platform (different labels)
- Tracked by platform + label combination

**Path 3: Promote (Social Media Content)**
- Purpose: Create promotional content
- Platforms: Instagram, TikTok, Facebook, X
- Content types: Captions with hashtags, emojis, platform-specific formatting
- Future (Milestone 6): 30-sec audio clips, social graphics, video teasers

**Distribution Tracking Structure (metadata.json):**

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
- `release` path: One entry per platform. Updates existing entry if same platform.
- `submit` path: Can have MULTIPLE entries for same platform but different labels. Tracked by platform + label combination.
- `promote` path: One entry per platform per content type.
- All entries get automatic `updatedAt` timestamps.

---

### Storage Strategy
- **MVP:** Local storage only (files on Mac, no cloud costs)
- **V2:** 30-day temporary cloud storage (AWS S3, files deleted after distribution)
- **V3:** Permanent storage tier for paid users

### Storage Structure (Updated with Version Management)

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

### ⏳ Milestone 6: Promo Content Generator
- Social media graphics (artwork with text overlays)
- Audio snippets (30-sec clips for Reels/TikTok)
- Video teasers (artwork + audio snippet as video)
- Advanced caption variations and A/B testing

### ⏳ Milestone 7: Next.js UI
- User-facing upload form (replaces n8n Form Trigger)
- Distribution path selection interface (Release / Submit / Promote with visual flow)
- Release dashboard (all releases + distribution status across all platforms)
- Individual release view (full distribution timeline)

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

**Milestone 5 Endpoints (still to build):**

| Method | Path | Purpose | Section |
|--------|------|---------|---------|
| POST | /distribute/distrokid/package | Generate DistroKid submission package (ZIP) | 6j |
| POST | /distribute/labelradar | Submit to LabelRadar / generate package | 6k |
| POST | /distribute/youtube | Upload video to YouTube via API | 6l |
| POST | /marketing/captions | Generate social media captions | 6m |

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
- googleapis, google-auth-library (YouTube API — to be installed when YouTube endpoint is built)

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

### Milestone 5 New Workflows (to be created):
- **Distribution Router Workflow:** User selects path(s), triggers appropriate sub-workflows
- **YouTube Upload Workflow:** Automated upload via YouTube Data API v3
- **Release Package Workflow:** Generates ZIP packages for SoundCloud/Bandcamp/DistroKid
- **Label Submission Workflow:** LabelRadar submission + tracking
- **Marketing Caption Workflow:** Generates captions for all social platforms

---

## Official Product Roadmap

### MVP (Current — Target: 2-4 Weeks)

**Scope:**
- Release Types: Singles only
- User Type: Artist only (solo use — just me)
- Infrastructure: Local (n8n Docker, file-handler on Mac, Next.js UI local)
- Automation Level: YouTube fully automated, everything else manual with guides + packages

**7 Milestones:**
1. ✅ Release Intake (n8n webhook)
2. ✅ File Upload Handler (Express/Multer API)
3. ✅ Metadata Transformer (releaseId, validation, metadata.json)
4. ✅ Storage Manager (listing, disk monitoring, duplicate detection, audio validation)
5. ⏳ Distribution Orchestrator (3-path system: Release, Submit, Promote) — IN PROGRESS
6. ⏳ Promo Content Generator (graphics, audio snippets, video teasers)
7. ⏳ Next.js UI (upload form, distribution dashboard)

**MVP Success Criteria:**
- Upload a single track → choose path(s) → execute distribution
- Track distribution history across all platforms
- Come back later to add more paths to same release
- YouTube upload fully automated
- SoundCloud/Bandcamp/DistroKid have package generators + guides
- LabelRadar submission with status tracking
- Marketing captions auto-generated for Instagram/TikTok/Facebook/X

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

**3-Path Distribution (not 4)**
- Merged "Publish" and "Distribute" into "Release" because artists think in intentions, not mechanisms
- SoundCloud + Spotify + Beatport are all part of one release strategy
- Cleaner UX, matches real producer workflows

**releaseId Format: YYYY-MM-DD_ArtistName_TrackTitle**
- Sortable by date, human-readable, filesystem-safe, unique per release
- Spaces removed from artist and title for filesystem compatibility

**Genre Dropdown (Not Free Text)**
- 10 options: Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other
- Ensures data consistency, prevents typos, easier for analytics

**Version Management Architecture**
- Audio files are version-specific: `versions/<versionId>/audio/`
- Artwork and video are shared across all versions (same cover art for Original Mix and Extended Mix)
- `generateVersionId()` converts names to URL-safe folder names
- Default version is "Primary Version" (versionId: "primary")
- Why: Producers routinely create Original Mix, Extended Mix, Radio Edit, Instrumental, etc.

**No Database in MVP**
- metadata.json files in release folders
- Simpler for learning, fewer moving parts, easy to inspect
- V2 adds PostgreSQL for multi-user queries

**Audio Validation After Upload**
- Multer uploads first, then music-metadata validates
- Invalid files deleted with fsSync.unlinkSync(), returns 422

**Distribution Tracking in metadata.json**
- 3 paths: release, submit, promote
- Each entry tracks: platform, status, timestamps, URLs, platform-specific data
- Automatic updatedAt timestamps on every change
- Duplicate prevention per platform (except submit, which allows multiple labels)

**SoundCloud Package (not API)**
- SoundCloud's API access is restricted and requires application approval
- MVP uses package generator (ZIP with audio + artwork + metadata text) + manual upload guide
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
- ✅ After completing each milestone
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
- v2.7: (future) SoundCloud metadata.txt updated, remaining Milestone 5 endpoints built
- v3.0: (future) V2 phase begins

**Archive Process:**
1. Copy current MASTER_PROMPT.md to docs/archive/ before major changes
2. Name: MASTER_PROMPT_YYYY-MM-DD_HH-MM.md
3. Update version number and "Last Updated" in new version
4. Update the copy in Claude Project Knowledge

---

**Changes in v2.6:**
- Version management system built: generateVersionId(), getVersionInfo(), version-aware Multer, POST /releases/:releaseId/versions endpoint
- SoundCloud package generator (route 6i) built and working — creates ZIP with audio, artwork, metadata text
- Route 6g (add version) bug identified and fixed — was missing upload.any() middleware and had code in wrong function scope
- SoundCloud upload form fully audited via 5 screenshots — all fields documented with types, requirements, defaults
- Identified metadata.txt gaps: missing Tags, improved Description needed, Permissions/Licensing guidance needed, Advanced Details fields
- Updated storage structure to reflect version management (versions/<versionId>/audio/)
- Updated build order with completion status
- Added SoundCloud Field Reference section
- Updated helper functions table and endpoint table