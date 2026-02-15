# Continuation Prompt - Phase 3 Features
**Date**: February 15, 2026  
**Status**: Phase 2A Complete → Expanding Core Functionality  
**Duration**: 3-4 weeks (depending on pace)

---

## 📋 Overview of Phase 3

This phase focuses on **core functionality expansion** that fundamentally improves how you manage releases:
1. **EP/Album Management** - Group singles into collections
2. **Edit Track Functionality** - Update existing track data
3. **Contact Relationship Management (CRM)** - Track all music industry contacts
4. **Marketing & Promo System** - Full promotional tracking (from Phase 2C)
5. **Platform Upload APIs** - SoundCloud/YouTube automation (exploratory)

**Philosophy**: Build features you'll use daily, not just "nice to have"

---

## 🎯 Feature Priority List

### **TIER 1: Essential (Week 1-2)** 
Must-have features that unlock core workflows

1. **Edit Track Functionality** (6-8 hours)
   - Why first: You WILL make mistakes, need to fix metadata
   - Impact: Daily use, prevents data lock-in
   
2. **EP/Album Management** (8-10 hours)
   - Why second: Changes how releases are organized
   - Impact: Professional workflow, proper release grouping

### **TIER 2: High Value (Week 2-3)**
Major features that add significant value

3. **Contact Relationship Management (CRM)** (10-12 hours)
   - Why third: Centralize all industry contacts
   - Impact: Track relationships, improve pitching success
   
4. **Marketing & Promo System** (8-10 hours)
   - Why fourth: Complete the 3-path tracking
   - Impact: Full release lifecycle management

### **TIER 3: Enhancement (Week 3-4)**
Nice-to-have features for power users

5. **SoundCloud Private Upload API** (4-6 hours)
   - Why later: Optional automation, not core tracking
   - Impact: Saves time on private link generation
   
6. **YouTube Private Upload API** (4-6 hours)
   - Why later: Similar to SoundCloud, nice automation
   - Impact: Video promo automation

---

## 📝 Detailed Feature Specifications

---

## 1. Edit Track Functionality (6-8 hours)

### Goal
Allow editing of all metadata fields for existing tracks without re-uploading files

### Why This Matters
- Fix typos in track names
- Update BPM/Key after analysis
- Change genre classification
- Correct artist name spelling
- Update production dates

### Implementation Plan

#### 1A. Backend Changes (2-3 hours)

**New Endpoint**: `PATCH /releases/:releaseId/metadata`

```javascript
// In server.js
app.patch('/releases/:releaseId/metadata', async (req, res) => {
  const { releaseId } = req.params
  const updates = req.body // { artist, title, genre, bpm, key, etc. }
  
  // Load existing metadata
  // Merge updates with existing data
  // Validate required fields
  // Save updated metadata
  // Return updated release
})
```

**Editable Fields**:
- Artist name
- Track title
- Genre
- BPM
- Key
- Production date
- Format (Single/EP/Album/Remix)
- Private URL and note
- Any custom metadata

**Important**: Cannot change `releaseId` (would break file structure)

#### 1B. Frontend - Edit Button (1 hour)

**Location**: Detail page (`/releases/[releaseId]/page.js`)

Add edit button in metadata sidebar:
```
┌─────────────────────────────────┐
│ 🎵 Track Metadata               │
├─────────────────────────────────┤
│ Title: Track Name               │
│ Artist: Artist Name             │
│ Genre: Progressive House        │
│ BPM: 126                        │
│ Key: A minor                    │
│                                 │
│ [✏️ Edit Metadata]             │ ← NEW BUTTON
└─────────────────────────────────┘
```

#### 1C. Frontend - Edit Form Modal (3-4 hours)

