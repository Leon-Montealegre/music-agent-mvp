# Release Management System - Master Prompt
**Last Updated:** February 14, 2026 9:00 PM CET  
**Current Status**: Mini-MVP 1.5 COMPLETE ✅ - Search, Filter, Statistics & Enhanced Metadata

---

## Project Overview
Personal Release Management System for electronic music releases. Built by a beginner learning to code, creating a tool for active use as an electronic music artist.

**Current Phase**: Active Development - Core features complete, expanding functionality

---

## Tech Stack

### Backend
- **Framework**: Node.js/Express
- **Port**: 3001
- **Location**: `~/Documents/music-agent-mvp/file-handler/`
- **Storage**: JSON files on disk (no database)
- **File Handling**: Multer for uploads

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Port**: 3000
- **Location**: `~/Documents/music-agent-mvp/frontend/`
- **Styling**: Tailwind CSS (dark theme)

### Development Environment
- **OS**: macOS
- **IDE**: Cursor
- **Version Control**: GitHub Desktop
- **Storage**: `~/Documents/Music Agent/Releases/`

---

## Core Concepts

### 3-Path Tracking
Every release action falls into one of three paths:
1. **Release** - Platform uploads (Spotify, Beatport, etc.)
2. **Submit** - Label pitching and submissions
3. **Promote** - Marketing and promotional activities

### Release Status Tracking
Tracks are identified by their actual workflow state:
- **Not Submitted** - No label submissions yet
- **Submitted** - Sent to labels, awaiting response (not signed, not released)
- **Signed** - Has submission with `status: "signed"`
- **Released** - Live on platforms with `status: "Live"` or `status: "live"`
- **Promoted** - Active promo campaigns (future feature)

**Key Rule**: Tracks can be BOTH Signed AND Released simultaneously

### Management Philosophy
- **Track, don't automate**: System organizes and tracks, doesn't automate uploads
- **Local-first**: Runs entirely on local machine, no cloud dependencies (for now)
- **Real-world focused**: Built for actual artist workflows
- **Beginner-friendly**: Assumes no prior coding knowledge, explains concepts

### Data Structure
- **releaseId format**: `YYYY-MM-DD_ArtistName_TrackTitle`
- **Storage pattern**: Each release gets its own folder with `metadata.json`
- **File organization**: Audio files, artwork, and documents stored alongside metadata
- **Flat metadata**: Properties at root level, not nested under `metadata` object

---

## Completed Features

### ✅ Phase 1: Foundation (Mini-MVP 1)

#### Milestone 1: File Handler (Backend Foundation)
- Express server with file upload handling
- JSON-based storage system
- Directory structure creation
- CORS configuration for frontend
- Dynamic query parameter handling

#### Milestone 2: Track Ingestion
- Drag-and-drop file upload
- Audio file parsing (metadata extraction)
- Artwork upload and display
- Video file upload (optional)
- Release folder creation
- **Enhanced Form Fields**:
  - Artist, Title, Genre (required)
  - Production Date (when track was finished)
  - Format (Single/EP/Album/Remix)
  - BPM (optional, 60-200 range)
  - Key (optional, all 24 musical keys)
  - Audio, Artwork, Video files

#### Milestone 3: Release Catalogue
- Grid view of all releases
- Artwork thumbnails
- **5-Filter System**:
  - All Tracks
  - Not Submitted
  - Submitted
  - Signed
  - Released
- **Search Functionality**:
  - Real-time search across title, artist, genre, label, BPM, key
  - Live filtering as you type
  - Clear search button
- Release date sorting
- Track count display (filtered vs total)

#### Milestone 4: Release Detail Page
- Complete metadata display (including BPM and Key)
- File management (audio, artwork, additional files)
- Three-column layout (sidebar + two content columns)
- Audio player
- Status badges (Signed, Submitted)

