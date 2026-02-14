# Release Management System - Master Prompt = Feb 13 2:28am CET

## Project Overview
Personal Release Management System for electronic music releases. Built by a beginner learning to code, creating a tool for active use as an electronic music artist.

**Current Status**: Mini-MVP 1 COMPLETE ✅ | Preparing for Multi-User Deployment

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

### Management Philosophy
- **Track, don't automate**: System organizes and tracks, doesn't automate uploads
- **Local-first**: Runs entirely on local machine, no cloud dependencies (for now)
- **Real-world focused**: Built for actual artist workflows

### Data Structure
- **releaseId format**: `YYYY-MM-DD_ArtistName_TrackTitle`
- **Storage pattern**: Each release gets its own folder with `metadata.json`
- **File organization**: Audio files, artwork, and documents stored alongside metadata

---

## Completed Features (Mini-MVP 1)

### ✅ Milestone 1: File Handler (Backend Foundation)
- Express server with file upload handling
- JSON-based storage system
- Directory structure creation
- CORS configuration for frontend

### ✅ Milestone 2: Track Ingestion
- Drag-and-drop file upload
- Audio file parsing (metadata extraction)
- Artwork upload and display
- Release folder creation

### ✅ Milestone 3: Release Catalogue
- Grid view of all releases
- Artwork thumbnails
- Filter by status (All, Unsigned, Submitted, Signed)
- Release date sorting

### ✅ Milestone 4: Release Detail Page
- Complete metadata display
- File management (audio, artwork, additional files)
- Three-column layout (sidebar + two content columns)

### ✅ Mini-MVP 1: Release Dashboard
**Left Sidebar:**
- Artwork display
- Track metadata (title, artist, genre, BPM, key, label)
- Audio file player
- Additional files list
- Label deal section (for signed tracks)

**Right Column - Top:**
- Label submissions tracker
  - Add/edit/delete submissions
  - Track submission dates and status
  - Mark as signed functionality

**Right Column - Middle:**
- Platform distribution tracker
  - Add/edit/delete platform releases
  - Track release dates and URLs
  - Platform-specific metadata

**Right Column - Bottom:**
- Marketing content section (placeholder for future)
- Delete track button (with confirmation modal)

### ✅ Label Deal Management
**Label Deal Detail Page** (`/releases/{releaseId}/label-deal`)
- Multiple contact management (add/edit/delete)
- Contact fields: name, role, email, phone, location, notes
- Contract document uploads (drag & drop)
- Document management (upload/download/delete)
- CRM-ready data structure

**Features:**
- Conditional field display (only show filled fields)
- Custom delete confirmation modals (themed)
- File type support: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP
- Organized storage: `{releaseId}/label-deal/` folder

### ✅ UI/UX Enhancements
- Dark theme throughout
- Responsive design (desktop-first)
- Custom modals (no browser alerts)
- Scroll-to-top on navigation
- Semi-transparent sticky header
- Loading states and error handling

---

## API Endpoints

### Releases
- `GET /releases` - List all releases
- `GET /releases/:releaseId` - Get release details
- `POST /upload` - Upload new track
- `DELETE /releases/:releaseId` - Delete release
- `GET /releases/:releaseId/files/:filename` - Download file
- `DELETE /releases/:releaseId/files/:filename` - Delete file

### Label Submissions
- `POST /releases/:releaseId/submissions` - Add submission
- `PATCH /releases/:releaseId/submissions/:index` - Update submission
- `DELETE /releases/:releaseId/submissions/:index` - Delete submission

### Platform Distribution
- `POST /releases/:releaseId/distribution` - Add distribution entry
- `PATCH /releases/:releaseId/distribution/:index` - Update entry
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