**Modal Design**:
```
┌──────────────────────────────────────────────┐
│ ✏️ Edit Track Metadata                      │
├──────────────────────────────────────────────┤
│                                              │
│ Track Title:                                 │
│ [Current Track Name___________________]      │
│                                              │
│ Artist Name:                                 │
│ [Current Artist___________________________]  │
│                                              │
│ Genre:                                       │
│ [Progressive House▾]                         │
│                                              │
│ BPM:                                         │
│ [126] (60-200)                               │
│                                              │
│ Key:                                         │
│ [A minor▾]                                   │
│                                              │
│ Production Date:                             │
│ [2026-02-14]                                 │
│                                              │
│ Format:                                      │
│ [○ Single ○ EP ○ Album ○ Remix]             │
│                                              │
│ Private URL (optional):                      │
│ [https://soundcloud.com/...]                │
│                                              │
│ Private URL Note:                            │
│ [For promo use]                              │
│                                              │
│         [Cancel]  [Save Changes]             │
└──────────────────────────────────────────────┘
```

**Features**:
- Pre-filled with current values
- Same validation as upload form
- Shows what changed before saving
- Confirmation message on success
- Updates UI immediately after save

#### Implementation Steps

1. **Backend**:
   - Create `PATCH /releases/:releaseId/metadata` endpoint
   - Load existing metadata from JSON
   - Merge new values with existing
   - Validate required fields
   - Save and return updated metadata

2. **Frontend**:
   - Add "Edit Metadata" button to detail page
   - Create `EditMetadataModal.js` component
   - Pre-fill form with current values
   - Handle form submission
   - Update UI on success
   - Show success message

3. **Testing**:
   - Edit each field individually
   - Edit multiple fields at once
   - Cancel without saving
   - Verify changes persist after page reload
   - Check that releaseId doesn't change

#### Acceptance Criteria
- [ ] Edit button visible on detail page
- [ ] Modal opens with current values pre-filled
- [ ] Can edit all metadata fields
- [ ] Changes save to metadata.json
- [ ] UI updates immediately
- [ ] releaseId never changes
- [ ] Cancel button works without saving
- [ ] Success message shows after save

---

## 2. EP/Album Management (8-10 hours)

### Goal
Group single tracks into EPs and Albums for proper release management

### Why This Matters
- Manage multi-track releases (EPs, albums)
- Track artwork applies to all tracks in collection
- Submit entire EP to labels
- Release entire album across platforms
- See collection view and individual track view

### Concept Explanation

**Current State**: Each track is independent
```
Single: "Track A" → uploaded separately
Single: "Track B" → uploaded separately
Single: "Track C" → uploaded separately
```

**After EP Feature**:
```
EP: "Summer EP" 
  ├─ Track A (part of EP)
  ├─ Track B (part of EP)
  └─ Track C (part of EP)
  
OR keep as singles:
Single: "Track A" (standalone)
```

**Key Rules**:
- A track can be EITHER a Single OR part of an EP/Album
- EPs have their own artwork (cover art)
- EP metadata: title, artist, release date, tracklist order
- Individual tracks keep their own metadata (BPM, Key, etc.)
- Submitting an EP submits all tracks together
- Releasing an EP creates platform entries for the collection

### Data Structure

**EP Metadata** (`metadata.json` at EP level):
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

**Individual Track** (tracks still have their own metadata):
```json
{
  "releaseId": "2026-02-14_Artist_TrackA",
  "title": "Track A",
  "artist": "Artist Name",
  "bpm": 126,
  "key": "A minor",
  "partOfCollection": {
    "collectionId": "2026-02-15_Artist_SummerEP",
    "collectionType": "EP",
    "trackOrder": 1
  },
  "distribution": {
    // Track can have its own distribution too (single release)
  }
}
```

### Implementation Plan

#### 2A. Backend Changes (3-4 hours)

**New Endpoints**:
```javascript
POST   /collections              // Create EP/Album
GET    /collections              // List all EPs/Albums
GET    /collections/:collectionId  // Get EP details
PATCH  /collections/:collectionId  // Update EP metadata
DELETE /collections/:collectionId  // Delete EP
POST   /collections/:collectionId/tracks  // Add track to EP
DELETE /collections/:collectionId/tracks/:trackReleaseId  // Remove track
```