#### Milestone 5: Statistics Dashboard
**New Page**: `/stats`
- **Overview Card**: Total, Not Submitted, Submitted, Signed, Released counts
- **BPM Analysis**: Average BPM, min-max range
- **Top 5 Genres**: Bar chart with percentages
- **Top 5 Labels**: Most worked-with labels
- **Key Distribution**: Most common musical keys
- **Production by Year**: Track count per year

### ✅ Phase 2: Advanced Features

#### Label Deal Management
**Label Deal Detail Page** (`/releases/{releaseId}/label-deal`)
- Multiple contact management (add/edit/delete)
- Contact fields: name, role, email, phone, location, notes
- Contract document uploads (drag & drop)
- Document management (upload/download/delete)
- CRM-ready data structure
- Organized storage: `{releaseId}/label-deal/` folder

#### Platform Distribution Tracking
- Add/edit/delete platform releases
- Track release dates and URLs
- Status tracking (Scheduled, Live, etc.)
- Platform-specific metadata

#### Label Submission Tracking
- Add/edit/delete submissions
- Track submission dates and status
- Mark as signed functionality (changes submission status to "signed")
- Notes field for context

### ✅ Phase 3: UI/UX & Monetization

#### UI/UX Enhancements
- Dark theme throughout
- Responsive design (desktop-first)
- Custom modals (no browser alerts)
- Scroll-to-top on navigation
- Semi-transparent sticky header with blur
- Loading states and error handling
- **Updated Header**:
  - Logo (left)
  - Feedback button (gray)
  - Buy Me a Coffee button (orange, distinct from Feedback)
  - Statistics button (on catalogue page)

#### Feedback System
- Google Sheets integration
- Feedback button on every page
- Modal for submitting feedback
- Easy user input collection

#### Monetization Ready
- Buy Me a Coffee integration
- Support button in header
- Non-intrusive placement
- Optional for users

---

## API Endpoints

### Releases
- `GET /releases` - List all releases (returns `{ success: true, count: N, releases: [...] }`)
- `GET /releases/:releaseId` - Get release details
- `POST /upload` - Upload new track (accepts query params: releaseId, artist, title, genre, bpm, key)
- `DELETE /releases/:releaseId` - Delete release
- `GET /releases/:releaseId/files/:filename` - Download file
- `DELETE /releases/:releaseId/files/:filename` - Delete file

### Metadata
- `POST /metadata` - Save track metadata (accepts BPM and Key)

### Label Submissions
- `POST /releases/:releaseId/submissions` - Add submission
- `PATCH /releases/:releaseId/submissions/:index` - Update submission (can set status to "signed")
- `DELETE /releases/:releaseId/submissions/:index` - Delete submission

### Platform Distribution
- `POST /releases/:releaseId/distribution` - Add distribution entry
- `PATCH /releases/:releaseId/distribution/:index` - Update entry (can set status to "Live")
- `DELETE /releases/:releaseId/distribution/:index` - Delete entry

### Label Deal Contacts
- `POST /releases/:releaseId/label-deal/contacts` - Add contact
- `PATCH /releases/:releaseId/label-deal/contacts/:contactId` - Update contact
- `DELETE /releases/:releaseId/label-deal/contacts/:contactId` - Delete contact

### Label Deal Files
- `POST /releases/:releaseId/label-deal/files` - Upload document
- `GET /releases/:releaseId/label-deal/files/:filename` - Download document
- `DELETE /releases/:releaseId/label-deal/files/:filename` - Delete document

---

## Data Schema

### Release Metadata Structure (Flat)
**Important**: Metadata is stored at the root level, NOT nested under a `metadata` object

