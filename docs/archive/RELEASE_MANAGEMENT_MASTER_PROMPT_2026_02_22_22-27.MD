# Release Management System — Master Project Context v3.0

**Document Info**  
Last Updated: February 9, 2026, Evening CET  
Status: Foundation Complete (Milestones 1-4) | Strategic Pivot to Release Management | Mini-MVP 1 (Release Dashboard) NEXT  
Version: 3.0 (Major pivot from "Music Agent" workflow automation to "Release Management System")

---

## About Me

I'm learning to code through hands-on building ("vibe coding"). I'm a beginner building a **release management system** for my own electronic music releases. I use Cursor IDE with Claude Code, and I'm comfortable with terminal commands but need explanations for technical concepts.

I'm an **active electronic music artist** who releases music regularly. This project serves two purposes: learning to code properly, and building a tool I'll actually use myself. One day, other musicians might use it too.

**Current Skill Level:**
- Comfortable with: Terminal basics, file system navigation, Git via GitHub Desktop, copying/pasting code
- Learning: Node.js/Express, n8n workflows, API design, async/await, error handling, file I/O, Next.js
- Goal: Understand how systems work together (not just copy-paste, but comprehend WHY)

**How I Learn Best:**
- Show working code first, then explain WHY
- Real-world analogies (music production, workflows)
- Small, testable steps — run/test immediately to see results
- High-level goal first ("We're building X so you can Y"), then code, then explain key concepts
- Explain "what could go wrong" scenarios

---

## What This Project IS (and ISN'T)

### It IS: A Release Command Center
A personal dashboard where I can see every release I'm working on, know exactly where each track stands across platforms and label submissions, never forget to follow up with a label, and have all my metadata organized and ready when I need it.

**Think of it like:** A project management tool (like Trello or Notion) but purpose-built for the music release workflow. It doesn't replace platforms like SoundCloud, DistroKid, or LabelRadar — it sits above them as the single source of truth for "where is everything?"

### It is NOT: An Upload Automation Tool
The original vision was to automate uploading to platforms (filling forms, clicking buttons). After building Playwright browser automation for SoundCloud, we learned this approach is fragile, limited by platform restrictions, and solves the wrong pain point.

**The real pain points (ranked by the actual user — me):**
1. **Keeping track of what's been sent where** — losing track of which platforms have which tracks, what status things are in
2. **The label submission process** — tracking who I submitted to, when, whether they responded, when to follow up
3. Filling in the same metadata on every platform (lower priority — only takes a few minutes per platform)
4. Generating social media content for releases (lowest priority)

The system solves #1 and #2 first, then builds toward #3 and #4.

---

## Current Tech Stack

- **Backend:** Node.js v24.13.0 + Express + Multer (file-handler API on port 3001)
- **Workflow Engine:** n8n (Docker container on localhost:5678) — used for release intake form (will be replaced by Next.js UI)
- **Storage:** Local folders: ~/Documents/Music Agent/Releases/
- **Development:** macOS, Cursor IDE, GitHub Desktop for version control
- **Frontend:** Next.js (the main focus going forward)

**Retired from active development:**
- Playwright MCP — browser automation proved fragile; shelved but code preserved
- SoundCloud ZIP package generator — built and working, kept as utility but not the product focus

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

**Step 3: Start Next.js Frontend** (once created in Mini-MVP 1)
```bash
cd ~/Documents/music-agent-mvp/frontend
npm run dev
```
Opens at: http://localhost:3000

**Step 4: Verify Health Check**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","message":"File handler is running"}`

---

## Project Structure

```
~/Documents/music-agent-mvp/
├── file-handler/                    ← Express API backend (EXISTING)
│   ├── server.js                    (main backend - 8 sections)
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/
├── frontend/                        ← Next.js app (TO BE CREATED in Mini-MVP 1)
│   ├── src/
│   │   ├── app/                     (Next.js App Router pages)
│   │   ├── components/              (reusable UI components)
│   │   └── lib/                     (API helper functions)
│   ├── package.json
│   └── next.config.js
├── workflows/
│   └── Release_Form_Workflow.json   (exported n8n workflow)
├── docs/
│   ├── MASTER_PROMPT.md             (previous version — archived)
│   ├── RELEASE_MANAGEMENT_MASTER_PROMPT.md  (THIS FILE — current)
│   └── archive/                     (previous master prompt versions)
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── MILESTONE_4_COMPLETE.md
├── README.md
└── .gitignore
```

