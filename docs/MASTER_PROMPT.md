# Music Agent - Master Project Context v2.5

**Document Info**  
Last Updated: February 6, 2026, 12:00 PM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) IN PROGRESS  
Version: 2.5 (3-path distribution architecture: Release, Submit, Promote)

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

**Step 3: Verify Health Check (new terminal tab)**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","message":"File handler is running"}`

---

## Project Structure

```
~/Documents/music-agent-mvp/
├── file-handler/
│   ├── server.js              ← Main API server (8 sections, fully commented)
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/
├── workflows/
│   └── Release_Form_Workflow.json (exported n8n workflow)
├── docs/
│   ├── MASTER_PROMPT.md       ← This file (current version, also in Claude Project Knowledge)
│   └── archive/               ← Previous versions of this document
│       ├── MASTER_PROMPT_2026-02-05_22-03.md
│       ├── MASTER_PROMPT_2026-02-05_23-33.md
│       ├── MASTER_PROMPT_2026-02-06_01-09.md
│       └── MASTER_PROMPT_2026-02-06_02-36.md
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── MILESTONE_4_COMPLETE.md
├── README.md
└── .gitignore
```

---

## App Design Philosophy

### Core Concept: 3 Distribution Paths

When an electronic music producer finishes a track, they have **3 intentions** — not based on platforms, but on what they want to accomplish:

```
Track is ready
    │
    ├── RELEASE  → "I want to put this out myself"
    │     ├── Direct uploads: SoundCloud, Bandcamp, YouTube
    │     ├── Aggregator: DistroKid → Spotify, Apple Music, Beatport, Deezer, Tidal
    │     └── Options: release date scheduling, privacy, pre-save campaigns
    │
    ├── SUBMIT   → "I want a label to release this"
    │     ├── Platforms: LabelRadar, direct email, private SoundCloud links
    │     ├── Tracking: which labels, when submitted, response status
    │     └── If rejected → option to self-release (go to RELEASE)
    │
    └── PROMOTE  → "I want to create marketing content"
          ├── Captions: Instagram, TikTok, Facebook, X
          ├── Future: 30-sec audio clips, social graphics, video teasers
          └── Runs alongside RELEASE or SUBMIT
```

### Why 3 Paths (Not 4)

Previous versions separated "Publish" (SoundCloud, YouTube) from "Distribute" (Spotify via DistroKid). This was merged into a single **RELEASE** path because:

- Artists think "I want to release this track" — they don't separate platforms by mechanism
- A self-releasing artist almost always wants SoundCloud AND Spotify AND Beatport together
- The difference between platforms is just the upload method, not the artist's intention
- One coordinated release with multiple destinations is cleaner than two separate workflows

### Beatport: First-Class Citizen

Beatport is the most important platform in electronic music for DJ-oriented genres. DistroKid distributes to Beatport, but our system treats Beatport with extra attention:

- Proper genre/subgenre tagging (Beatport has specific categories)
- Artwork spec validation (1400x1400 minimum for Beatport)
- Beatport-exclusive release windows (common practice: 2 weeks on Beatport before Spotify)
- Future: Beatport chart tracking, Hype chart eligibility

### Two User Types (MVP = Artist Only)

**Artist Workflow (MVP):**
Finish track → Decide: submit to labels OR self-release → Upload assets → Choose platforms → Promote → Track results

**Label Workflow (V2/V3):**
Receive demos → A&R review → Sign track → Manage release (scheduling, ISRC/UPC, metadata) → Coordinate artist promo → Distribute to all platforms → Track royalties → Manage catalog

**What labels need that artists don't:**
- Catalog management across many artists
- Royalty tracking and payment splits
- ISRC/UPC generation and management
- Beatport-exclusive scheduling windows
- Contract and rights management
- Bulk operations (2-4 releases per month across artists)
- DDEX standard support for label-level distribution

**Architecture decision:** Build the artist workflow first. The label layer wraps around it later — labels do the same RELEASE/SUBMIT/PROMOTE actions, just on behalf of their artists with additional management features.

---

## Current State (MVP Progress)

### ✅ Milestone 1 Complete: Release Intake
- n8n "Release Intake" workflow receives JSON metadata via webhook
- Transforms metadata (generates releaseId: YYYY-MM-DD_Artist_Title format)
- Responds with confirmation

### ✅ Milestone 2 Complete: File Upload Handler
- File-handler API fully functional (server.js in ~/Documents/music-agent-mvp/file-handler/)
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

**Build Order:**

| Step | Feature | Status |
|------|---------|--------|
| 1 | GET /releases/:releaseId — fetch single release | ✅ Complete |
| 2 | PATCH /releases/:releaseId/distribution — update tracking | ⏳ Next |
| 3 | POST /marketing/captions — social media caption generator | ⏳ Pending |
| 4a | POST /distribute/soundcloud/package — SoundCloud package + guide | ⏳ Pending |
| 4b | POST /distribute/distrokid/package — DistroKid package + checklist | ⏳ Pending |
| 4c | POST /distribute/labelradar — LabelRadar submission | ⏳ Pending |
| 5 | POST /distribute/youtube — YouTube API automated upload | ⏳ Pending |

