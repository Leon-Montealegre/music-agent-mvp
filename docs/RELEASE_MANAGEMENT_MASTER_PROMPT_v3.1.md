# Release Management Master Prompt v3.1

**Last Updated:** February 11, 2026  
**Project:** Music Agent - Release Management System  
**Current Phase:** Mini-MVP 1 Complete (with bugs to fix)  
**Next Phase:** Bug fixes, UI beautification, then Mini-MVP 2

---

## Quick Reference

**What this project is:** A local-first release management dashboard for electronic music artists to track releases, platform uploads, and label submissions.

**Current status:** 
- ✅ Mini-MVP 1 functionally complete
- ⚠️ Has bugs (unknown releases, invalid dates, visual issues)
- ⏳ Needs UI beautification (dark theme, better contrast)
- 🎯 Next: Fix bugs, beautify UI, then build Mini-MVP 2 (Label CRM)

**Tech stack:**
- Backend: Express.js on port 3001
- Frontend: Next.js on port 3000
- Storage: JSON files (no database)
- Currently: Still using n8n for release creation (to be replaced)

---

## Project Evolution

### v2.0-2.7: "Music Agent" (Automation Focus)
- Attempted Playwright automation for platform uploads
- Learned: Too fragile, platforms change frequently
- Pivot needed: Focus on management, not automation

### v3.0: "Release Management System" (Management Focus)
- Reframed as tracking/organization tool
- Shelved Playwright automation
- Prioritized pain points over automation
- New mini-MVP sequence based on actual user needs

### v3.1: Mini-MVP 1 Complete (Current)
- Built Next.js dashboard
- Platform upload tracking working
- Label submission tracking working
- Bugs discovered during testing
- UI needs dark theme and better contrast

---

## Current Architecture

### Backend (Express API - Port 3001)

**Location:** `~/Documents/music-agent-mvp/file-handler/server.js`

**Key endpoints:**
- `GET /releases/` - List all releases (simplified data)
- `GET /releases/:releaseId/` - Full release details
- `PATCH /releases/:releaseId/distribution` - Update distribution tracking
- `GET /releases/:releaseId/artwork/` - Serve artwork image
- `POST /upload` - Upload files (audio, artwork, video)
- `POST /metadata` - Save metadata.json
- `GET /health` - Health check

**Data storage:** JSON files at `~/Documents/Music Agent/Releases/`

**Structure:**
```
~/Documents/Music Agent/Releases/
  └── 2026-02-08_SophieJoe_TellMe/
        ├── versions/primary/audio/track.wav
        ├── artwork/cover.png
        ├── metadata.json          ← Source of truth
        └── packages/              ← Generated ZIPs
```

### Frontend (Next.js - Port 3000)

**Location:** `~/Documents/music-agent-mvp/frontend/`