---

## Architecture Overview

### Core Concept: 3-Path Tracking

Every action on a release falls into one of three paths. The system TRACKS all three — it doesn't automate them.

**Path 1: Release (Self-Release to Fans + Streaming)**
- "I'm putting this out myself" — SoundCloud, Bandcamp, DistroKid → Spotify/Apple Music/Beatport
- **What the system does:** Tracks which platforms you've uploaded to, what status each is in (draft, uploaded, live), stores metadata so you can copy-paste it efficiently
- **What the user does:** Actually uploads to each platform manually (or via API integration later)

**Path 2: Submit (Label Pitching)**
- "I want a label to release this" — LabelRadar submissions, private SoundCloud links, A&R emails
- **What the system does:** Tracks every submission (which label, when, what platform, response status), shows follow-up reminders, prevents duplicate submissions, shows the full history
- **What the user does:** Actually submits on each platform manually

**Path 3: Promote (Marketing Content)**
- "I need to promote this release" — captions, clips, social posts for Instagram/TikTok/Facebook/X
- **What the system does:** Generates platform-specific captions, tracks what promo has been created
- **What the user does:** Posts content to social platforms

### Design Philosophy

**Management over automation.** The system's value is in organizing, tracking, and preventing things from falling through the cracks. It's a release management system, not a release automation system.

**You are user #1.** Every feature is built because you (the developer/artist) need it for your next release. No speculative features for imaginary users.

**Local-first, zero cost.** MVP runs entirely on your Mac. No cloud services, no subscriptions, no API keys required for core functionality.

**API integrations are optional upgrades.** SoundCloud API and YouTube API can be added later to enable direct uploads — but the core product works perfectly without them.

---

## MVP Roadmap: Mini-MVP Sequence

The MVP is built as a sequence of mini-MVPs, each delivering a complete usable feature. Ordered by pain point priority.

### Foundation (COMPLETE — Milestones 1-4)

Everything below is already built and working:

- ✅ **Release Intake:** n8n form → webhook → metadata generation
- ✅ **File Upload:** Express/Multer API with classify(), version management, validation
- ✅ **Metadata:** releaseId generation, metadata.json, genre dropdown, validation
- ✅ **Storage:** Release listing, disk monitoring, duplicate detection, audio validation
- ✅ **Distribution Tracking:** PATCH endpoint, 3-path structure in metadata.json
- ✅ **Version Management:** generateVersionId(), getVersionInfo(), multi-version audio support
- ✅ **SoundCloud Package:** ZIP generator with audio + artwork + metadata.txt (utility, kept but not focus)

---

### Mini-MVP 1: Release Dashboard ⏳ NEXT

**Goal:** See all your releases in one place with their current status across every platform and label submission. This is your "command center."

**Pain point solved:** #1 — "I never know where everything stands"

**What it delivers:**
- Next.js frontend that replaces the n8n form for creating releases
- Release list page showing all releases with artwork thumbnails, status indicators
- Release detail page showing the full picture: metadata, files, distribution status across all platforms, all label submissions
- Forms to manually log platform uploads ("I uploaded this to SoundCloud — mark it as uploaded")
- Forms to manually log label submissions ("I submitted this to Anjunadeep on LabelRadar")

**Backend work needed:**
- New endpoints or modifications to support the dashboard's data needs
- Possibly a new POST endpoint for creating releases directly (bypassing n8n)

**Definition of Done:**
- Open localhost:3000 → see all releases sorted by date
- Click a release → see every platform status and every label submission
- Can create a new release through the Next.js UI (not n8n)
- Can log "I uploaded to [platform]" in 10 seconds
- Can log "I submitted to [label]" in 10 seconds

**What you learn:** Next.js App Router, React components, fetching data from your own API, forms, state management, CSS/styling basics.

---

