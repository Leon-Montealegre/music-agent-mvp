# Release Management System - Master Prompt
**Last Updated:** February 15, 2026  
**Current Status**: Phase 2A Complete ✅ - Search, Filter, Statistics, Sorting & Enhanced Metadata

---

## Project Overview
Personal Release Management System for electronic music releases. Built by a beginner learning to code, creating a tool for active use as an electronic music artist.

**Current Phase**: Phase 3 Planning - Expanding core functionality with EPs, Edit, and CRM
**Vision**: Complete release lifecycle management from production to promotion

---

## Tech Stack

### Backend
- **Framework**: Node.js/Express
- **Port**: 3001
- **Location**: `~/Documents/music-agent-mvp/file-handler/`
- **Storage**: JSON files on disk (no database for MVP)
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
1. **Release** - Platform uploads (Spotify, Beatport, Apple Music, etc.)
2. **Submit** - Label pitching and submissions
3. **Promote** - Marketing and promotional activities

### Release Status Tracking
Tracks are identified by their actual workflow state:
- **Not Submitted** - No label submissions yet
- **Submitted** - Sent to labels, awaiting response (not signed, not released)
- **Signed** - Has submission with `status: "signed"`
- **Released** - Live on platforms with `status: "Live"` or `status: "live"`
- **Promoted** - Active promo campaigns

**Key Rule**: Tracks can be BOTH Signed AND Released simultaneously

### Management Philosophy
- **Track, don't automate**: System organizes and tracks, doesn't automate uploads
- **Local-first MVP**: Runs entirely on local machine, no cloud dependencies (for now)
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
- Grid view of all releases (5 per row on large screens)
- Artwork thumbnails with fallback vinyl SVG
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
- **Sorting System**:
  - Date (Newest/Oldest)
  - Track Name (A-Z)
  - Artist Name (A-Z)
  - Genre (A-Z)
  - BPM (Low-High/High-Low)
  - Key (Chromatic order)
  - # of Releases
  - # of Submissions
  - Ascending/Descending toggle
- Track count display (filtered vs total)
- Responsive grid layout

#### Milestone 4: Release Detail Page
- Complete metadata display (including BPM and Key)
- File management (audio, artwork, additional files)
- Three-column layout (sidebar + two content columns)
- Audio player
- Status badges (Signed, Submitted, Released)
- **Metadata display on cards**:
  - Genre (purple tag)
  - BPM (⚡ icon)
  - Key (🎹 icon)

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

### ✅ Phase 2A: UI/UX & Quick Wins

#### UI/UX Enhancements
- Dark theme throughout
- Responsive design (mobile-first grid)
- Custom modals (no browser alerts)
- Scroll-to-top on navigation
- Semi-transparent sticky header with blur
- Loading states and error handling
- **Updated Header**:
  - Logo (left)
  - Feedback button (gray)
  - Statistics button (blue, on catalogue page)
  - Buy Me a Coffee button (orange)

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

## 🚧 In Progress / Planned Features

### Phase 2B: Edit Functionality (Next Up)
See Phase 3 Continuation Prompt

### Phase 2C: Marketing & Promo System
See Phase 3 Continuation Prompt

### Phase 3: Core Expansion (Weeks 1-4)
**Status**: Planning Complete ✅

#### EP/Album Management
- Create multi-track collections (EPs, Albums)
- Group singles into releases
- Collection-level artwork and metadata
- Tracklist ordering
- Submit/Release entire collections
- Individual track independence maintained

#### Edit Track Functionality
- Update all metadata fields
- Fix typos and errors
- Change BPM/Key after analysis
- Update production dates
- Modify genre classifications
- Cannot change releaseId (maintains file structure)

#### Contact Relationship Management (CRM)
- **Centralized Contacts**:
  - Labels (A&R, label owners)
  - Playlist Curators (Spotify, Apple Music)
  - Promoters & PR Agencies
  - Radio Stations & DJs
  - Collaborators (vocalists, producers, remixers)
  - Media Contacts (blogs, magazines, podcasts)

