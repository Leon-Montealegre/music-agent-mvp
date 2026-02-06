**Music Agent - Master Project Context v2.3**

**Document Info**  
Last Updated: February 6, 2026, 2:36 AM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) NEXT  
Version: 2.3 (Milestone 4 complete - Storage Manager fully functional)

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
│       └── MASTER_PROMPT_2026-02-06_01-09.md
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

⏳ **Milestone 5: Distribution Orchestrator (NEXT)**
- SoundCloud/YouTube automated uploads
- DistroKid/Bandcamp manual guides

⏳ **Milestone 6: Promo Content Generator**
- Social media templates
- Automated caption generation

⏳ **Milestone 7: Next.js UI**
- User-facing upload form
- Replace n8n Form Trigger with custom UI

**File-Handler API Details**

**server.js configuration:**
- Port: 3001
- **Endpoints:**
  - GET /health - Server status check
  - POST /upload?releaseId=...&artist=...&title=...&genre=... - File uploads (with duplicate detection + audio validation)
  - POST /metadata - Save metadata.json
  - GET /releases - List all releases (sorted newest first)
  - GET /storage/status - Disk space information (warns if < 10GB free)
  - **V2 additions (deferred):**
    - GET /releases/:releaseId - Get specific release details
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
5. ⏳ Distribution Orchestrator (SoundCloud/YouTube automated, DistroKid/Bandcamp guides) - NEXT
6. ⏳ Promo Content Generator (social media templates)
7. ⏳ Next.js UI (user-facing upload form)

**Success Criteria:**
- ✅ Can upload a single track → auto-published to SoundCloud + YouTube
- ✅ Understand n8n, Express APIs, file handling, webhooks, multipart/form-data
- ✅ Have working foundation for V2 enhancements

*(Rest of the document continues exactly as before with V2, V3, EP Functionality, Label Outreach, Beatport Readiness, Analytics Dashboard, Claude CoWork, Musician-First Features, Technology Evolution, Key Technical Decisions sections...)*

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

*(Continue with Learning Preferences, Tools I'm Learning, Current Learning Goals, Tool-Specific Instructions, Business Model, Master Prompt Management sections exactly as before...)*

**Document Version: 2.3**  
Last Updated: February 6, 2026, 2:36 AM CET  
Status: Milestones 1-4 Complete | Milestone 5 (Distribution Orchestrator) NEXT  
Maintained By: You (update after each milestone)

***