### Mini-MVP 2: Label Submission Tracker (CRM)

**Goal:** Track every label submission with follow-up reminders and response tracking. A mini-CRM for your demo submissions.

**Pain point solved:** #2 — "The label submission process is chaotic"

**What it delivers:**
- "Submit to Label" flow: pick release → pick label (from saved list) → record submission details
- Submission dashboard: all pending submissions, sorted by "days waiting"
- Follow-up reminders: flag submissions waiting 2+ weeks with no response
- Response tracking: Signed / Rejected / No Response / Feedback Received
- History view: "Have I already sent Track X to Label Y?" — prevents duplicate submissions
- Label directory: save labels you submit to regularly (name, genre focus, submission platform, response time)

**Backend work needed:**
- New endpoint: POST /submissions — create a new label submission record
- New endpoint: GET /submissions — list all submissions with filters (by release, by label, by status)
- New endpoint: PATCH /submissions/:id — update submission status/response
- New endpoint: GET /labels — list saved labels
- New endpoint: POST /labels — save a new label to your directory
- Submissions stored within each release's metadata.json (or new submissions.json per release)

**Definition of Done:**
- Can record a label submission in under 15 seconds
- Dashboard shows all pending submissions sorted by wait time
- Clear visual indicator for "needs follow-up" (waiting 14+ days)
- Can see full submission history for any release
- Can see full submission history for any label
- No more accidentally submitting the same track to the same label twice

**What you learn:** More complex CRUD operations, date/time handling, filtering and sorting in the UI, building relational-style data with JSON files.

---

### Mini-MVP 3: SoundCloud API Integration

**Goal:** Upload tracks directly to SoundCloud via their API instead of manually.

**Pain point solved:** #3 — "Filling in the same metadata on every platform" (for SoundCloud specifically)

**What it delivers:**
- Apply for SoundCloud API access (via their chatbot Otto)
- OAuth 2.1 authentication flow built into the app
- "Upload to SoundCloud" button on the release detail page
- Automatic status update in dashboard after successful upload

**Why this is the right approach:**
- SoundCloud has a real upload API (confirmed via research Feb 9, 2026)
- API uploads are reliable — no broken Playwright selectors
- OAuth is a transferable skill used by almost every API
- Replaces the fragile Playwright approach we shelved

**Backend work needed:**
- SoundCloud API credentials (apply via Otto chatbot at help.soundcloud.com)
- OAuth 2.1 flow with PKCE (Authorization Code flow for user actions)
- New endpoint: POST /distribute/soundcloud/upload — API-based upload
- Token storage and refresh logic

**Definition of Done:**
- Click "Upload to SoundCloud" → track uploads with title, artist, genre, tags, description, artwork
- Dashboard automatically updates status to "uploaded" / "live"
- No manual SoundCloud form filling required

**What you learn:** OAuth 2.1, API integration, token management, async API calls with error handling.

---

### Mini-MVP 4: YouTube API Integration

**Goal:** Upload tracks/videos to YouTube via their Data API v3.

**What it delivers:**
- Google Cloud project + YouTube Data API v3 credentials
- OAuth 2.0 authentication flow
- "Upload to YouTube" button — fully automated upload
- Auto-generate static video from artwork + audio if no video file exists

**Definition of Done:**
- Click "Upload to YouTube" → video uploaded with title, description, tags, thumbnail
- Dashboard updates automatically
- No manual YouTube upload required

**What you learn:** Google Cloud Platform, YouTube API, video generation (ffmpeg), building on OAuth knowledge from Mini-MVP 3.

---

### Mini-MVP 5: Marketing Captions

**Goal:** Generate platform-specific social media captions for any release.

**What it delivers:**
- Caption generation page: select release → get formatted captions for Instagram, TikTok, Facebook, X
- Platform-specific formatting (Instagram hashtag limits, X character limits)
- Copy to clipboard, edit before posting
- Track what promo content has been generated in the Promote path

**Definition of Done:**
- Select any release → click "Generate Captions" → get 4 platform-specific captions
- Copy to clipboard in one click
- Tracked in metadata.json promote path

---

### Future: Platform Upload Helpers (No Playwright)