- **Contact Fields**:
  - Basic: Name, company, role, email, phone
  - Professional: Genres, preferred contact method, social media
  - Intelligence: Response rate, success rate, avg response time
  - Relationship: Strength (cold/warm/hot), last contact date, notes
  - History: All submissions, releases, collaborations

- **Statistics & Insights**:
  - Track response rates per contact
  - Success rates (accepted/rejected)
  - Average response time
  - Tracks playlisted (for curators)
  - Tracks released (for labels)
  - Collaboration history

- **Integration**:
  - Link contacts to label submissions
  - Link contacts to platform releases
  - Auto-populate statistics from interactions
  - Timeline view of all contact interactions

#### Marketing & Promo Tracking
- Add promo deals (SoundCloud Premiere, blog features, radio play)
- Track promo status and dates
- Promoted badge on tracks
- Promo detail page with contacts and documents
- Marketing content storage
- Completes 3-path distribution model

#### Optional: Platform Upload APIs
- SoundCloud private upload automation
- YouTube private video uploads
- Auto-store private links
- One-click promo link generation
- *Note: Exploratory - may not be worth API complexity*

---

## 📋 Future Phases (Medium-Term Roadmap)

### Phase 4: Professional Workflow (Months 2-3)

#### Advanced Distribution
- **Batch Operations**:
  - Submit multiple tracks to same label
  - Schedule releases across platforms
  - Bulk status updates
- **Release Calendar**:
  - Visual calendar view of releases
  - Scheduled releases timeline
  - Deadline reminders
- **Template System**:
  - Save submission templates
  - Platform distribution presets
  - Promo campaign templates

#### Analytics Integration
- **Streaming Platform Stats**:
  - Spotify for Artists API integration
  - Apple Music for Artists
  - Beatport stats import
  - SoundCloud statistics
- **Performance Tracking**:
  - Streams per track
  - Revenue per platform
  - Geographic performance
  - Playlist adds tracking
- **Dashboard Widgets**:
  - Top performing tracks
  - Revenue trends
  - Growth metrics
  - Engagement rates

#### Financial Management
- **Revenue Tracking**:
  - Platform earnings import
  - Label advance tracking
  - Royalty split calculations
  - Payment status tracking
- **Expense Management**:
  - Production costs per track
  - Mastering/mixing expenses
  - Artwork/design costs
  - Marketing spend tracking
- **Reports**:
  - Profit/loss per release
  - ROI calculations
  - Tax preparation exports
  - Quarterly earnings summaries

### Phase 5: Collaboration & Automation (Months 3-4)

#### Team Collaboration
- **Multi-User Support**:
  - Manager accounts
  - Label team access
  - Accountant view (read-only financials)
  - PR agency collaboration
- **Permissions System**:
  - Role-based access control
  - View vs edit permissions
  - Financial data restrictions
- **Activity Feed**:
  - Track changes by user
  - Collaboration timeline
  - Comment system on releases

#### Contract Management
- **Contract Storage**:
  - Upload and organize contracts
  - Link to specific releases
  - Expiration date tracking
  - Renewal reminders
- **Contract Templates**:
  - Standard agreement templates
  - Collaboration split agreements
  - Remix agreements
  - Licensing templates
- **E-Signature Integration** (future):
  - DocuSign/HelloSign integration
  - Send for signature
  - Track signature status

#### Sample & Asset Library
- **Sample Management**:
  - Upload sample packs
  - Tag and categorize samples
  - Search by BPM/Key/Type
  - Link samples used in tracks
- **Preset Library**:
  - Store synth presets
  - Organize by synth type
  - Tag and search presets
- **Project Files**:
  - Store DAW project files
  - Link to finished tracks
  - Version control
  - Stems storage

### Phase 6: Mobile & Cloud (Months 4-6)

#### Mobile App
- **React Native App**:
  - iOS and Android support
  - View releases on mobile
  - Quick status updates
  - Photo/video upload from phone
- **Mobile-Specific Features**:
  - Push notifications for deadlines
  - Quick voice notes
  - Location-based reminders
  - Offline mode

#### Cloud Deployment
- **Backend Hosting**:
  - Railway/Render deployment
  - Database migration (PostgreSQL)
  - File storage (AWS S3/Cloudflare R2)
  - Automatic backups