### Release Metadata Structure
```json
{
  "releaseId": "2026-02-13_Artist_Track",
  "metadata": {
    "title": "Track Title",
    "artist": "Artist Name",
    "genre": "Melodic House",
    "bpm": 123,
    "key": "Am",
    "duration": "6:30",
    "releaseDate": "2026-03-15",
    "label": "Label Name",
    "catalogNumber": "CAT123",
    "isrc": "US-XXX-XX-XXXXX",
    "version": "Original Mix",
    "releaseFormat": "Single",
    "labelInfo": {
      "isSigned": true,
      "label": "Anjunadeep",
      "signedDate": "2026-02-13",
      "contacts": [
        {
          "id": "1234567890",
          "name": "Contact Name",
          "label": "Label Name",
          "email": "email@label.com",
          "phone": "+44 20 1234 5678",
          "location": "London, UK",
          "role": "A&R",
          "notes": "Met at ADE 2025...",
          "lastContact": null,
          "createdAt": "2026-02-13T00:00:00.000Z",
          "updatedAt": "2026-02-13T00:00:00.000Z"
        }
      ],
      "contractDocuments": [
        {
          "filename": "contract.pdf",
          "uploadedAt": "2026-02-13T00:00:00.000Z",
          "size": 123456
        }
      ]
    }
  },
  "files": {
    "audio": ["track.wav"],
    "artwork": ["cover.jpg"],
    "additional": ["stems.zip", "press-release.pdf"]
  },
  "distribution": {
    "submit": [
      {
        "label": "Label Name",
        "date": "2026-01-15",
        "status": "Pending",
        "notes": "Sent via email"
      }
    ],
    "release": [
      {
        "platform": "Spotify",
        "date": "2026-03-15",
        "url": "https://open.spotify.com/...",
        "notes": "Pre-save campaign active"
      }
    ],
    "promote": []
  },
  "createdAt": "2026-02-13T00:00:00.000Z",
  "updatedAt": "2026-02-13T00:00:00.000Z"
}
```

---

## Component Architecture

### Reusable Components
- `Modal.js` - Generic modal wrapper
- `ConfirmDeleteModal.js` - Themed delete confirmation
- `LabelContactForm.js` - Contact add/edit form
- `ScrollToTop.js` - Auto-scroll on navigation

### Page Structure
- `app/page.js` - Release catalogue (grid view)
- `app/releases/[releaseId]/page.js` - Release detail page
- `app/releases/[releaseId]/label-deal/page.js` - Label deal management
- `app/layout.js` - Root layout with header and global styles

---

## Key Learnings & Decisions

### What Worked
- **JSON storage**: Simple, portable, version-controllable
- **Component reuse**: Modal patterns saved time
- **Dark theme**: Professional look, artist-friendly
- **Local-first**: No API keys, no monthly fees, full control

### What to Avoid
- **Don't rebuild working backend** - Extend, don't replace
- **No premature optimization** - Database can wait until needed
- **Keep it simple** - Resist complex state management for now
- **Test immediately** - Small steps, run after each change

### Development Patterns
1. Show working code first, then explain why
2. Small testable steps with clear terminal commands
3. Use music production analogies for complex concepts
4. Explain "what could go wrong" scenarios
5. Complete code, not pseudocode

---

## What NOT to Do

❌ Rebuild the Express API (it works, just extend it)  
❌ Suggest database migrations (MVP uses JSON)  
❌ Recommend Redux/Zustand (keep state simple)  
❌ Assume React/Next.js knowledge (explain patterns)  
❌ Add libraries without necessity (keep dependencies minimal)  
❌ Use browser alerts (custom modals only)

---

## MVP 1 Status: COMPLETE ✅

### What's Working
- Complete track ingestion pipeline
- Full release catalogue with filtering
- Detailed release management
- Label deal tracking with multiple contacts
- Document management system
- Platform distribution tracking
- Label submission tracking
- Professional UI with dark theme

### Known Limitations
- Single-user only (local machine)
- No authentication/authorization
- No database (JSON files)
- No backup/sync mechanism
- Desktop-focused (mobile responsive but not optimized)

---

## Next Steps (Pre-Launch & MVP 2)

See `MVP1_CONTINUATION_PROMPT.md` for:
- Multi-user deployment strategy
- Feedback collection system
- Pre-launch checklist
- MVP 2 planning (CRM features)

---

## Getting Started (For New Developers)

### Prerequisites
- Node.js installed
- Basic terminal knowledge
- macOS environment