For platforms WITHOUT APIs (DistroKid, LabelRadar, Bandcamp), the system provides:
- Pre-formatted metadata ready to copy-paste into platform forms
- Checklists: "Here's everything you need to fill in on DistroKid"
- Platform-specific field mapping (our genre → their genre dropdown value)
- One-click copy for each field

This is the "organized workflow" approach — the system prepares everything, you do the 3-minute manual upload with zero guesswork.

---

## Completed Work (Milestones 1-4)

### ✅ Milestone 1: Release Intake
- n8n "Release Intake" workflow receives JSON metadata via webhook
- Transforms metadata (generates releaseId: YYYY-MM-DD_Artist_Title format)
- Responds with confirmation

### ✅ Milestone 2: File Upload Handler
- File-handler API fully functional (server.js)
- Successfully tested: curl + n8n Form uploads work perfectly
- Server uses .any() to accept any field name, classify() function sorts by mimetype + file extension fallback
- n8n Form Trigger with 7 fields: artist, title, genre (dropdown), releaseType, audioFile, artworkFile, videoFile (optional)
- Docker networking working: using host.docker.internal:3001
- IF node conditional routing: handles video vs no-video uploads correctly
- Tested with real files: audio (56MB WAV), artwork (3MB PNG), video (6MB MP4)

### ✅ Milestone 3: Metadata Transformer
- Input validation: artist (1-100 chars), title (1-200 chars), genre (dropdown), releaseType (Singles only in MVP)
- Genre dropdown: 10 options (Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other)
- metadata.json generation: releaseId, artist, title, genre, releaseType, releaseDate, createdAt, files array
- Files array catalogs: filename, size, mimetype for each uploaded file
- Metadata saved to each release folder alongside audio/artwork/video files
- Works with and without video uploads
- Validation errors provide helpful feedback to user

### ✅ Milestone 4: Storage Manager
- Release listing: GET /releases endpoint returns all releases sorted by date (newest first)
- Disk space monitoring: GET /storage/status endpoint tracks available storage (warns if < 10GB free)
- Duplicate detection: Blocks re-uploads of existing releaseIds with 409 Conflict status
- Audio validation: music-metadata package validates WAV/MP3 files, checks duration (1s-1hr) and format integrity

### Shelved (Built but Not Active Focus)
- **SoundCloud ZIP Package Generator:** POST /distribute/soundcloud/package — works, generates ZIP with audio + artwork + metadata.txt. Kept as utility.
- **Playwright SoundCloud Automation:** Semi-automated form filling. Title, artist, description auto-fill. Tags/genre/privacy partially working. File upload blocked by platform. Shelved — API approach is better.
- **SoundCloud Form Field Audit:** 5 screenshots documenting every field. Reference material for API integration later.

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

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | /health | Server status check | ✅ |
| POST | /upload?releaseId=...&artist=...&title=...&genre=...&versionName=... | File upload with duplicate detection + audio validation | ✅ |
| POST | /metadata | Save metadata.json for a release | ✅ |
| GET | /releases | List all releases (sorted newest first) | ✅ |
| GET | /storage/status | Disk space information | ✅ |
| GET | /releases/:releaseId | Get single release details | ✅ |
| PATCH | /releases/:releaseId/distribution | Update distribution tracking | ✅ |
| POST | /releases/:releaseId/versions | Add audio version to existing release | ✅ |
| POST | /distribute/soundcloud/package | Generate SoundCloud upload package (ZIP) | ✅ (utility) |

**Endpoints to Build (by Mini-MVP):**

| Mini-MVP | Method | Path | Purpose |
|----------|--------|------|---------|
| 1 | POST | /releases | Create a new release directly (replaces n8n form) |
| 2 | POST | /submissions | Create a label submission record |
| 2 | GET | /submissions | List submissions (filterable by release, label, status) |
| 2 | PATCH | /submissions/:id | Update submission status |
| 2 | GET | /labels | List saved labels |
| 2 | POST | /labels | Save a new label |
| 3 | POST | /distribute/soundcloud/upload | Upload to SoundCloud via API |
| 4 | POST | /distribute/youtube/upload | Upload to YouTube via API |
| 5 | POST | /marketing/captions | Generate social media captions |