**Storage Structure**:
```
~/Documents/Music Agent/Releases/
├── 2026-02-15_Artist_SummerEP/       ← EP folder
│   ├── metadata.json                 ← EP metadata
│   └── artwork/
│       └── cover.jpg                 ← EP artwork
├── 2026-02-14_Artist_TrackA/         ← Individual track
│   ├── metadata.json                 ← Track metadata (links to EP)
│   └── audio/
└── 2026-02-14_Artist_TrackB/
    ├── metadata.json
    └── audio/
```

#### 2B. Frontend - Create EP Flow (2-3 hours)

**New Page**: `/collections/new/page.js`

**UI**:
```
┌────────────────────────────────────────────┐
│ Create New EP/Album                        │
├────────────────────────────────────────────┤
│                                            │
│ Collection Type:                           │
│ [○ EP  ○ Album]                           │
│                                            │
│ Collection Title:                          │
│ [Summer EP___________________________]     │
│                                            │
│ Artist Name:                               │
│ [Artist Name_________________________]     │
│                                            │
│ Genre:                                     │
│ [Progressive House▾]                       │
│                                            │
│ Release Date:                              │
│ [2026-06-01]                               │
│                                            │
│ Artwork:                                   │
│ [Drop artwork or click to browse]         │
│                                            │
│ Add Tracks:                                │
│ ┌─────────────────────────────────────┐   │
│ │ Select from uploaded singles:       │   │
│ │ [ ] Track A (126 BPM, A minor)     │   │
│ │ [ ] Track B (128 BPM, G major)     │   │
│ │ [ ] Track C (130 BPM, D minor)     │   │
│ └─────────────────────────────────────┘   │
│                                            │
│ Or upload new tracks:                      │
│ [+ Upload New Track]                       │
│                                            │
│         [Cancel]  [Create EP]              │
└────────────────────────────────────────────┘
```

#### 2C. Frontend - EP Detail Page (2-3 hours)

**New Page**: `/collections/[collectionId]/page.js`

**Layout**: Similar to track detail page, but shows:
- EP artwork (large)
- EP metadata
- Tracklist with drag-to-reorder
- Distribution tracking (submit EP, release EP)
- Each track is clickable to view individual track details

**UI**:
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌─────────────┐   Summer EP                        │
│  │             │   Artist Name                       │
│  │   EP Art    │   Progressive House • 3 tracks      │
│  │             │                                     │
│  └─────────────┘   Release Date: June 1, 2026       │
│                                                      │
│  Tracklist:                                          │
│  ──────────                                          │
│  1. Track A (126 BPM, A minor)  [View Track]        │
│  2. Track B (128 BPM, G major)  [View Track]        │
│  3. Track C (130 BPM, D minor)  [View Track]        │
│                                                      │
│  [+ Add Track to EP]  [✏️ Edit EP Info]            │
│                                                      │
│  📤 Label Submissions                                │
│  ────────────────────                                │
│  • Label Name - Submitted (Feb 15, 2026)            │
│  [+ Submit EP to Label]                              │
│                                                      │
│  📱 Platform Distribution                            │
│  ─────────────────────────                           │
│  • Spotify - Live (June 1, 2026)                    │
│  [+ Release EP on Platform]                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 2D. Homepage Integration (1 hour)

**Changes to Catalogue Page**:
- Show both singles AND EPs/Albums in grid
- EP cards look different (show "EP" badge, track count)
- Filter: "Singles" vs "EPs" vs "Albums" vs "All"

**EP Card Design**:
```
┌─────────────────────┐
│                     │
│     EP Artwork      │
│                     │
├─────────────────────┤
│ Summer EP           │
│ Artist Name         │
│ [EP Badge] 3 tracks │
│                     │
│ 0 platforms         │
│ 1 submission        │
└─────────────────────┘
```