**Distribution Tracking Structure (metadata.json):**

```json
{
  "releaseId": "2026-02-06_Artist_Track",
  "artist": "Artist Name",
  "title": "Track Title",
  "genre": "Melodic House and Techno",
  "releaseType": "Single",
  "releaseDate": "2026-02-06",
  "createdAt": "2026-02-06T04:00:00.000Z",
  "files": {
    "audio": [{ "filename": "track.wav", "size": 56379422, "mimetype": "audio/wav" }],
    "artwork": [{ "filename": "cover.png", "size": 3437306, "mimetype": "image/png" }],
    "video": [{ "filename": "promo.mp4", "size": 6024736, "mimetype": "video/mp4" }]
  },
  "distribution": {
    "release": [
      {
        "platform": "SoundCloud",
        "status": "published",
        "privacy": "public",
        "url": "https://soundcloud.com/...",
        "updatedAt": "2026-02-06T04:00:00.000Z"
      },
      {
        "platform": "YouTube",
        "status": "published",
        "privacy": "unlisted",
        "videoId": "abc123",
        "url": "https://youtube.com/watch?v=abc123",
        "updatedAt": "2026-02-06T04:05:00.000Z"
      },
      {
        "platform": "DistroKid",
        "status": "pending",
        "stores": ["Spotify", "Apple Music", "Beatport", "Deezer", "Tidal"],
        "releaseDate": "2026-03-01",
        "beatportExclusive": true,
        "beatportExclusiveUntil": "2026-03-15",
        "upc": "123456789012",
        "isrc": "USXXX2600001",
        "updatedAt": "2026-02-06T05:00:00.000Z"
      },
      {
        "platform": "Bandcamp",
        "status": "published",
        "url": "https://artist.bandcamp.com/track/...",
        "updatedAt": "2026-02-06T04:10:00.000Z"
      }
    ],
    "submit": [
      {
        "platform": "LabelRadar",
        "label": "Afterlife",
        "status": "submitted",
        "submittedAt": "2026-02-06T03:30:00.000Z",
        "submissionId": "lr_abc123",
        "updatedAt": "2026-02-06T03:30:00.000Z"
      },
      {
        "platform": "LabelRadar",
        "label": "Anjunadeep",
        "status": "rejected",
        "submittedAt": "2026-02-01T10:00:00.000Z",
        "respondedAt": "2026-02-05T14:00:00.000Z",
        "updatedAt": "2026-02-05T14:00:00.000Z"
      }
    ],
    "promote": [
      {
        "platform": "Instagram",
        "contentType": "caption",
        "status": "generated",
        "updatedAt": "2026-02-06T06:00:00.000Z"
      },
      {
        "platform": "TikTok",
        "contentType": "caption",
        "status": "generated",
        "updatedAt": "2026-02-06T06:00:00.000Z"
      }
    ]
  }
}
```

**Key Design Decisions for Distribution Tracking:**
- `release` path: One entry per platform. DistroKid entry lists all stores it distributes to.
- `submit` path: Can have MULTIPLE entries for the same platform (LabelRadar) but different labels. This is tracked by both `platform` AND `label` fields.
- `promote` path: One entry per platform per content type.
- All entries get automatic `updatedAt` timestamps.
- Duplicate detection: prevents same platform being added twice in `release` and `promote`. For `submit`, duplicates are checked by platform + label combination.

**Milestone 5 MVP Deliverables:**
- ✅ User uploads track and chooses distribution path(s) immediately OR later
- ✅ Can select multiple paths simultaneously (Release + Promote)
- ✅ Can add paths sequentially over time (Submit to labels first, then Release if rejected)
- ✅ System tracks distribution history in metadata.json
- ✅ YouTube upload fully automated via API
- ✅ SoundCloud/DistroKid/Bandcamp have manual guides + package generators
- ✅ LabelRadar submission package + tracking
- ✅ Marketing captions auto-generated for Instagram/TikTok/Facebook/X

**Milestone 5 New Dependencies:**
```bash
npm install googleapis google-auth-library archiver
```
- googleapis: Google's Node.js client for YouTube Data API v3
- google-auth-library: OAuth2 authentication for YouTube uploads
- archiver: Creates ZIP files for distribution packages

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
| 1. Imports | Loading packages (express, multer, cors, etc.) |
| 2. Server Configuration | Express app, port, middleware (CORS, JSON parser) |
| 3. Constants | RELEASES_BASE path |
| 4. Helper Functions | requireReleaseId(), classify(), validateAudioFile() |
| 5. Multer Configuration | File upload storage settings |
| 6. API Routes | All endpoint handlers (6a through 6g+) |
| 7. Error Handler | Catch-all for unhandled errors |
| 8. Start Server | app.listen() |