```json
{
  "releaseId": "2026-02-14_Artist_Track",
  "artist": "Artist Name",
  "title": "Track Title",
  "genre": "Progressive House",
  "bpm": 126,
  "key": "A minor",
  "releaseDate": "2026-02-14",
  "trackDate": "2026-02-14",
  "releaseType": "Single",
  "releaseFormat": "Single",
  "createdAt": "2026-02-14T00:00:00.000Z",
  "versionCount": 1,
  "fileCounts": {
    "audio": 1,
    "artwork": 1,
    "video": 0
  },
  "distribution": {
    "submit": [
      {
        "label": "Label Name",
        "platform": "Email",
        "status": "Submitted",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "notes": "Sent via email"
      },
      {
        "label": "Signed Label",
        "platform": "Email",
        "status": "signed",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "signedAt": "2026-02-14T00:00:00.000Z",
        "notes": "Deal confirmed"
      }
    ],
    "release": [
      {
        "platform": "Spotify",
        "status": "Live",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "url": "https://open.spotify.com/...",
        "notes": "Pre-save campaign active"
      }
    ],
    "promote": []
  }
}
```

### Status Detection Logic
```javascript
// Signed: Any submission with status "signed" (case-insensitive)
const isSigned = distribution?.submit?.some(
  entry => entry.status?.toLowerCase() === 'signed'
)

// Released: Any platform with status "live" (case-insensitive)
const isReleased = distribution?.release?.some(
  entry => entry.status?.toLowerCase() === 'live'
)

// Submitted: Has submissions but NOT signed and NOT released
const isSubmitted = distribution?.submit?.length > 0 && !isSigned && !isReleased

// Not Submitted: No submissions at all
const isNotSubmitted = !distribution?.submit?.length
```

---

## Component Architecture

### Reusable Components
- `Modal.js` - Generic modal wrapper
- `ConfirmDeleteModal.js` - Themed delete confirmation
- `LabelContactForm.js` - Contact add/edit form
- `ScrollToTop.js` - Auto-scroll on navigation
- `FeedbackButton.js` - Google Sheets feedback integration
- `ReleaseCard.js` - Track card for catalogue grid

### Page Structure
- `app/page.js` - Release catalogue with search & filters
- `app/releases/new/page.js` - Upload new track form
- `app/releases/[releaseId]/page.js` - Release detail page
- `app/releases/[releaseId]/label-deal/page.js` - Label deal management
- `app/stats/page.js` - Statistics dashboard
- `app/layout.js` - Root layout with header and global styles

### Utility Files
- `lib/api.js` - API wrapper functions (handles flat vs nested metadata)

---

## Key Learnings & Decisions

### What Worked
- **JSON storage**: Simple, portable, version-controllable
- **Flat metadata structure**: Easier to work with than nested objects
- **Component reuse**: Modal patterns saved time
- **Dark theme**: Professional look, artist-friendly
- **Local-first**: No API keys, no monthly fees, full control
- **Case-insensitive status checks**: Handles "Live", "live", "LIVE" all the same
- **Real-time filtering**: Immediate feedback as user types

### What to Avoid
- **Don't rebuild working backend** - Extend, don't replace
- **No premature optimization** - Database can wait until needed
- **Keep it simple** - Resist complex state management for now
- **Test immediately** - Small steps, run after each change
- **Don't assume data structure** - Always inspect actual API responses first

### Development Patterns
1. Show working code first, then explain why
2. Small testable steps with clear terminal commands
3. Use music production analogies for complex concepts
4. Explain "what could go wrong" scenarios
5. Complete code, not pseudocode
6. Always verify data structure before coding filters

### Common Pitfalls to Avoid
- **Assuming nested metadata**: Check if data is flat or nested
- **Case-sensitive status checks**: Always use `.toLowerCase()`
- **Missing optional chaining**: Use `?.` for safe property access
- **Not handling undefined**: Always check if objects/arrays exist
- **Hardcoding status values**: Make status checks flexible

---

## Filter System Details

### 5-Filter Button Logic

**Filter Priority**: Inclusive (tracks can appear in multiple filters)

| Filter | Logic | Example |
|--------|-------|---------|
| **All Tracks** | Everything | All 4 tracks |
| **Not Submitted** | No submissions | Demo sitting on hard drive |
| **Submitted** | Has submissions, NOT signed, NOT released | Sent to labels, waiting |
| **Signed** | Has submission with `status: "signed"` | Label deal confirmed |
| **Released** | Has platform with `status: "Live"` | Live on Spotify |

