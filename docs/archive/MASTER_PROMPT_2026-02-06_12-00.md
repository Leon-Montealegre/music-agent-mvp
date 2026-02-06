# Music Agent - Master Project Context v2.4

**Document Info**  
Last Updated: February 6, 2026, 3:27 AM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) IN PROGRESS  
Version: 2.4 (Milestone 5 scope defined - Distribution routing system with 4 paths)

**About Me**  
I'm learning to code through hands-on building ("vibe coding"). I'm a beginner building a workflow automation system for electronic music releases. I use Cursor IDE with Claude Code, and I'm comfortable with terminal commands but need explanations for technical concepts.

**Current Skill Level:**
- Comfortable with: Terminal basics, file system navigation, Git via GitHub Desktop, copying/pasting code
- Learning: Node.js/Express, n8n workflows, API design, async/await, error handling, file I/O
- Goal: Understand how systems work together (not just copy-paste, but comprehend WHY)

**Current Tech Stack**
- Backend: Node.js v24.13.0 + Express + Multer (file-handler API on port 3001)
- Workflow Engine: n8n (Docker container on localhost:5678)
- Storage: Local folders: ~/Documents/Music Agent/Releases/
- Development: macOS, Cursor IDE, GitHub Desktop for version control
- Future Frontend: Next.js (Milestone 7)

**Development Environment Startup**  
Run these commands at the start of each development session:

**Step 1: Start n8n Docker Container**

```bash
docker start n8n
```

What this does: Starts the n8n workflow engine (runs in background on port 5678)  
Verify it's running: Open browser to http://localhost:5678

**Step 2: Start File-Handler API**

```bash
cd ~/Documents/music-agent-mvp/file-handler
node server.js
```

What this does: Starts the Express server (listens on port 3001)  
Success message: `File-handler API listening on port 3001`  
Keep this terminal window open (server runs in foreground)

**Step 3: Verify Health Check**

```bash
curl http://localhost:3001/health
```

Expected response: `{"status":"ok","timestamp":"..."}`  
If fails: Check that Step 2 is running without errors