#### Implementation Steps

1. **Backend** (3-4 hours):
   - Create collection endpoints
   - Implement EP/Album metadata storage
   - Create track-to-collection linking
   - Handle artwork uploads for collections
   - Update track metadata when added to collection

2. **Frontend - Create EP** (2 hours):
   - Create EP creation form
   - Allow selecting existing tracks OR uploading new
   - Handle artwork upload
   - Save EP metadata

3. **Frontend - EP Detail Page** (2-3 hours):
   - Display EP metadata and artwork
   - Show tracklist with links to individual tracks
   - Allow adding/removing tracks
   - Distribution tracking for EP as whole

4. **Frontend - Homepage** (1 hour):
   - Add EP cards to grid
   - Add Singles/EPs/Albums filter
   - Differentiate visually between singles and collections

#### Acceptance Criteria
- [ ] Can create new EP/Album
- [ ] Can add existing tracks to EP
- [ ] Can upload new tracks directly to EP
- [ ] EP detail page shows all tracks
- [ ] Can click through to individual track pages
- [ ] Can submit EP to labels
- [ ] Can release EP on platforms
- [ ] Homepage shows both singles and EPs
- [ ] Filter works for Singles/EPs/Albums
- [ ] Track metadata shows which EP it belongs to

---

## 3. Contact Relationship Management (CRM) (10-12 hours)

### Goal
Centralized contact management for ALL music industry relationships

### Why This Matters
**Current Problem**: Contacts scattered across:
- Label deal pages (only shows contacts for that ONE label deal)
- Your email/phone/notes app
- No view of ALL labels you've worked with
- No tracking of playlist curators, promoters, DJs

**After CRM**: One place to see:
- All labels and their contact info
- Response rates and submission history
- Playlist curators and playlisting success
- Promoters, PR agencies, radio stations
- Collaborators (vocalists, producers)
- Media contacts (blogs, magazines)

### Use Cases

**As a musician, I want to**:
1. See ALL labels I've submitted to (across all tracks)
2. Track which labels respond quickly vs ignore me
3. Remember which playlist curators added my tracks
4. Store contact info for promoters I work with
5. See collaboration history with other artists
6. Never lose a valuable industry contact

### Data Structure

**Contact Entity**:
```json
{
  "contactId": "contact_uuid_12345",
  "name": "John Doe",
  "type": "label", // label, curator, promoter, collaborator, media, other
  "company": "Record Label XYZ",
  "role": "A&R Manager",
  "email": "john@label.com",
  "phone": "+1 555 1234",
  "location": "Los Angeles, CA",
  "genres": ["Progressive House", "Melodic Techno"],
  "preferredContact": "email", // email, phone, instagram, etc.
  "socialMedia": {
    "instagram": "@labelxyz",
    "twitter": "@labelxyz"
  },
  "notes": "Loves 126 BPM tracks. Responds within 2 weeks usually.",
  "relationshipStrength": "warm", // cold, warm, hot
  "lastContact": "2026-02-10",
  "addedDate": "2026-01-15",
  "tags": ["melodic", "quick-response", "us-based"],
  "statistics": {
    "totalSubmissions": 5,
    "accepted": 2,
    "responseRate": "40%",
    "avgResponseTime": "14 days",
    "tracksPlaylist": 3, // for curators
    "tracksReleased": 2 // for labels
  },
  "relatedReleases": [
    {
      "releaseId": "2026-02-14_Artist_Track",
      "interaction": "submitted", // submitted, signed, playlisted, released, collaborated
      "date": "2026-02-14",
      "outcome": "signed"
    }
  ]
}
```

### Implementation Plan

#### 3A. Backend - Contact Endpoints (4-5 hours)