**Key Rules**:
- ✅ Track can be Signed + Released (both at once)
- ❌ Track CANNOT be Submitted + Released (if released, no longer just "submitted")

### Search Functionality
- Searches across: title, artist, genre, BPM, key, submission labels
- Real-time filtering (updates as you type)
- Works in combination with status filters
- Shows "X tracks (filtered) • Y total" when active

---

## What NOT to Do

❌ Rebuild the Express API (it works, just extend it)  
❌ Suggest database migrations (MVP uses JSON)  
❌ Recommend Redux/Zustand (keep state simple)  
❌ Assume I know React/Next.js patterns (explain them)  
❌ Use nested `metadata` object (data structure is flat)  
❌ Make case-sensitive status comparisons  
❌ Skip optional chaining on nested properties

---

## Development Workflow

### Starting the Servers
```bash
# Terminal 1 - Backend
cd ~/Documents/music-agent-mvp/file-handler
node server.js

# Terminal 2 - Frontend
cd ~/Documents/music-agent-mvp/frontend
npm run dev
```

### Committing Changes
```bash
# Via GitHub Desktop:
# 1. Review changes
# 2. Write descriptive commit message
# 3. Commit to main
# 4. Push to origin
```

### Testing Checklist
- [ ] Backend server running on port 3001
- [ ] Frontend dev server running on port 3000
- [ ] No console errors in browser
- [ ] Filters work correctly
- [ ] Search updates in real-time
- [ ] Statistics page shows correct data

---

## Success Metrics

### Mini-MVP 1.5 Complete When:
- [x] Search functionality working
- [x] 5-filter system implemented
- [x] BPM and Key fields added to upload form
- [x] BPM and Key saved in metadata
- [x] Statistics dashboard created
- [x] All filters correctly detect status
- [x] Buy Me a Coffee button integrated

### Next Phase Ready When:
- [ ] Used consistently for 2+ weeks
- [ ] At least 10 releases tracked with BPM/Key data
- [ ] Feedback collected via in-app button
- [ ] No major bugs preventing daily use
- [ ] Clear understanding of next most-needed features

---

## Current File Structure
```
~/Documents/music-agent-mvp/
├── file-handler/           # Backend (Node.js/Express)
│   ├── server.js          # Main API server
│   ├── package.json
│   └── node_modules/
├── frontend/              # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js          # Catalogue with search & filters
│   │   │   ├── layout.js        # Header with buttons
│   │   │   ├── stats/
│   │   │   │   └── page.js      # Statistics dashboard
│   │   │   └── releases/
│   │   │       ├── new/
│   │   │       │   └── page.js  # Upload form with BPM/Key
│   │   │       └── [releaseId]/
│   │   │           ├── page.js  # Detail page
│   │   │           └── label-deal/
│   │   │               └── page.js
│   │   ├── components/
│   │   │   ├── FeedbackButton.js
│   │   │   ├── ReleaseCard.js
│   │   │   └── ...
│   │   └── lib/
│   │       └── api.js           # API wrapper functions
│   └── package.json
└── README.md

~/Documents/Music Agent/Releases/  # Data storage
├── 2026-02-14_Artist_Track/
│   ├── audio/
│   ├── artwork/
│   ├── video/
│   └── metadata.json
└── ...
```

---

## Next Steps (See Continuation Prompt)

The system is ready for:
1. Released badge display
2. Marketing & Promo section
3. Promo deal tracking (similar to Label Deals)
4. Edit track functionality
5. Notes section
6. URL field for private links
7. BPM/Key visibility improvements

See `CONTINUATION_PROMPT_FEB_14_2026.md` for detailed implementation plan.

---

**Last Updated**: February 14, 2026 9:00 PM CET  
**Next Review**: After implementing next phase features  
**Status**: Core MVP complete, expanding to full feature set