**Helper Functions:**

| Function | Purpose |
|----------|---------|
| `requireReleaseId(req)` | Extracts releaseId from URL params or query string, throws 400 if missing |
| `classify(file)` | Determines file type (audio/artwork/video) by mimetype then extension fallback |
| `validateAudioFile(filePath)` | Validates audio with music-metadata: checks duration (1s-1hr), format, codec |
| `generateVersionId(versionName)` | Converts version name to URL-safe folder name ("Extended Mix" → "extended-mix") |
| `getVersionInfo(req)` | Extracts version data from request, defaults to "Primary Version" |

**Multer Configuration:**
- Uses .any() to accept any field name
- classify(): mimetype first, file extension fallback
  - Audio: .wav, .mp3, .flac, .aiff, .m4a, .ogg → `versions/<versionId>/audio/`
  - Image: .jpg, .jpeg, .png, .gif, .webp, .bmp → `artwork/` (shared)
  - Video: .mp4, .mov, .avi, .mkv, .webm → `video/` (shared)

**Installed npm Packages:**
- express, multer, cors (core server)
- music-metadata (audio validation)
- check-disk-space (disk monitoring)
- file-type-checker (reserved for V2)
- archiver (ZIP file creation)

---

## Data Structures

### metadata.json (per release)

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
        "status": "uploaded",
        "privacy": "public",
        "uploadedAt": "2026-02-07T04:00:00.000Z",
        "url": "https://soundcloud.com/artist/track"
      }
    ],
    "submit": [
      {
        "platform": "LabelRadar",
        "label": "Anjunadeep",
        "status": "submitted",
        "submittedAt": "2026-02-07T03:30:00.000Z",
        "responseStatus": "pending",
        "notes": "Sent Primary Version"
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
- `submit` path: Can have MULTIPLE entries for same platform but different labels. Tracked by platform+label combo.
- `promote` path: One entry per platform per content type.
- All entries get automatic `updatedAt` timestamps.

### Storage Structure

```
~/Documents/Music Agent/Releases/
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
        ├── packages/             (generated ZIP files — utility)
        │   └── soundcloud-primary.zip
        └── metadata.json
```

---

## n8n Workflow (Legacy — Being Replaced)

The n8n Form Trigger currently handles release intake. This will be replaced by the Next.js UI in Mini-MVP 1.

```
Form Trigger (7 fields: artist, title, genre, releaseType, audio, artwork, video)
  ↓
Validate Inputs → Set Node (generates releaseId) → IF Node (video?)
  ├─→ HTTP Request (with video) → Create/Save Metadata → Respond
  └─→ HTTP Request (no video) → Create/Save Metadata → Respond
```

After Mini-MVP 1, n8n remains available for backend orchestration if needed, but is no longer the primary user interface.

---

## Key Technical Decisions & Rationale

**Release Management over Upload Automation**
- The biggest pain is tracking/organization, not filling in forms
- Tracking requires no external APIs — works immediately
- Upload automation is fragile (Playwright) or requires API approval (SoundCloud)
- Management layer is the foundation everything else sits on

**Next.js Frontend as the Primary Interface**
- Replaces n8n form (which was always temporary)
- Next.js App Router for page-based routing
- Server-side rendering not needed for MVP — client-side fetching from Express API is fine
- Teaches transferable React/Next.js skills

**Keeping Express Backend Separate from Next.js**
- Express API on port 3001, Next.js on port 3000
- Clean separation: backend handles data + files, frontend handles UI
- Easier to understand as a beginner than mixing Next.js API routes with file handling
- Can be merged later if needed

**No Database in MVP**
- metadata.json files in release folders — inspect with any text editor
- Simpler for learning, fewer moving parts
- V2 adds PostgreSQL for multi-user queries

**releaseId Format: YYYY-MM-DD_ArtistName_TrackTitle**
- Sortable by date, human-readable, filesystem-safe, unique per release

**Genre Dropdown (Not Free Text)**
- 10 options: Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other

**API Integrations are Optional Upgrades**
- SoundCloud API: apply via Otto chatbot, OAuth 2.1 with PKCE — Mini-MVP 3
- YouTube API: Google Cloud project, OAuth 2.0 — Mini-MVP 4
- DistroKid: NO public API exists — manual upload with copy-paste helpers only
- LabelRadar: NO public API — manual submission with tracking only

---

## Common Issues & Solutions

| Issue | Solution | Why |
|-------|----------|-----|
| ECONNREFUSED when n8n calls file-handler | Use `http://host.docker.internal:3001` | Docker networking isolation |
| "Referenced node doesn't exist" in n8n | Don't use `$('Node Name')`; pass data through workflow | Node name references are fragile |
| req.body is undefined in Express | Add `app.use(express.json())` before routes | Express doesn't parse JSON by default |
| metadata.json shows "[object Object]" | Use "Using Fields Below" mode in n8n HTTP Request | Quoted expressions serialize objects to strings |
| Git tracking node_modules/ | Add to .gitignore + `git rm -r --cached file-handler/node_modules` | node_modules regenerates with npm install |
| Route 6g (add version) broken | Missing upload.any() middleware + code was in wrong function scope | 3 middleware functions must be chained |
| Next.js can't reach Express API | Ensure CORS is enabled on Express and use http://localhost:3001 from frontend | Cross-origin requests need CORS headers |

---

## Product Roadmap (Beyond MVP)

### V2 (Multi-User SaaS — Future)
- PostgreSQL database (replacing JSON files)
- User accounts with authentication
- Cloud deployment (Vercel frontend, Railway backend, S3 storage)
- Stripe payments (free tier + Pro at $10/month)
- SoundCloud API integration (if approved)
- Email notifications for follow-up reminders

### V3 (Label Support — Distant Future)
- Multi-artist catalog management
- A&R demo review pipeline
- Royalty tracking and payment splits
- DDEX standard support
- Beatport-exclusive scheduling windows

---

## Strategic Context (Why This Direction)

### Research Findings (February 9, 2026)
- **SoundCloud** has a public upload API via OAuth 2.1 — but access requires application approval
- **DistroKid** has NO public API — only unofficial reverse-engineered wrappers exist
- **LabelRadar** has NO public API — closed platform (owned by Beatport Group)
- **Spotify/Apple Music** do NOT accept direct uploads — must go through aggregators (DistroKid, TuneCore, etc.) who have enterprise DDEX integrations
- **YouTube** has a full public upload API — the most automatable platform

### Competitive Landscape
- **LabelGrid, Label Engine, Reprtoir** — label management tools for managing multiple artists, royalties, DDEX. Built for labels, not individual artists.
- **Gap identified:** No tool exists specifically for an individual electronic music artist to manage their own release pipeline across platforms and label submissions. That's what this project fills.

### The "Aggregator" Question — Resolved
Building a music distribution aggregator (like DistroKid) requires enterprise DDEX contracts with every DSP. This is not feasible for a solo developer. Instead, this system sits ABOVE aggregators — you still use DistroKid to distribute, but this system tracks everything.

---

## Master Prompt Management

**This document lives in two places:**
1. `docs/RELEASE_MANAGEMENT_MASTER_PROMPT.md` in the GitHub repo (source of truth)
2. Claude Project Knowledge (copy for AI context)

**When to Update:**
- ✅ After completing each mini-MVP
- ✅ When making significant architectural decisions
- ✅ After solving tricky bugs
- ✅ When changing tech stack or dependencies
- ❌ Not for minor code tweaks

**Version History:**
- v2.0–v2.7: Original "Music Agent" versions (see docs/archive/)
- **v3.0: Major pivot from "Music Agent" workflow automation to "Release Management System." Reframed product around tracking/management instead of upload automation. New mini-MVP sequence prioritized by actual user pain points. Shelved Playwright automation. Added API research findings. Restructured entire roadmap.**

**Archive Process:**
1. Copy current master prompt to docs/archive/ before major changes
2. Name: MASTER_PROMPT_YYYY-MM-DD_HH-MM.md
3. Update version number and "Last Updated" in new version
4. Update the copy in Claude Project Knowledge
