# Release Management System - Master Prompt

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
Component Architecture
Reusable Components
Modal.js - Generic modal wrapper

ConfirmDeleteModal.js - Themed delete confirmation

LabelContactForm.js - Contact add/edit form

ScrollToTop.js - Auto-scroll on navigation

Page Structure
app/page.js - Release catalogue (grid view)

app/releases/[releaseId]/page.js - Release detail page

app/releases/[releaseId]/label-deal/page.js - Label deal management

app/layout.js - Root layout with header and global styles

Key Learnings & Decisions
What Worked
JSON storage: Simple, portable, version-controllable

Component reuse: Modal patterns saved time

Dark theme: Professional look, artist-friendly

Local-first: No API keys, no monthly fees, full control

What to Avoid
Don't rebuild working backend - Extend, don't replace

No premature optimization - Database can wait until needed

Keep it simple - Resist complex state management for now

Test immediately - Small steps, run after each change

Development Patterns
Show working code first, then explain why

Small testable steps with clear terminal commands

Use music production analogies for complex concepts

Explain "what could go wrong" scenarios

Complete code, not pseudocode

What NOT to Do
❌ Rebuild the Express API (it works, just extend it)
❌ Suggest database migrations (MVP uses JSON)
❌ Recommend Redux/Zustand (keep state simple)
❌ Assume React/Next.js knowledge (explain patterns)
❌ Add libraries without necessity (keep dependencies minimal)
❌ Use browser alerts (custom modals only)

MVP 1 Status: COMPLETE ✅
What's Working
Complete track ingestion pipeline

Full release catalogue with filtering

Detailed release management

Label deal tracking with multiple contacts

Document management system

Platform distribution tracking

Label submission tracking

Professional UI with dark theme

Known Limitations
Single-user only (local machine)

No authentication/authorization

No database (JSON files)

No backup/sync mechanism

Desktop-focused (mobile responsive but not optimized)

Next Steps (Pre-Launch & MVP 2)
See MVP1_CONTINUATION_PROMPT.md for:

Multi-user deployment strategy

Feedback collection system

Pre-launch checklist

MVP 2 planning (CRM features)

Getting Started (For New Developers)
Prerequisites
Node.js installed

Basic terminal knowledge

macOS environment

Running the System
bash
# Terminal 1 - Backend
cd ~/Documents/music-agent-mvp/file-handler
node server.js

# Terminal 2 - Frontend
cd ~/Documents/music-agent-mvp/frontend
npm run dev
Access Points
Frontend: http://localhost:3000

Backend API: http://localhost:3001

File Structure
text
~/Documents/Music Agent/Releases/
  └── 2026-02-13_Artist_Track/
      ├── metadata.json
      ├── track.wav
      ├── cover.jpg
      └── label-deal/
          ├── contract.pdf
          └── rider.pdf
Last Updated: February 13, 2026
Version: Mini-MVP 1 Complete
Status: Ready for Multi-User Testing