```javascript
POST   /contacts                    // Create contact
GET    /contacts                    // List all contacts
GET    /contacts/:contactId         // Get contact details
PATCH  /contacts/:contactId         // Update contact
DELETE /contacts/:contactId         // Delete contact
GET    /contacts/type/:type         // Filter by type (labels, curators, etc.)
GET    /contacts/search?q=query     // Search contacts
POST   /contacts/:contactId/interactions  // Log interaction
```

**Storage**: `~/Documents/Music Agent/Contacts/contacts.json`

```json
{
  "contacts": [
    {
      "contactId": "contact_123",
      "name": "Label A&R",
      ...
    }
  ]
}
```

#### 3B. Frontend - Contacts Page (3-4 hours)

**New Page**: `/contacts/page.js`

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ 📇 Contacts                                            │
│                                                        │
│ [Search contacts...] [+ Add Contact] [Filter: All ▾] │
│                                                        │
│ Filter by Type:                                        │
│ [All] [Labels] [Curators] [Promoters] [Collaborators]│
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🏢 Label Contacts (12)                           │ │
│ ├──────────────────────────────────────────────────┤ │
│ │                                                  │ │
│ │ John Doe - A&R Manager                          │ │
│ │ Record Label XYZ                                │ │
│ │ john@label.com                                  │ │
│ │ 📊 5 submissions • 2 signed • 40% response rate │ │
│ │ Last contact: Feb 10, 2026                      │ │
│ │ [View Details] [Email]                          │ │
│ │                                                  │ │
│ │ ─────────────────────────────────────────────── │ │
│ │                                                  │ │
│ │ Jane Smith - Label Owner                        │ │
│ │ Indie Label ABC                                 │ │
│ │ ...                                             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🎵 Playlist Curators (8)                        │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### 3C. Frontend - Contact Detail Page (2-3 hours)

**New Page**: `/contacts/[contactId]/page.js`

**Shows**:
- Full contact info
- Interaction history (submissions, releases, playlists)
- Notes and reminders
- Statistics (response rate, success rate)
- Related tracks/releases
- Timeline of all interactions

#### 3D. Integration with Existing Features (1-2 hours)

**Changes**:
1. Label submission form → Option to select from contacts OR create new
2. Track detail page → Link to contact profile from submissions
3. Platform distribution → Link to curator contact for playlists
4. Quick stats on homepage showing contact summary

#### Implementation Steps

1. **Backend** (4-5 hours):
   - Create contact storage system
   - Build CRUD endpoints
   - Implement search and filtering
   - Track statistics (response rates, success rates)

2. **Frontend - Contacts List** (2 hours):
   - Create contacts page with filters
   - Display contacts grouped by type
   - Search functionality
   - Quick stats per contact

3. **Frontend - Contact Detail** (2-3 hours):
   - Detailed contact page
   - Interaction timeline
   - Notes and reminders
   - Edit contact info

4. **Integration** (1-2 hours):
   - Link label submissions to contacts
   - Link platform releases to curator contacts
   - Auto-populate statistics from submissions/releases

#### Acceptance Criteria
- [ ] Can add contacts with all fields
- [ ] Can view all contacts on one page
- [ ] Can filter by type (labels, curators, etc.)
- [ ] Can search contacts by name/company
- [ ] Contact detail page shows full info
- [ ] Statistics auto-update from submissions
- [ ] Can link contacts to label submissions
- [ ] Can link contacts to platform releases
- [ ] Can edit and delete contacts
- [ ] Interaction history shows timeline

---

## 4. Marketing & Promo System (8-10 hours)

**See Phase 2C in previous continuation prompt** - This is the full Marketing & Promo tracking system that completes the 3-path distribution model.

Key features:
- Add promo deals (SoundCloud Premiere, blog features, radio play)
- Track promo status and dates
- Promoted badge on tracks
- Promo detail page with contacts and documents
- Marketing content storage

---

## 5. SoundCloud Private Upload API (4-6 hours)

### Goal
Automate private link generation for promo use