- **Frontend Hosting**:
  - Vercel deployment
  - CDN optimization
  - Global edge network
- **Security**:
  - User authentication (Auth0/Clerk)
  - Encrypted file storage
  - HTTPS everywhere
  - API rate limiting

#### Sync & Backup
- **Automatic Sync**:
  - Real-time cloud sync
  - Conflict resolution
  - Version history
- **Backup System**:
  - Daily automated backups
  - Point-in-time recovery
  - Export full data archive
  - Disaster recovery plan

---

## 🔮 Long-Term Vision (6+ Months)

### Advanced AI Features
- **Content Generation**:
  - AI-generated social media captions
  - Press release drafting
  - Email pitch templates
  - Bio generation
- **Smart Suggestions**:
  - Label matching based on genre/style
  - Optimal release timing
  - Pricing recommendations
  - Promotion strategy suggestions
- **Trend Analysis**:
  - Genre popularity tracking
  - BPM/Key trend analysis
  - Release pattern insights

### Industry Integrations
- **Direct Platform Integration**:
  - Submit directly to labels via API
  - One-click distribution to stores
  - Automated promo sending
- **Music Services**:
  - DistroKid/CD Baby integration
  - Mastering service integration
  - Artwork generation tools
  - Copyright registration automation
- **Social Media**:
  - Instagram/TikTok scheduled posts
  - Auto-post release announcements
  - Track performance on social

### Professional Features
- **Publishing Management**:
  - Track publishing rights
  - PRO (ASCAP/BMI) integration
  - Royalty split tracking
  - Co-writer management
- **Tour Integration**:
  - Link tracks to live sets
  - Setlist management
  - Performance tracking
  - Tour dates calendar
- **Merchandise**:
  - Track merch production
  - Inventory management
  - Sales tracking
  - Link to releases

### Marketplace Features
- **Community**:
  - Artist collaboration matching
  - Remix opportunity board
  - Session musician directory
- **Services Marketplace**:
  - Find mastering engineers
  - Artwork designers
  - Mixing engineers
  - PR agencies
- **Licensing**:
  - License tracks for sync
  - Film/TV placement tracking
  - License fee management

---

## API Endpoints

### Releases
- `GET /releases` - List all releases (returns `{ success: true, count: N, releases: [...] }`)
- `GET /releases/:releaseId` - Get release details
- `POST /upload` - Upload new track (accepts query params: releaseId, artist, title, genre, bpm, key)
- `PATCH /releases/:releaseId/metadata` - Update track metadata (NEW in Phase 3)
- `DELETE /releases/:releaseId` - Delete release
- `GET /releases/:releaseId/files/:filename` - Download file
- `DELETE /releases/:releaseId/files/:filename` - Delete file

### Collections (NEW in Phase 3)
- `POST /collections` - Create EP/Album
- `GET /collections` - List all collections
- `GET /collections/:collectionId` - Get collection details
- `PATCH /collections/:collectionId` - Update collection
- `DELETE /collections/:collectionId` - Delete collection
- `POST /collections/:collectionId/tracks` - Add track to collection
- `DELETE /collections/:collectionId/tracks/:trackReleaseId` - Remove track

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