### Running the System
```bash
# Terminal 1 - Backend
cd ~/Documents/music-agent-mvp/file-handler
node server.js

# Terminal 2 - Frontend
cd ~/Documents/music-agent-mvp/frontend
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### File Structure
```
~/Documents/Music Agent/Releases/
  └── 2026-02-13_Artist_Track/
      ├── metadata.json
      ├── track.wav
      ├── cover.jpg
      └── label-deal/
          ├── contract.pdf
          └── rider.pdf
```

---

**Last Updated**: February 13, 2026  
**Version**: Mini-MVP 1 Complete  
**Status**: Ready for Multi-User Testing
```

***

## 2. Continuation Prompt for Next Steps

Create `MVP1_CONTINUATION_PROMPT.md`:

```markdown
# MVP 1 Continuation: Pre-Launch & Path to MVP 2

**Status**: Mini-MVP 1 Complete ✅  
**Current Phase**: Pre-Launch Preparation  
**Next Phase**: MVP 2 - CRM Features

---

## Immediate Next Steps

### Phase 1: Multi-User Deployment Strategy

**Goal**: Enable another household member to use the system on their MacBook.

#### Option A: Local On-Prem (Recommended for Now)
**Pros:**
- No hosting costs
- Full data privacy
- No internet dependency for core features
- Same performance as your setup

**Cons:**
- Requires setup on their machine
- No data sync between machines
- Each person has separate data

**Implementation:**
1. Clone repository to their MacBook via GitHub
2. Run `npm install` on both backend and frontend
3. Create their own `~/Documents/Music Agent/Releases/` folder
4. Start both servers locally
5. 10-minute setup process

**Best For**: Testing, learning, separate catalogues

---

#### Option B: Shared Local Network (LAN)
**Pros:**
- One central instance
- Shared data between users
- Access from any device on home WiFi
- Still no cloud costs

**Cons:**
- Your Mac must be running for them to use it
- Only works on home network
- Slight performance lag over WiFi

**Implementation:**
1. Find your Mac's local IP (`ifconfig | grep inet`)
2. Update backend CORS to allow LAN access
3. Update frontend API URL to use your IP (e.g., `http://192.168.1.100:3001`)
4. They access via `http://192.168.1.100:3000` in their browser
5. Your Mac stays on and runs the servers

**Best For**: Household collaboration, shared music catalogue

---

#### Option C: Cloud Deployment (Future)
**Pros:**
- Access from anywhere
- Professional setup
- Automatic backups
- Multi-user ready

**Cons:**
- Monthly hosting costs ($10-30/month)
- Requires deployment knowledge
- Need to add authentication
- More complex to maintain

**Options:**
- **Railway.app**: $5/month, simple deployment
- **Vercel (frontend) + Railway (backend)**: ~$10/month
- **DigitalOcean Droplet**: $6/month, full control

**Best For**: When you're ready to scale beyond household

---

### Recommendation for Now:
Start with **Option A (Local On-Prem)** because:
- MVP 1 is still in testing phase
- No cost, no complexity
- Learn what features you actually need
- Easy to migrate to cloud later when ready

---

## Phase 2: Feedback Collection System

### Feature: In-App Feedback Button

**Location**: Add to header in `app/layout.js`

**Button Design:**
```
[💬 Feedback]  (top-right corner, always visible)
```

**Feedback Form Fields:**
- Feedback Type: [Bug | Feature Request | Suggestion | Praise]
- Page/Feature: (auto-captured)
- Description: (text area)
- Priority: [Low | Medium | High]
- Optional: Email (if they want follow-up)

### Storage Options:

#### Option 1: Google Sheets (Recommended)
**Pros:**
- Free, familiar interface
- Real-time updates
- Easy to filter and sort
- Can add comments and status columns
- Share access with team

**Implementation:**
- Use Google Sheets API
- Create append-only sheet
- No authentication needed for submitting
- One-time setup with API key

**Example Sheet Structure:**
```
| Timestamp | Type | Page | Description | Priority | Status | Notes |
|-----------|------|------|-------------|----------|--------|-------|
```