**Key files:**
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.js                     ← Homepage (release list)
│   │   ├── layout.js                   ← App wrapper/header
│   │   ├── releases/
│   │   │   ├── [releaseId]/page.js    ← Detail page
│   │   │   └── new/page.js             ← Create form (placeholder)
│   ├── components/
│   │   ├── ReleaseCard.js              ← Card component
│   │   ├── Modal.js                    ← Popup modal
│   │   ├── LogPlatformForm.js          ← Platform upload form
│   │   └── LogSubmissionForm.js        ← Label submission form
│   └── lib/
│       └── api.js                      ← API helper functions
```

---

## Mini-MVP 1: Release Dashboard ✅ (Functionally Complete)

### What Was Built

**Homepage (`/`):**
- Grid of release cards
- Shows artwork, title, artist, genre, date
- Status indicators (platform count, submission count)
- "Create New Release" button (links to placeholder)
- Click card → navigate to detail page

**Detail Page (`/releases/[releaseId]`):**
- Left sidebar: Artwork, metadata, file counts, versions
- Right side: Three sections for 3-path tracking:
  - Platform Status (release path)
  - Label Submissions (submit path)
  - Marketing Content (promote path - placeholder)
- Modal forms to log uploads and submissions
- Data instantly updates after saving

**Forms (Modals):**
- Log Platform Upload: Platform, Status, URL, Notes
- Log Label Submission: Label, Platform, Status, Notes
- Saves via PATCH /distribution endpoint
- Closes on submit, refreshes data

### What Works

✅ Release list displays all releases  
✅ Cards show artwork and metadata  
✅ Clicking card navigates to detail page  
✅ Detail page shows full metadata  
✅ Platform upload form saves and displays  
✅ Label submission form saves and displays  
✅ Data persists to metadata.json  
✅ Artwork serves from Express API  
✅ Modal forms work correctly  

### Known Bugs 🐛

See `MINI_MVP_1_BUGFIX_AND_BEAUTIFY_PROMPT.md` for full details.

**Bug 1: "Unknown" Release Created**
- n8n workflow creates release with releaseId="unknown"
- Causes invalid dates and missing metadata
- Root cause: n8n not generating proper releaseId format

**Bug 2: Invalid Date Display**
- Cards show "Invalid Date" instead of actual date
- Caused by Bug 1 (releaseId format issue)

**Bug 3: Missing Metadata on Cards**
- Some metadata doesn't display properly
- Simplified API response doesn't include all fields

**Bug 4: "?" Instead of Submission Count**
- Cards show "?" for submission count
- Placeholder logic needs actual count calculation
- Requires API to return distribution counts

### UX Issues 🎨

**Visual Problems:**
- Light gray background (needs dark theme for electronic music vibe)
- Text barely visible (low contrast)
- Platform/label names hard to read
- Section headers not prominent enough

**Needed Improvements:**
- Dark/black background with gradient
- High-contrast text (light on dark)
- Better font weights and sizes
- Glassmorphism effects (optional)
- Glowing genre tags

---

## Mini-MVP 1 Definition of Done (Updated)

### Functional Requirements ✅
- [x] Next.js app runs on localhost:3000
- [x] Homepage shows all releases with artwork
- [x] Clicking a release shows full detail page
- [x] Platform upload status displayed
- [x] Label submission history displayed
- [x] Can log platform upload in <10 seconds
- [x] Can log label submission in <10 seconds
- [ ] Can create new release through UI (currently n8n)
- [x] Data persists correctly

### Bug Fixes Needed ⚠️
- [ ] No "unknown" releases
- [ ] All dates display correctly
- [ ] Submission counts accurate (not "?")
- [ ] All metadata displays properly

### UI/UX Requirements 🎨
- [ ] Dark theme applied throughout
- [ ] All text clearly visible (high contrast)
- [ ] Modern, professional appearance
- [ ] Suitable for electronic music aesthetic

---

## Roadmap: Next Steps

### Immediate (Next Session)
1. Fix bugs (unknown releases, invalid dates, counts)
2. Apply dark theme
3. Improve font visibility
4. Optional: Replace n8n with Next.js form

### Mini-MVP 2: Label Submission Tracker (CRM)
**Pain point:** "The label submission process is chaotic"

**Features:**
- Label directory (save labels you submit to)
- Submission dashboard (all pending, sorted by wait time)
- Follow-up reminders (14+ days = needs follow-up)
- Prevent duplicate submissions
- Track response status and feedback

**Backend needed:**
- Label management endpoints
- Submission tracking improvements
- Date calculations for "days waiting"

### Mini-MVP 3: SoundCloud API Integration
**Pain point:** "Manual uploading to SoundCloud is tedious"

**Features:**
- Direct upload to SoundCloud via OAuth + API
- Auto-fill metadata from release
- Track upload status
- Optional: Private link generation for label submissions

### Future (V2+)
- Multi-user support (cloud deployment)
- DistroKid integration (if API available)
- YouTube upload automation
- Mobile app
- Analytics dashboard

---

## Design Decisions & Learnings

### Why Local-First?
- No cloud costs
- No authentication complexity
- Works offline
- Fast development
- Easy to deploy later if needed

### Why JSON Files Instead of Database?
- Simpler for MVP
- Human-readable
- Easy to debug
- No migration headaches
- Can add database later

### Why Management Over Automation?
- Platform automation is fragile (Playwright breaks)
- APIs are limited or require approval
- Tracking is the real value
- User keeps control
- Works with any platform

### Why Next.js?
- Modern React framework
- Built-in routing
- Easy deployment (Vercel)
- Great developer experience
- Client-side data fetching is simple

---

## Tech Stack Details

### Backend
- **Express.js** - Web server
- **Multer** - File upload handling
- **fs/promises** - File system operations
- **music-metadata** - Audio file parsing
- **archiver** - ZIP file generation
- **cors** - Enable cross-origin requests

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **No state management** - Simple useState/useEffect
- **No additional UI libraries** - Keeping it minimal

### Development
- **macOS** - Development environment
- **Cursor IDE** - Code editor
- **GitHub Desktop** - Version control
- **n8n** - Currently used for release creation workflow

---

## Data Model

### Release Metadata Structure

```json
{
  "versions": {
    "primary": {
      "versionName": "Primary Version",
      "versionId": "primary",
      "createdAt": "2026-02-08T00:00:00.000Z",
      "files": {
        "audio": [{ "filename": "...", "size": 123, ... }],
        "artwork": [{ "filename": "...", "size": 456, ... }],
        "video": []
      }
    }
  },
  "artist": "Artist Name",
  "title": "Track Title",
  "genre": "Melodic House and Techno",
  "releaseType": "Single",
  "releaseDate": "2026-02-08",
  "releaseId": "2026-02-08_ArtistName_TrackTitle",
  "createdAt": "2026-02-08T00:00:00.000Z",
  "updatedAt": "2026-02-08T12:00:00.000Z",
  "distribution": {
    "release": [
      {
        "platform": "SoundCloud",
        "status": "uploaded",
        "timestamp": "2026-02-08T12:00:00.000Z",
        "url": "https://soundcloud.com/...",
        "notes": "..."
      }
    ],
    "submit": [
      {
        "label": "Anjunadeep",
        "platform": "LabelRadar",
        "status": "submitted",
        "timestamp": "2026-02-08T12:00:00.000Z",
        "notes": "..."
      }
    ],
    "promote": []
  }
}
```

### Genre Options

Fixed dropdown values:
- Ambient
- Deep House
- House
- Indie Dance
- Melodic House and Techno
- Progressive House
- Tech House
- Techno
- Trance
- Other

---

## Common Patterns & Best Practices

### API Calls (frontend)

Always extract `data.release` from API responses:
```javascript
const response = await fetchRelease(releaseId)
const actualRelease = response.release || response
```

### Error Handling

Always use try/catch and show user-friendly messages:
```javascript
try {
  await updateDistribution(releaseId, 'release', entry)
} catch (err) {
  alert('Failed to save. Please try again.')
}
```

### Modal Pattern

1. State: `const [showModal, setShowModal] = useState(false)`
2. Button: `onClick={() => setShowModal(true)}`
3. Modal: `<Modal isOpen={showModal} onClose={() => setShowModal(false)}>`

### Form Submission

1. Prevent default: `e.preventDefault()`
2. Build entry object with required + optional fields
3. Call API with updateDistribution
4. Reload data with fetchRelease
5. Close modal and update state

---

## Naming Conventions

### App Name Evolution

**Current:** "Release Management System"

**User's concern:** Many tracks are "unreleased" even when submitted to labels

**Proposed alternatives:**
- Music Agent: Track Catalogue ⭐ (my favorite)
- Music Agent: Artist Portal
- Music Agent: Release Pipeline
- Music Agent: Demo Manager
- Music Agent: A&R Dashboard
- Music Agent: Vault
- Music Agent: Launch Pad
- Music Agent: Studio Hub

**Recommendation:** "Music Agent: Track Catalogue" - accurate, professional, doesn't assume everything gets "released"

---

## How to Use This Master Prompt

### For New Features
1. Read this master prompt for context
2. Read the specific mini-MVP continuation prompt
3. Start with the suggested first step
4. Work sequentially through the plan
5. Test after each step

### For Bug Fixes
1. Read this master prompt for architecture
2. Read the bug fix prompt for specific issues
3. Identify root cause
4. Fix and test
5. Update this prompt if architecture changes

### For Continuing Work
Start Claude conversations with:
> "I'm working on [feature/bug] for my Release Management System. Please read the Release Management Master Prompt in Project Knowledge for context. [Specific ask]."

---

## File Locations Reference

### Source Code
- Express API: `~/Documents/music-agent-mvp/file-handler/`
- Next.js Frontend: `~/Documents/music-agent-mvp/frontend/`
- n8n Workflows: `~/Documents/music-agent-mvp/workflows/`

### Data Storage
- Releases: `~/Documents/Music Agent/Releases/`
- Each release: `~/Documents/Music Agent/Releases/[releaseId]/`

### Documentation
- Master Prompt: `docs/RELEASE_MANAGEMENT_MASTER_PROMPT.md`
- Continuation Prompts: `docs/MINI_MVP_*_CONTINUATION_PROMPT.md`
- Bug Fix Prompts: `docs/MINI_MVP_*_BUGFIX_PROMPT.md`

---

## Version History

- **v2.0-2.7:** Original "Music Agent" automation focus
- **v3.0 (Feb 5, 2026):** Major pivot to management focus
- **v3.1 (Feb 11, 2026):** Mini-MVP 1 complete, documented bugs and UX issues

---

## Master Prompt Maintenance

**Update this prompt when:**
- ✅ Completing a mini-MVP
- ✅ Making architectural changes
- ✅ Discovering important bugs/patterns
- ✅ Changing tech stack
- ⚠️ NOT for minor code changes

**Archive process:**
1. Copy to `docs/archive/MASTER_PROMPT_YYYY-MM-DD_HH-MM.md`
2. Update version number
3. Update "Last Updated" date
4. Update Project Knowledge copy

---

**End of Master Prompt v3.1**