### Contacts (NEW in Phase 3)
- `POST /contacts` - Create contact
- `GET /contacts` - List all contacts
- `GET /contacts/:contactId` - Get contact details
- `PATCH /contacts/:contactId` - Update contact
- `DELETE /contacts/:contactId` - Delete contact
- `GET /contacts/type/:type` - Filter by type
- `GET /contacts/search?q=query` - Search contacts
- `POST /contacts/:contactId/interactions` - Log interaction

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
  "privateUrl": "https://soundcloud.com/artist/track/s-xxxxx",
  "privateUrlNote": "Private link for promo",
  "versionCount": 1,
  "fileCounts": {
    "audio": 1,
    "artwork": 1,
    "video": 0
  },
  "partOfCollection": {
    "collectionId": "2026-02-15_Artist_SummerEP",
    "collectionType": "EP",
    "trackOrder": 1
  },
  "distribution": {
    "submit": [
      {
        "label": "Label Name",
        "platform": "Email",
        "status": "Submitted",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "notes": "Sent via email",
        "contactId": "contact_uuid_123"
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
    "promote": [
      {
        "promoType": "SoundCloud Premiere",
        "status": "Live",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "contactId": "contact_uuid_456"
      }
    ]
  }
}
```

### Collection (EP/Album) Metadata (NEW)
```json
{
  "releaseId": "2026-02-15_Artist_SummerEP",
  "collectionType": "EP",
  "title": "Summer EP",
  "artist": "Artist Name",
  "genre": "Progressive House",
  "releaseDate": "2026-06-01",
  "tracks": [
    {
      "trackReleaseId": "2026-02-14_Artist_TrackA",
      "trackOrder": 1,
      "title": "Track A"
    },
    {
      "trackReleaseId": "2026-02-14_Artist_TrackB",
      "trackOrder": 2,
      "title": "Track B"
    }
  ],
  "fileCounts": {
    "artwork": 1,
    "audio": 0
  },
  "distribution": {
    "submit": [],
    "release": [],
    "promote": []
  }
}
```

### Contact Schema (NEW)
```json
{
  "contactId": "contact_uuid_12345",
  "name": "John Doe",
  "type": "label",
  "company": "Record Label XYZ",
  "role": "A&R Manager",
  "email": "john@label.com",
  "phone": "+1 555 1234",
  "location": "Los Angeles, CA",
  "genres": ["Progressive House", "Melodic Techno"],
  "preferredContact": "email",
  "socialMedia": {
    "instagram": "@labelxyz",
    "twitter": "@labelxyz"
  },
  "notes": "Loves 126 BPM tracks. Responds within 2 weeks usually.",
  "relationshipStrength": "warm",
  "lastContact": "2026-02-10",
  "addedDate": "2026-01-15",
  "tags": ["melodic", "quick-response", "us-based"],
  "statistics": {
    "totalSubmissions": 5,
    "accepted": 2,
    "responseRate": "40%",
    "avgResponseTime": "14 days",
    "tracksPlaylisted": 3,
    "tracksReleased": 2
  },
  "relatedReleases": [
    {
      "releaseId": "2026-02-14_Artist_Track",
      "interaction": "submitted",
      "date": "2026-02-14",
      "outcome": "signed"
    }
  ]
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

// Promoted: Any promo with status "live" (case-insensitive)
const isPromoted = distribution?.promote?.some(
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
- `app/page.js` - Release catalogue with search, filters & sorting
- `app/releases/new/page.js` - Upload new track form
- `app/releases/[releaseId]/page.js` - Release detail page
- `app/releases/[releaseId]/label-deal/page.js` - Label deal management
- `app/collections/new/page.js` - Create EP/Album (NEW)
- `app/collections/[collectionId]/page.js` - EP/Album detail (NEW)
- `app/contacts/page.js` - Contacts list & CRM (NEW)
- `app/contacts/[contactId]/page.js` - Contact detail (NEW)
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
- **Local-first MVP**: No API keys, no monthly fees, full control
- **Case-insensitive status checks**: Handles "Live", "live", "LIVE" all the same
- **Real-time filtering**: Immediate feedback as user types
- **Flexible sorting**: Multiple sort options with direction toggle
- **Visual metadata**: Genre/BPM/Key visible on cards for quick scanning

### What to Avoid
- **Don't rebuild working backend** - Extend, don't replace
- **No premature optimization** - Database can wait until needed
- **Keep it simple** - Resist complex state management for now
- **Test immediately** - Small steps, run after each change
- **Don't assume data structure** - Always inspect actual API responses first
- **Avoid over-automation early** - Focus on tracking before automation

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
- **Forgetting mobile responsiveness**: Test on different screen sizes

---

## Filter & Sort System Details

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

### Sorting System
**9 Sort Options**:
1. Date (Newest First) - Default
2. Date (Oldest First)
3. Track Name (A-Z / Z-A)
4. Artist Name (A-Z / Z-A)
5. Genre (A-Z / Z-A)
6. BPM (Low-High / High-Low)
7. Key (Chromatic order)
8. # of Releases (Low-High / High-Low)
9. # of Submissions (Low-High / High-Low)

**Direction Toggle**: Ascending ↑ / Descending ↓ (except for date sorts which have built-in direction)

---

## What NOT to Do

❌ Rebuild the Express API (it works, just extend it)  
❌ Suggest database migrations (MVP uses JSON)  
❌ Recommend Redux/Zustand (keep state simple)  
❌ Assume I know React/Next.js patterns (explain them)  
❌ Use nested `metadata` object (data structure is flat)  
❌ Make case-sensitive status comparisons  
❌ Skip optional chaining on nested properties  
❌ Add complex libraries without clear benefit  
❌ Implement features before validating need

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
- [ ] Sorting changes display order
- [ ] Statistics page shows correct data
- [ ] Responsive on different screen sizes

---

## Success Metrics

### Phase 2A Complete ✅
- [x] Search functionality working
- [x] 5-filter system implemented
- [x] BPM and Key fields added to upload form
- [x] BPM and Key saved in metadata
- [x] Statistics dashboard created
- [x] All filters correctly detect status
- [x] Buy Me a Coffee button integrated
- [x] Sorting system with 9 options
- [x] Genre/BPM/Key visible on cards
- [x] 5-column grid on large screens

### Phase 3 Goals
- [ ] Edit track functionality complete
- [ ] EP/Album management working
- [ ] Contact CRM implemented
- [ ] Marketing & Promo tracking functional
- [ ] Used consistently for 3+ weeks
- [ ] At least 20 releases tracked
- [ ] Multiple EPs created and managed
- [ ] CRM has 10+ industry contacts

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
│   │   │   ├── page.js          # Catalogue with search, filters & sorting
│   │   │   ├── layout.js        # Header with buttons
│   │   │   ├── stats/
│   │   │   │   └── page.js      # Statistics dashboard
│   │   │   ├── contacts/        # NEW in Phase 3
│   │   │   │   ├── page.js      # Contacts list
│   │   │   │   └── [contactId]/
│   │   │   │       └── page.js  # Contact detail
│   │   │   ├── collections/     # NEW in Phase 3
│   │   │   │   ├── new/
│   │   │   │   │   └── page.js  # Create EP/Album
│   │   │   │   └── [collectionId]/
│   │   │   │       └── page.js  # EP/Album detail
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
├── 2026-02-15_Artist_SummerEP/    # NEW: Collection folder
│   ├── artwork/
│   └── metadata.json
└── ...

~/Documents/Music Agent/Contacts/  # NEW in Phase 3
└── contacts.json
```

---

## Next Steps

### Immediate (Phase 3)
See `PHASE_3_CONTINUATION_PROMPT_FEB_15_2026.md` for:
1. Edit Track Functionality
2. EP/Album Management
3. Contact Relationship Management (CRM)
4. Marketing & Promo System
5. Optional: Platform Upload APIs

### Medium-Term (Phase 4-6)
- Advanced analytics integration
- Financial tracking and reporting
- Team collaboration features
- Contract management
- Sample/asset library
- Mobile app development
- Cloud deployment

### Long-Term Vision
- AI-powered suggestions
- Industry platform integrations
- Publishing and royalty management
- Tour and performance tracking
- Merchandise management
- Community and marketplace features

---

## Feature Request Process

### When You Have an Idea:
1. **Use Feedback Button** - Submit via in-app feedback
2. **Document Use Case** - Why do you need this?
3. **Try Workaround First** - Can current features handle it?
4. **Validate Need** - Use for 2+ weeks before implementing

### Priority Evaluation:
- **High**: Blocks daily workflow or prevents data entry
- **Medium**: Improves efficiency or adds tracking capability
- **Low**: Nice to have, cosmetic, or niche use case

### Implementation Order:
1. Core tracking features (EPs, Edit, CRM)
2. Workflow improvements (batch ops, templates)
3. Analytics and insights
4. Automation and integrations
5. Advanced/experimental features

---

**Last Updated**: February 15, 2026  
**Next Review**: After Phase 3 completion (Edit + EPs + CRM)  
**Status**: Phase 2A Complete ✅, Phase 3 Planning Complete ✅  
**See Also**: `PHASE_3_CONTINUATION_PROMPT_FEB_15_2026.md` for detailed implementation guide