---

#### Option 2: Local JSON Log
**Pros:**
- No external dependencies
- Complete privacy
- Version controlled

**Cons:**
- Manual review required
- No collaboration features
- Harder to analyze trends

**Implementation:**
- Save to `~/Documents/Music Agent/feedback.json`
- Simple append operation
- View via separate dashboard page

---

#### Option 3: Airtable
**Pros:**
- Beautiful interface
- Free tier generous
- Built-in forms
- Better than Sheets for workflows

**Cons:**
- Requires account setup
- Slight learning curve

---

### Recommendation:
**Google Sheets** - Best balance of simplicity and functionality for MVP stage.

---

## Phase 3: Pre-Launch Checklist

### Essential Before Sharing

#### 1. Error Handling Improvements
- [ ] Add try-catch to all API calls
- [ ] Show user-friendly error messages (not just alerts)
- [ ] Handle missing file scenarios gracefully
- [ ] Test with corrupted/invalid files

#### 2. Data Validation
- [ ] Validate required fields on track upload
- [ ] Prevent duplicate releaseIds
- [ ] Sanitize file names (remove special characters)
- [ ] Validate date formats

#### 3. User Experience Polish
- [ ] Add loading spinners to all async operations
- [ ] Confirm before destructive actions (already done for delete)
- [ ] Add "saved successfully" notifications
- [ ] Improve mobile responsiveness (basic testing)

#### 4. Documentation
- [ ] Create simple USER_GUIDE.md for household member
- [ ] Screenshot key workflows
- [ ] Write troubleshooting guide
- [ ] Document common error messages

#### 5. Performance
- [ ] Test with 50+ releases
- [ ] Optimize large file uploads
- [ ] Add file size warnings (e.g., >100MB)
- [ ] Test artwork loading performance

#### 6. Backup Strategy
- [ ] Document backup process for `Music Agent` folder
- [ ] Set up Time Machine for releases folder
- [ ] Consider manual export feature (ZIP all releases)

---

## Phase 4: Additional Pre-Launch Features (Optional)

### Quick Wins (1-2 hours each)

#### 1. Search Functionality
- Add search bar to catalogue page
- Filter by title, artist, label
- Real-time filtering

#### 2. Bulk Actions
- Select multiple tracks
- Bulk delete (with confirmation)
- Bulk export metadata to CSV

#### 3. Release Notes / Changelog
- Track changes to releases
- Show "last updated" prominently
- Simple activity log

#### 4. Keyboard Shortcuts
- `Ctrl+N` - New track upload
- `Esc` - Close modals
- Arrow keys - Navigate catalogue

#### 5. Dark/Light Mode Toggle
- Respect system preferences
- Manual toggle in header
- Persist choice in localStorage

---

## MVP 2 Planning: CRM Features

### Core CRM Functionality

#### 1. Contacts Dashboard (`/contacts`)
**Features:**
- Aggregate all label contacts across releases
- View by label (e.g., "All Anjunadeep contacts")
- Filter by role (A&R, Manager, Booking)
- Last contact date tracking
- Quick actions (email, call)

**Data Already Ready:**
```javascript
// Contacts are already structured for this!
{
  id, name, label, email, phone, location, role, 
  notes, lastContact, createdAt, updatedAt
}
```

#### 2. Label Relationship Tracking
- See all releases with each label
- Track submission → signed conversion rate
- Note last interaction date
- Set follow-up reminders

#### 3. Communication Log
- Log emails, calls, meetings
- Attach to specific contact or label
- Timeline view of relationship
- Integration with calendar (future)

#### 4. Pipeline Management
**Stages:**
1. Target Labels (researching)
2. Ready to Submit
3. Submitted (awaiting response)
4. In Discussion
5. Signed
6. Released

**Views:**
- Kanban board (drag releases between stages)
- List view with filters
- Analytics (conversion rates, time in stage)

#### 5. Follow-Up System
- Set reminders for follow-ups
- Track response times by label
- Flag stale submissions (>30 days no response)
- Suggest next actions

---

## Suggested Implementation Order