### Why This Matters
- Save time creating private links
- Consistent private link generation
- Auto-store link in track metadata
- One-click promo link creation

### Important Notes
- **Exploratory feature** - SoundCloud API can be tricky
- **Not essential** - You can still manually create links
- **Requires SoundCloud OAuth** - Need API credentials
- **May have rate limits** - SoundCloud may restrict uploads

### Implementation Overview

**If SoundCloud API available**:
1. OAuth authentication with SoundCloud
2. Upload audio file via API
3. Set track to "private"
4. Get private link
5. Store link in metadata.privateUrl
6. Display link on detail page

**If SoundCloud API not feasible**:
- Skip this feature
- Continue manually creating private links
- Store links manually in privateUrl field

### Decision Point
Research SoundCloud API availability before implementing. May not be worth the complexity.

---

## 6. YouTube Private Upload API (4-6 hours)

### Goal
Automate private video uploads for promo

### Similar to SoundCloud
- Research YouTube Data API v3
- OAuth authentication required
- Upload video privately
- Get shareable link
- Store in metadata

### Decision Point
Evaluate if worth the API complexity. Manual uploads may be fine for MVP.

---

## 🗓️ Suggested Implementation Timeline

### Week 1: Core Functionality (12-14 hours)
**Days 1-3** (6-8 hours):
- ✅ Edit Track functionality
- Backend endpoint
- Edit modal
- Testing all fields

**Days 4-7** (6-8 hours):
- ✅ EP/Album Management (Part 1)
- Backend endpoints
- Create EP flow
- Basic EP detail page

### Week 2: Collections & CRM (12-14 hours)
**Days 1-3** (4-6 hours):
- ✅ EP/Album Management (Part 2)
- Homepage integration
- Tracklist management
- Polish and testing

**Days 4-7** (8-10 hours):
- ✅ Contact CRM (Part 1)
- Backend contacts system
- Contacts list page
- Add/edit contacts

### Week 3: CRM Integration & Promo (10-12 hours)
**Days 1-4** (4-6 hours):
- ✅ Contact CRM (Part 2)
- Contact detail pages
- Statistics tracking
- Integration with submissions

**Days 5-7** (6-8 hours):
- ✅ Marketing & Promo (Part 1)
- Promo deals section
- Add promo form
- Promoted badge

### Week 4: Polish & Optional Features (8-10 hours)
**Days 1-4** (4-6 hours):
- ✅ Marketing & Promo (Part 2)
- Promo detail page
- Marketing content
- Testing

**Days 5-7** (4-6 hours):
- 🔄 Optional: SoundCloud/YouTube APIs
- Research feasibility
- Implement if worthwhile
- OR: Skip and move to next phase

---

## 🎯 Success Criteria

### Phase 3 Complete When:
- [ ] Can edit all track metadata
- [ ] Can create and manage EPs/Albums
- [ ] Can add tracks to collections
- [ ] All contacts centralized in CRM
- [ ] Can track response rates and statistics
- [ ] Marketing & Promo system functional
- [ ] Promoted badge shows on tracks
- [ ] Used system for real work for 2 weeks
- [ ] No major bugs preventing daily use

---

## 📊 What's Next After Phase 3?

See updated Master Prompt for long-term roadmap including:
- Cloud deployment
- Mobile app
- Team collaboration
- Revenue tracking
- Analytics integration
- And more...

---

## 🎓 Learning Outcomes

After Phase 3, you'll understand:
- Complex data relationships (EPs containing tracks)
- CRUD operations for multiple entities
- Linking related data (contacts to submissions)
- Statistics calculation and aggregation
- Form state management for complex edits
- API integration patterns (OAuth, rate limits)

---

**Ready to start?** Begin with Edit Track functionality - it's the most immediately useful and will teach you update patterns for later features!

**Next Review**: After Edit Track and EP Management complete  
**Target Completion**: 3-4 weeks at steady pace