**Current Endpoints:**

| Method | Path | Purpose | Section |
|--------|------|---------|---------|
| GET | /health | Server status check | 6a |
| POST | /upload?releaseId=...&artist=...&title=...&genre=... | File upload with duplicate detection + audio validation | 6b |
| POST | /metadata | Save metadata.json for a release | 6c |
| GET | /releases | List all releases (sorted newest first) | 6d |
| GET | /releases/:releaseId | Get single release details | 6f (Milestone 5) |
| GET | /storage/status | Disk space information | 6e |

**Milestone 5 Endpoints (to be added):**

| Method | Path | Purpose | Section |
|--------|------|---------|---------|
| PATCH | /releases/:releaseId/distribution | Update distribution tracking | 6g |
| POST | /marketing/captions | Generate social media captions | 6h |
| POST | /distribute/soundcloud/package | Generate SoundCloud upload package (ZIP) | 6i |
| POST | /distribute/distrokid/package | Generate DistroKid submission package (ZIP) | 6j |
| POST | /distribute/labelradar | Submit to LabelRadar / generate package | 6k |
| POST | /distribute/youtube | Upload video to YouTube via API | 6l |

**V2 Endpoints (deferred):**

| Method | Path | Purpose |
|--------|------|---------|
| POST | /releases/:releaseId/archive | Archive a release |
| DELETE | /releases/:releaseId | Delete a release (with confirmation) |

**Multer Configuration:**
- Uses .any() to accept any field name
- classify() function: mimetype first, file extension fallback
  - Audio: .wav, .mp3, .flac, .aiff, .m4a, .ogg → audio/ folder
  - Image: .jpg, .jpeg, .png, .gif, .webp, .bmp → artwork/ folder
  - Video: .mp4, .mov, .avi, .mkv, .webm → video/ folder

**Storage Structure:**
```
Releases/
  └── 2026-02-06_mrelby_elbyboy/
        ├── audio/
        │   └── track.wav
        ├── artwork/
        │   └── cover.png
        ├── video/
        │   └── promo.mp4
        └── metadata.json
```

**Installed npm Packages:**
- express, multer, cors (core server)
- music-metadata (audio validation)
- check-disk-space (disk monitoring)
- file-type-checker (reserved for V2 enhanced validation)
- googleapis, google-auth-library, archiver (Milestone 5 — to be installed)

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
- A&R demo review pipeline (receive, review, accept/reject demos)
- Royalty tracking and payment splits
- ISRC/UPC generation and management
- Beatport-exclusive scheduling windows (2-week exclusives before wide release)
- DDEX standard support for label-level distribution
- Contract and rights management
- Bulk release operations (2-4 releases per month across artists)
- White-label option for label branding

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

**Metadata in Upload Response**
- File-handler returns artist/title/genre in POST /upload response
- Allows metadata generation without referencing n8n nodes by name

**No Database in MVP**
- metadata.json files in release folders
- Simpler for learning, fewer moving parts, easy to inspect
- V2 adds PostgreSQL for multi-user queries

**Async/Await for File Operations**
- fs.promises for route handlers (non-blocking)
- fsSync for Multer callbacks (needs synchronous)

**Audio Validation After Upload**
- Multer uploads first, then music-metadata validates
- Invalid files deleted with fsSync.unlinkSync(), returns 422

**Distribution Tracking in metadata.json**
- 3 paths: release, submit, promote
- Each entry tracks: platform, status, timestamps, URLs, platform-specific data
- Automatic updatedAt timestamps on every change
- Duplicate prevention per platform (except submit, which allows multiple labels)

**Label Submissions: Multiple Entries Per Platform**
- Unlike release/promote (one entry per platform), the submit path allows multiple entries for the same platform (e.g., LabelRadar) but different labels
- Tracked by platform + label combination

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
- v2.6: (future) Milestone 5 complete
- v3.0: (future) V2 phase begins

**Archive Process:**
1. Copy current MASTER_PROMPT.md to docs/archive/ before major changes
2. Name: MASTER_PROMPT_YYYY-MM-DD_HH-MM.md
3. Update version number and "Last Updated" in new version
4. Update the copy in Claude Project Knowledge

---

**Changes in v2.5:**
- Merged "Publish" and "Distribute" into single "Release" path (3 paths instead of 4)
- Renamed paths: Release, Submit, Promote (was: Publish, Distribute, Submit to Labels, Market)
- Added Beatport as first-class citizen with electronic-music-specific features
- Defined Artist vs Label user types and their different workflows
- Label features scoped for V3 (not MVP)
- Updated metadata.json distribution structure (release/submit/promote)
- Updated all API endpoints to reflect 3-path architecture
- Added submit path duplicate logic (platform + label, not just platform)
- Added Beatport-exclusive scheduling to distribution tracking
- Updated business model with Label tier
- Reorganized server.js section reference table
- Added Milestone 5 build order with completion status