### Week 1: Multi-User Setup + Feedback System
1. Set up second user (household member) - Local on-prem
2. Implement feedback button and Google Sheets integration
3. Test both users simultaneously
4. Gather initial feedback

### Week 2: Pre-Launch Polish
1. Complete pre-launch checklist items
2. Improve error handling
3. Write user guide
4. Set up backup strategy

### Week 3: Quick Win Features
1. Add search functionality
2. Implement keyboard shortcuts
3. Polish mobile experience
4. Performance testing with many releases

### Week 4: MVP 2 Foundation
1. Create contacts dashboard (aggregate existing contacts)
2. Build contacts list page
3. Add contact detail page
4. Filter and search contacts

### Beyond Week 4: Full CRM
1. Communication log
2. Pipeline management (Kanban)
3. Follow-up reminders
4. Analytics dashboard

---

## Technical Decisions for MVP 2

### Database Consideration
**When to migrate from JSON to Database:**
- When you have >100 releases
- When multiple users need real-time collaboration
- When query performance becomes an issue
- When you need complex relationships

**Recommendation**: SQLite first (still local, no server needed), then PostgreSQL if going cloud.

### Authentication
**Not needed until:**
- Cloud deployment
- Sensitive financial data
- Multi-tenant system (multiple artists using same instance)

**When adding:**
- Start with simple password protection
- Use NextAuth.js (easy Next.js integration)
- Add user roles (Artist, Manager, Team)

---

## Questions to Answer Before MVP 2

1. **Data Sharing**: Should household users share the same catalogue or have separate ones?
2. **Collaboration**: Do you want real-time updates or is manual sync okay?
3. **CRM Scope**: Track only label contacts or also fans, promoters, venues?
4. **Integration**: Need calendar sync (Google Calendar), email integration (Gmail)?
5. **Mobile**: Is mobile app needed or mobile-responsive web enough?

---

## Success Metrics for MVP 1

### Before moving to MVP 2, validate:
- [ ] Used consistently for 2+ weeks
- [ ] At least 10 releases tracked
- [ ] Both household users actively using it
- [ ] Feedback collected (5+ items)
- [ ] No major bugs preventing use
- [ ] Clear understanding of what's missing for CRM needs

---

## Resources & Next Steps

### Immediate Actions:
1. **Choose deployment option** for second user
2. **Implement feedback system** (Google Sheets)
3. **Create simple user guide**
4. **Test with real workflow** for 1 week

### When Ready for MVP 2:
1. Review this document
2. Prioritize CRM features based on real usage
3. Start with contacts dashboard
4. Build iteratively based on feedback

---

**Remember**: MVP 1 is about validation. Use it, break it, learn from it. Don't rush to MVP 2 until you know exactly what you need.

---

**Next Review Date**: After 2 weeks of active use  
**Feedback Collection**: Ongoing via in-app form  
**Decision Point**: Cloud vs Local after 1 month
```

***

## Summary

I've created two comprehensive documents:

### 1. **Updated Master Prompt** (`RELEASE_MANAGEMENT_MASTER_PROMPT.md`)
- Complete system overview
- All completed features documented
- Current tech stack and architecture
- API endpoints and data schemas
- Development patterns and learnings

### 2. **Continuation Prompt** (`MVP1_CONTINUATION_PROMPT.md`)
- **Multi-user deployment options** (Local, LAN, Cloud)
- **Feedback system** design (Google Sheets recommended)
- **Pre-launch checklist** with essential tasks
- **MVP 2 CRM roadmap** with implementation timeline
- **Success metrics** before moving forward

### My Recommendations Before Shipping MVP 1:

1. **Feedback Button** (2 hours) - Essential for gathering real user input
2. **Basic Error Handling** (3 hours) - Prevent confusing crashes
3. **Simple User Guide** (1 hour) - Help household member onboard
4. **Local Setup for Second User** (30 mins) - Test multi-user scenario
5. **Backup Documentation** (30 mins) - Protect your data

**Total time**: ~7 hours to ship confidently

Ready to implement the feedback system first? 🚀✨