**Quick Startup Verification Checklist**
- n8n accessible at http://localhost:5678
- File-handler API responds to /health endpoint
- ~/Documents/Music Agent/Releases/ folder exists
- Terminal window with `node server.js` is running (don't close it)

**Project Structure**

```
~/Documents/music-agent-mvp/
├── file-handler/
│   ├── server.js (Express API with Multer + storage manager)
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
│       └── MASTER_PROMPT_2026-02-06_02-36.md
├── MILESTONE_1_COMPLETE.md
├── MILESTONE_2_COMPLETE.md
├── MILESTONE_3_COMPLETE.md
├── MILESTONE_4_COMPLETE.md
├── README.md
└── .gitignore
```

**Current State (MVP Progress)**

✅ **Milestone 1 Complete: Release Intake**
- n8n "Release Intake" workflow receives JSON metadata via webhook
- Transforms metadata (generates releaseId: YYYY-MM-DD_Artist_Title format)
- Responds with confirmation

✅ **Milestone 2 Complete: File Upload Handler**
- File-handler API fully functional (server.js in ~/Documents/music-agent-mvp/file-handler/)
- Successfully tested: curl + n8n Form uploads work perfectly
- Server uses .any() to accept any field name, classify() function sorts by mimetype + file extension fallback
- n8n Form Trigger with 7 fields: artist, title, genre (dropdown), releaseType, audioFile, artworkFile, videoFile (optional)
- Docker networking working: using host.docker.internal:3001
- IF node conditional routing: handles video vs no-video uploads correctly
- Tested with real files: audio (56MB WAV), artwork (3MB PNG), video (6MB MP4)

✅ **Milestone 3 Complete: Metadata Transformer**
- Input validation: artist (1-100 chars), title (1-200 chars), genre (dropdown), releaseType (Singles only in MVP)
- Genre dropdown: 10 options (Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other)
- metadata.json generation: releaseId, artist, title, genre, releaseType, releaseDate, createdAt, files array
- Files array catalogs: filename, size, mimetype for each uploaded file
- Metadata saved to each release folder alongside audio/artwork/video files
- Works with and without video uploads
- Validation errors provide helpful feedback to user

✅ **Milestone 4 Complete: Storage Manager**
- Release listing: GET /releases endpoint returns all releases sorted by date (newest first)
- Disk space monitoring: GET /storage/status endpoint tracks available storage (warns if < 10GB free)
- Duplicate detection: Blocks re-uploads of existing releaseIds with 409 Conflict status
- Audio validation: music-metadata package validates WAV/MP3 files, checks duration (1s-1hr) and format integrity
- Successfully tested: All 4 features working, validated 213s WAV file, detected duplicates, disk space at 222GB free
- Console logging: Helpful emoji indicators (🚫 duplicate, 🎵 validating, ✅ valid, 💾 disk check, 📂 listing)
- Installed packages: music-metadata, check-disk-space, file-type-checker

**Deferred to V2:**
- Release archiving (move old releases to archive folder)
- Release deletion with confirmation
- GET /releases/:releaseId endpoint (individual release details)

⏳ **Milestone 5: Distribution Orchestrator (IN PROGRESS)**

**Core Concept:** Multi-path distribution system where producer chooses release strategy per track

**4 Distribution Paths:**

**Path 1: Publish (Direct-to-Fan Platforms)**
- Purpose: Make music publicly/privately available without approval processes
- Platforms: SoundCloud (manual guide + package), YouTube (full API automation)
- Privacy options: Public, Private, Unlisted (per platform)
- MVP Deliverables:
  - SoundCloud: Manual upload guide + package generator (with public/private toggle)
  - YouTube: Full automation via YouTube Data API v3 (OAuth2, public/unlisted/private options)

**Path 2: Distribute (Streaming Services via Aggregator)**
- Purpose: Get on Spotify, Apple Music, Deezer, etc.
- Platforms: DistroKid (package generator + checklist)
- MVP Deliverables:
  - DistroKid: Generate release package (WAV + artwork + formatted metadata)
  - Step-by-step upload checklist
  - ISRC/UPC tracking (if user provides)

**Path 3: Submit to Labels (A&R/Demo Submission)**
- Purpose: Pitch unreleased tracks to record labels
- Platforms: LabelRadar (research API for automation)
- MVP Deliverables:
  - LabelRadar: Automated submission if API available, otherwise package generator
  - Submission tracking: Which labels, when submitted, status

**Path 4: Market (Social Media Content)**
- Purpose: Create promotional content for social platforms
- Platforms: Instagram, TikTok, Facebook
- MVP Deliverables:
  - Caption generator: Platform-specific text with hashtags, emojis, release info
  - Future: 30-sec audio clips, social graphics (deferred to Milestone 6)

**Key Features:**
- **Multi-path selection:** User can choose multiple paths at once (e.g., Publish + Market simultaneously)
- **Sequential distribution:** User can come back days/weeks later to add more paths (e.g., Submit to labels first, then Publish if rejected)
- **Distribution tracking:** metadata.json tracks all distribution history with status, URLs, timestamps
- **Flexible timing:** Choose distribution path immediately after upload OR later from release list

**Distribution Tracking Structure (metadata.json):**

```json
{
  "releaseId": "2026-02-06_Artist_Track",
  "artist": "Artist Name",
  "title": "Track Title",
  "genre": "Melodic House and Techno",
  "files": { ... },
  "distribution": {
    "publish": [
      {
        "platform": "SoundCloud",
        "status": "published",
        "privacy": "public",
        "url": "https://soundcloud.com/...",
        "publishedAt": "2026-02-06T04:00:00.000Z"
      },
      {
        "platform": "YouTube",
        "status": "published",
        "privacy": "unlisted",
        "videoId": "abc123",
        "url": "https://youtube.com/watch?v=abc123",
        "publishedAt": "2026-02-06T04:05:00.000Z"
      }
    ],
    "labels": [
      {
        "platform": "LabelRadar",
        "status": "submitted",
        "submittedAt": "2026-02-06T03:30:00.000Z",
        "submissionId": "lr_abc123"
      }
    ],
    "streaming": [
      {
        "platform": "DistroKid",
        "status": "pending",
        "submittedAt": "2026-02-06T05:00:00.000Z",
        "releaseDate": "2026-03-01",
        "stores": ["Spotify", "Apple Music"],
        "upc": "123456789012",
        "isrc": "USXXX2600001"
      }
    ],
    "marketing": [
      {
        "platform": "Instagram",
        "contentType": "caption",
        "status": "generated",
        "generatedAt": "2026-02-06T06:00:00.000Z"
      }
    ]
  }
}
```

**Storage Strategy:**
- **MVP:** Local storage only (files on Mac, no cloud costs)
- **V2:** 30-day temporary cloud storage (files deleted after distribution)
- **V3:** Permanent storage tier for paid users

**Milestone 5 Success Criteria:**
- ✅ User uploads track and chooses distribution path(s) immediately OR later
- ✅ Can select multiple paths simultaneously (Publish + Market)
- ✅ Can add paths sequentially over time (Submit to labels, then Publish later)
- ✅ System tracks distribution history in metadata.json
- ✅ YouTube upload fully automated via API
- ✅ SoundCloud/DistroKid have manual guides + package generators
- ✅ Marketing captions auto-generated for Instagram/TikTok/Facebook

⏳ **Milestone 6: Promo Content Generator**
- Social media graphics (artwork with text overlays)
- Audio snippets (30-sec clips for Reels/TikTok)
- Advanced caption variations

⏳ **Milestone 7: Next.js UI**
- User-facing upload form
- Distribution path selection interface
- Release dashboard (view all releases + distribution status)
- Replace n8n Form Trigger with custom UI

**File-Handler API Details**

**server.js configuration:**
- Port: 3001
- **Current Endpoints:**
  - GET /health - Server status check
  - POST /upload?releaseId=...&artist=...&title=...&genre=... - File uploads (with duplicate detection + audio validation)
  - POST /metadata - Save metadata.json
  - GET /releases - List all releases (sorted newest first)
  - GET /storage/status - Disk space information (warns if < 10GB free)
  
- **Milestone 5 New Endpoints:**
  - GET /releases/:releaseId - Get specific release details
  - POST /distribute/youtube - Upload video to YouTube via API
  - POST /distribute/soundcloud/package - Generate SoundCloud upload package
  - POST /distribute/distrokid/package - Generate DistroKid submission package
  - POST /distribute/labelradar - Submit to LabelRadar (if API available)
  - POST /marketing/captions - Generate social media captions
  - PATCH /releases/:releaseId/distribution - Update distribution tracking in metadata.json

- **V2 additions (deferred):**
  - POST /releases/:releaseId/archive - Archive a release
  - DELETE /releases/:releaseId - Delete a release (with confirmation)

**Multer Configuration:**
- Uses .any() to accept any field name (flexible for different upload sources)
- File classification: classify() function checks mimetype first, falls back to file extension
  - Audio extensions: .wav, .mp3, .flac, .aiff, .m4a, .ogg → audio/ folder
  - Image extensions: .jpg, .jpeg, .png, .gif, .webp, .bmp → artwork/ folder
  - Video extensions: .mp4, .mov, .avi, .mkv, .webm → video/ folder

**Storage Structure:**
- Path: RELEASES_BASE/<releaseId>/<audio|artwork|video>/
- Example: 2026-02-05_SophieJoe_TellMe/audio/track.wav, /artwork/cover.jpg, /video/promo.mp4, /metadata.json
- Why: Keeps all release assets together, easy to zip for distribution, clear organization

**Query Parameters:**
- releaseId, artist, title, genre passed from n8n and returned in upload response
- Why: Allows metadata generation without referencing previous nodes by name

**Middleware:**
- CORS enabled for n8n/Next.js calls
- express.json() middleware for JSON body parsing (required for POST /metadata)

**Installed npm Packages (Milestone 4):**

```bash
npm install music-metadata check-disk-space file-type-checker
```

**What each does:**
- music-metadata: Validates audio files, extracts duration/bitrate/codec
- check-disk-space: Returns disk usage stats (total/free/used GB)
- file-type-checker: Installed but not actively used yet (reserved for V2 enhanced validation)

**Milestone 5 New Dependencies (to be installed):**

```bash
npm install googleapis google-auth-library archiver
```

**What each does:**
- googleapis: Google's official Node.js client for YouTube Data API v3
- google-auth-library: Handles OAuth2 authentication for YouTube uploads
- archiver: Creates ZIP files for distribution packages (SoundCloud, DistroKid)

**n8n Workflow Structure (Milestone 3)**

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

**Key Implementation Details:**
- Form Trigger outputs to Validate node
- Set node creates releaseId by removing spaces from artist/title: 2026-02-05_SophieJoe_TellMe
- IF node splits into parallel branches (only one executes per submission)
- HTTP Request nodes send form data via query parameters to file-handler
- Create Metadata nodes extract data from upload response (includes artist/title/genre)
- Save Metadata nodes use "Using Fields Below" mode (not raw JSON)
- Both branches end at same Respond node

**Milestone 5 New n8n Workflows (to be created):**
- Distribution Router Workflow: User selects path(s), triggers appropriate distribution workflows
- YouTube Distribution Workflow: Automated upload via API
- SoundCloud Package Workflow: Generates upload package + opens guide
- DistroKid Package Workflow: Generates submission package + checklist
- Marketing Caption Workflow: Generates captions for all social platforms

**OFFICIAL PRODUCT ROADMAP**

**MVP (Current - Target: 2-4 Weeks)**

**Scope:**
- Release Types: Singles only (NO EP functionality in MVP)
- User: Solo use (me only)
- Infrastructure: Local (n8n Docker, file-handler on Mac, Next.js UI local)
- Automation Level: Core uploads automated, distribution/promo mostly manual with guides

**7 Milestones:**
1. ✅ Release Intake (n8n webhook)
2. ✅ File Upload Handler (Express/Multer API)
3. ✅ Metadata Transformer (releaseId generation, validation, metadata.json)
4. ✅ Storage Manager (listing, disk monitoring, duplicate detection, file validation)
5. ⏳ Distribution Orchestrator (4-path routing system: Publish, Submit to Labels, Distribute, Market) - IN PROGRESS
6. ⏳ Promo Content Generator (social media graphics, audio snippets)
7. ⏳ Next.js UI (user-facing upload form, distribution dashboard)

**Success Criteria:**
- ✅ Can upload a single track → choose distribution path(s) → execute (automated or manual)
- ✅ Track distribution history across multiple platforms
- ✅ Come back later to add more distribution paths to same release
- ✅ Understand n8n, Express APIs, file handling, webhooks, OAuth2, distribution tracking
- ✅ Have working foundation for V2 enhancements

**V2 (Multi-User SaaS - Target: 2-3 Months After MVP)**

**Scope:**
- Users: 10-100 beta users (electronic music producers)
- Infrastructure: Cloud-hosted (Railway/Render for backend, Vercel for frontend, AWS S3 for storage)
- Authentication: Email/password + OAuth (Google, Spotify)
- Storage: 30-day temporary storage (files deleted after distribution)
- Payments: Stripe integration (free tier + paid tiers)

**V2 Additions:**
- PostgreSQL database (user accounts, release metadata, distribution tracking)
- User dashboard (all releases, distribution status, analytics)
- Release archiving + deletion
- Batch operations (distribute multiple releases at once)
- Enhanced validation (artwork dimensions, audio quality checks)
- SoundCloud API access (if approved) for full automation
- LabelRadar API integration (if available)
- Email notifications (distribution confirmations, label responses)

**V3 (Full Distribution Platform - Target: 6-12 Months After V2)**

**Scope:**
- Users: 1,000+ producers
- EP/Album support (multi-track releases)
- Advanced analytics (streaming stats, demographic data)
- Label outreach CRM (track submissions, follow-ups, relationships)
- Beatport/Traxsource integration
- DDEX standard support (label-level distribution)
- Collaborative features (multiple artists per release)
- Permanent storage tier for paid users

**Key Technical Decisions & Rationale**

**releaseId Format: YYYY-MM-DD_ArtistName_TrackTitle**
- Example: 2026-02-05_SophieJoe_TellMe
- Why: Sortable by date, human-readable, filesystem-safe, unique per release
- Spaces removed from artist and title for filesystem compatibility

**Genre Dropdown (Not Free Text)**
- 10 predefined options in alphabetical order
- Options: Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other
- Why: Ensures data consistency, prevents typos, easier for analytics later

**Metadata in Upload Response**
- File-handler returns artist/title/genre in POST /upload response
- Why: Allows metadata generation without referencing previous nodes by name
- Avoids "Referenced node doesn't exist" errors in n8n Code nodes

**express.json() Middleware**
- Added to server.js for parsing JSON request bodies
- Why: Required for POST /metadata endpoint to read req.body
- Without it: req.body is undefined, causing errors

**n8n HTTP Request: "Using Fields Below" for JSON**
- Don't use raw JSON with {{ }} expressions in quotes
- Use parameter fields with expression mode instead
- Why: Prevents "[object Object]" serialization errors

**Parallel Branch Strategy in n8n**
- Duplicate metadata nodes for with-video and no-video branches
- Don't use Merge node (causes execution issues with conditional IF)
- Why: Simpler, more reliable, easier to debug

**Storage Structure**
- Example: 2026-02-05_SophieJoe_TellMe/audio/track.wav, /artwork/cover.jpg, /video/promo.mp4, /metadata.json
- Why: Keeps all release assets together, easy to zip for distribution, clear organization

**No Database in MVP**
- Store metadata as JSON files in release folders
- Why: Simpler for learning, fewer moving parts, easy to inspect/debug
- V2 adds PostgreSQL when multi-user requires querying/relationships

**Async/Await for File Operations (Milestone 4)**
- Used fs.promises for /releases and /storage/status endpoints
- Kept fsSync for Multer middleware (needs synchronous callbacks) and duplicate detection
- Why: Reading many directories is slow; async prevents blocking the server
- Pattern: await fs.readdir() in route handlers, fsSync.existsSync() in middleware

**Audio Validation After Upload (Milestone 4)**
- Multer uploads first, then music-metadata validates
- If invalid: delete file with fsSync.unlinkSync(), return 422 Unprocessable Entity status
- Why: Can't validate before Multer saves (need file path), but must validate before confirming success
- Validates: duration (1s-1hr), format metadata exists, codec readable

**HTTP Status Codes (Milestone 4)**
- 409 Conflict: Duplicate releaseId already exists
- 422 Unprocessable Entity: Audio file corrupt/invalid
- Why: More precise than generic 400 Bad Request, helps debugging and API clarity

**Distribution Tracking in metadata.json (Milestone 5)**
- Nested structure by path type (publish, labels, streaming, marketing)
- Each entry tracks: platform, status, timestamps, URLs, platform-specific IDs
- Why: Easy to query "where has this been distributed?", supports sequential distribution over time
- Allows duplicate prevention (can't re-submit to same platform twice)

**Local Storage First, Cloud Later (Milestone 5)**
- MVP uses local filesystem, V2 migrates to cloud
- Why: Zero storage costs during development, learn the system first, scale when needed
- Migration path: Replace file paths with S3 URLs, same API interface

**Multi-Path Distribution Philosophy (Milestone 5)**
- User decides track purpose first (Publish, Labels, Distribute, Market)
- Each path has relevant platform options
- Why: Matches real producer workflow (not all tracks go everywhere)
- Example: Demo track → Labels only, Finished single → Publish + Distribute + Market

**Common Issues & Solutions (Reference)**

**Issue: ECONNREFUSED when n8n calls file-handler**
- Solution: Use http://host.docker.internal:3001 (not 127.0.0.1) in n8n HTTP Request node
- Why: Docker networking isolation

**Issue: "Referenced node doesn't exist" in n8n Code node**
- Solution: Don't use $('Node Name') to reference other nodes; use data from $input or pass data through workflow
- Why: Node name references are fragile and case-sensitive

**Issue: req.body is undefined in Express**
- Solution: Add app.use(express.json()); before route definitions
- Why: Express doesn't parse JSON bodies by default

**Issue: metadata.json shows "[object Object]"**
- Solution: In n8n HTTP Request, use "Using Fields Below" mode, not raw JSON with quoted expressions
- Why: Quoted expressions serialize objects to strings

**Issue: Merge node not executing in n8n**
- Solution: Don't use Merge after conditional IF—duplicate nodes on each branch instead
- Why: Merge expects both inputs, but IF only sends one

**Issue: Genre showing "Unknown" in metadata**
- Solution: Pass genre as query parameter in HTTP Request, return it in file-handler response
- Why: Metadata code can't access Form Trigger data directly

**Issue: Git tracking node_modules/ folder (1000+ files to commit)**
- Solution: Add `node_modules/` to .gitignore, then run `git rm -r --cached file-handler/node_modules`
- Why: node_modules/ regenerates with npm install, shouldn't be in version control

**Learning Preferences**

**How I Learn Best:**
- Show me working code first, then explain WHY it works
- Use real-world analogies (music production, workflows I understand)
- Break complex concepts into small, testable steps
- Let me run/test code immediately to see results
- Explain "what could go wrong" scenarios (helps me debug later)

**Explanation Style I Prefer:**
- Start with the high-level goal ("We're building X so you can Y")
- Show the code implementation
- Explain key concepts in plain language
- Point out common pitfalls
- Give me next steps or exercises to try

**What Frustrates Me:**
- Unexplained jargon without context
- "Just copy this code" without understanding
- Skipping error handling (then I don't know what to do when it breaks)
- Assuming I know background concepts (databases, APIs, etc.)

**Tools I'm Learning**

**Node.js/Express:**
- Understanding: Routes, middleware, async/await, error handling
- Still learning: Best practices for API design, security considerations
- Want to learn: Testing (Jest), logging (Winston), environment variables

**n8n:**
- Understanding: Basic workflows, HTTP nodes, IF conditionals, Code nodes
- Still learning: Complex branching, error workflows, webhook security
- Want to learn: Custom node development, workflow templates, reusable sub-workflows

**Git/Version Control:**
- Understanding: Commits, pushing to remote, GitHub Desktop
- Still learning: Branching strategies, merge conflicts, .gitignore patterns
- Want to learn: Pull requests, code reviews, collaboration workflows

**APIs:**
- Understanding: REST basics (GET, POST), JSON responses, query parameters
- Still learning: Authentication (OAuth2), rate limiting, pagination
- Want to learn: GraphQL, WebSockets, API versioning

**Current Learning Goals**

**Technical Skills (Next 4 Weeks):**
1. Master OAuth2 flow (YouTube API integration for Milestone 5)
2. Understand file streaming/chunked uploads (large video files)
3. Learn ZIP file creation (distribution packages)
4. Practice async/await patterns (multiple API calls in sequence)
5. Build confidence with error handling (try/catch, status codes)

**System Design Understanding:**
1. How authentication works (tokens, sessions, refresh tokens)
2. How to structure APIs for frontend consumption
3. When to use databases vs files for storage
4. How to track state across multiple systems (n8n → Express → platforms)

**Real-World Application:**
1. Complete Milestone 5 (working distribution system)
2. Release a real track using the system
3. Identify bottlenecks/pain points in workflow
4. Iterate based on actual usage

**Tool-Specific Instructions**

**For Cursor IDE/Claude Code:**
- Explain what each code block does before showing it
- Use comments for complex logic, but keep them concise
- Show me where to place new code in existing files
- Warn me about breaking changes or deprecations
- Suggest keyboard shortcuts or IDE features that speed up coding

**For n8n:**
- Provide JSON export of complete workflows (I'll import them)
- Explain node configuration settings (not just "configure this")
- Show me how to test individual nodes (Execute Node button)
- Warn about common pitfalls (Merge nodes, node references, etc.)
- Suggest when to use Code nodes vs built-in nodes

**For Terminal/Command Line:**
- Always show the full command with context
- Explain what flags/parameters do (-r, --save, etc.)
- Show expected output so I know if it worked
- Include verification steps (how to check it's running)
- Warn about destructive commands (rm, git force push, etc.)

**Business Model (Future Thinking)**

**MVP Phase (Free - Solo Use):**
- Purpose: Validate concept, learn the tech, build something useful for myself
- Cost: $0 (local development only)
- Users: Just me

**V2 Phase (Freemium SaaS):**

**Free Tier:**
- 5 releases/month
- 30-day temporary storage
- Basic distribution (1 automated platform + manual guides)
- Email support only

**Pro Tier ($10/month):**
- Unlimited releases
- 90-day storage
- All automated platforms
- Priority support
- Advanced analytics

**Label Tier ($50/month):**
- Everything in Pro
- Permanent storage (1TB)
- Multi-artist support
- DDEX distribution
- Beatport/Traxsource integration
- Dedicated account manager

**Revenue Target:**
- 100 Pro users = $1,000/month (covers hosting + development time)
- 1,000 Pro users = $10,000/month (full-time sustainable)

**V3 Phase (Enterprise/White-Label):**
- License platform to indie labels ($500-2,000/month)
- White-label solution for distributors
- API access for third-party integrations
- Custom workflow development services

**Master Prompt Management**

**When to Update This Document:**
- ✅ After completing each milestone (update status, add learnings)
- ✅ When making significant architectural decisions (document rationale)
- ✅ After solving tricky bugs (add to Common Issues section)
- ✅ When changing tech stack or adding dependencies
- ❌ Not for minor code tweaks or daily progress

**Version Numbering:**
- Format: v2.X (major version = MVP phase, minor = milestones completed)
- v2.0-2.3: Milestones 1-4
- v2.4: Milestone 5 in progress
- v2.5: Milestone 5 complete
- v3.0: V2 phase begins (multi-user SaaS)

**Archive Process:**
1. Before major changes, copy current MASTER_PROMPT.md to docs/archive/
2. Name format: MASTER_PROMPT_YYYY-MM-DD_HH-MM.md
3. Update "Last Updated" and "Version" in new document
4. Add summary of changes at top of new version

**What to Keep:**
- All completed milestone summaries (reference for future work)
- Key technical decisions (reasoning helps future choices)
- Common issues & solutions (saves debugging time)
- Learning preferences (helps AI assistants tailor explanations)

**What to Archive:**
- Deprecated approaches (moved to archive with explanation)
- Outdated tool-specific instructions (when upgrading versions)
- Completed learning goals (move to "Skills Acquired" section)

**Document Version: 2.4**  
Last Updated: February 6, 2026, 3:27 AM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) IN PROGRESS  
Maintained By: You (update after each milestone)

**Changes in v2.4:**
- Expanded Milestone 5 scope: 4-path distribution system (Publish, Submit to Labels, Distribute, Market)
- Added distribution tracking structure (metadata.json format)
- Defined storage strategy (local MVP, temporary V2, permanent V3)
- Added new API endpoints for Milestone 5
- Documented new npm dependencies (googleapis, google-auth-library, archiver)
- Added multi-path distribution philosophy to Key Technical Decisions
- Updated project structure for distribution guides and workflows

***

**Master Prompt updated to v2.4!** 

Ready to start building Milestone 5? Let me know if you want to:
1. Begin with YouTube API setup (Google Cloud OAuth2 credentials)
2. Start with the distribution router system (choosing paths after upload)
3. Build the metadata tracking system first (distribution history in metadata.json)

Which would you like to tackle first?