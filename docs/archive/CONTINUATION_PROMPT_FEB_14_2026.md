# Continuation Prompt - Phase 2 Features
**Date**: February 14, 2026 9:00 PM CET  
**Status**: Mini-MVP 1.5 Complete → Expanding to Full Feature Set  
**Duration**: 2-3 weeks (depending on pace)

---

## 📋 Overview of Next Phase

This prompt covers the next set of features to complete your music release management system. These features focus on:
1. Better visual indicators (badges, BPM/Key display)
2. Marketing and promotional tracking
3. Enhanced track management (edit, notes, URLs)
4. UI polish and consistency

---

## 🎯 Feature List (Priority Order)

### Phase 2A: Quick Wins (Week 1)
**Duration**: 4-6 hours total

1. **Released Badge** (1 hour)
2. **BPM/Key Visibility** (1 hour)
3. **Button Color Differentiation** (30 mins)
4. **URL Field for Private Links** (1.5 hours)
5. **Notes Section** (2 hours)

### Phase 2B: Edit Functionality (Week 2)
**Duration**: 4-6 hours

6. **Edit Track Button & Form** (4-6 hours)

### Phase 2C: Marketing & Promo System (Week 2-3)
**Duration**: 8-12 hours

7. **Marketing & Promo Section** (8-12 hours)
   - Add Promo Deal form
   - Promo tracking
   - Promoted badge
   - Promo detail page
   - Generate marketing content

---

## 📝 Detailed Feature Specifications

### 1. Released Badge (1 hour)

**Goal**: Show visual indicator when track is live on platforms

#### Where to Display:
- **Homepage**: On release cards (next to Signed/Submitted badges)
- **Detail Page**: In sidebar near track title

#### Badge Design:
```javascript
// Appearance
- Background: Blue (bg-blue-600)
- Text: White
- Icon: 🎵 or 🔴 (live indicator)
- Text: "Released" or "Live"
- Size: Small, consistent with other badges
```

#### Detection Logic:
```javascript
const isReleased = release.distribution?.release?.some(
  entry => entry.status?.toLowerCase() === 'live'
)
```

#### Implementation Steps:
1. Add badge component to `ReleaseCard.js`
2. Add badge to detail page sidebar
3. Style to match existing Signed/Submitted badges
4. Test with "Tell Me" track (should show badge)

#### Acceptance Criteria:
- [ ] Badge appears on homepage for released tracks
- [ ] Badge appears on detail page for released tracks
- [ ] Badge does NOT appear for non-released tracks
- [ ] Styling matches existing badges

---

### 2. BPM/Key Visibility (1 hour)

**Goal**: Show BPM and Key data prominently where users need it

#### Homepage Changes:
**Option A**: Add to track card
```
┌─────────────────┐
│   [Artwork]     │
│                 │
│ Track Title     │
│ Artist Name     │
│ Genre           │
│ 126 BPM • A min │ ← NEW
│ [Badges]        │
└─────────────────┘
```

**Option B**: Show in hover tooltip
- Hover over card → see BPM/Key in overlay

**My Recommendation**: Option A (always visible, no interaction needed)

#### Detail Page Changes:
Add to sidebar metadata section:
```
Title: Track Title
Artist: Artist Name
Genre: Progressive House
BPM: 126 ← MAKE PROMINENT
Key: A minor ← MAKE PROMINENT
Format: Single
Date: 2026-02-14
```

#### Implementation Steps:
1. Update `ReleaseCard.js` to show BPM/Key
2. Update detail page sidebar to display BPM/Key prominently
3. Handle missing BPM/Key gracefully (don't show empty fields)
4. Style with subtle color to draw attention

#### Acceptance Criteria:
- [ ] BPM/Key visible on homepage cards (if data exists)
- [ ] BPM/Key prominent in detail page sidebar
- [ ] Missing BPM/Key doesn't break layout
- [ ] Styling is clean and readable

---

### 3. Button Color Differentiation (30 mins)

**Goal**: Make Feedback and Statistics buttons visually distinct

#### Current State:
- Feedback: Gray (bg-gray-700)
- Statistics: Gray (bg-gray-700) ← SAME COLOR, CONFUSING
- Buy Me a Coffee: Orange (bg-orange-600)

#### Proposed Changes:

**Option A: Make Statistics Purple** (matches theme)
```javascript
// Statistics button
className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white..."
```

**Option B: Make Feedback Blue**
```javascript
// Feedback button
className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white..."
```

**My Recommendation**: Option A (Statistics purple, keeps Feedback neutral gray)

#### Visual Preview:
```
Header:
[Logo] ────────────── [💬 Feedback] [📊 Statistics] [☕ Buy Coffee]
                         Gray         Purple          Orange
```

#### Implementation Steps:
1. Open `app/layout.js`
2. Update Feedback or Statistics button color
3. Test on both catalogue and detail pages
4. Ensure hover states work well

#### Acceptance Criteria:
- [ ] Feedback and Statistics buttons have different colors
- [ ] All three buttons are distinct from each other
- [ ] Colors fit the dark theme aesthetic
- [ ] Hover states work correctly

---

### 4. URL Field for Private Links (1.5 hours)

**Goal**: Store private links (SoundCloud, Dropbox, WeTransfer, etc.) for each track

#### Data Structure:
```json
{
  "releaseId": "2026-02-14_Artist_Track",
  "title": "Track Title",
  "privateUrl": "https://soundcloud.com/artist/track/s-xxxxx",
  "privateUrlNote": "Private SoundCloud link for promo",
  ...
}
```

#### Where to Display:

**Upload Form** (`/releases/new/page.js`):
```
Optional Details section:
┌─────────────────────────────────────┐
│ BPM: [___]  Key: [___]              │
│                                     │
│ Private URL (Optional):             │
│ [https://...]                       │
│ Note: [For promo/sharing]           │
└─────────────────────────────────────┘
```

**Detail Page**:
Add new box in sidebar or right column:
```
┌─────────────────────────────┐
│ 🔗 Private Link             │
├─────────────────────────────┤
│ https://soundcloud.com/...  │ ← Clickable
│ Note: Promo link            │
│ [Copy URL] [Edit]           │
└─────────────────────────────┘
```

#### Implementation Steps:

**Backend** (No changes needed!):
- Your backend already accepts dynamic query params
- Just add `privateUrl` to the upload URL

**Frontend**:
1. Add to upload form (`releases/new/page.js`):
   - Text input for URL
   - Text input for note (optional)
   - Validation: Check if valid URL format
2. Add to metadata payload
3. Display on detail page
4. Add "Copy URL" button (uses `navigator.clipboard.writeText()`)

#### Acceptance Criteria:
- [ ] URL field in upload form (optional)
- [ ] URL saves to metadata
- [ ] URL displays on detail page with clickable link
- [ ] Copy button works
- [ ] Missing URL doesn't break page
- [ ] URL validation prevents invalid entries

---

### 5. Notes Section (2 hours)

**Goal**: Free-form notes and document uploads per track

#### Data Structure:
```json
{
  "notes": {
    "text": "Remember to send stems to label...",
    "documents": [
      {
        "filename": "track-notes.txt",
        "uploadedAt": "2026-02-14T00:00:00.000Z",
        "size": 1234
      }
    ]
  }
}
```

#### Where to Display:

**Detail Page** (below Marketing & Promo):
```
┌──────────────────────────────────┐
│ 📝 Notes                         │
├──────────────────────────────────┤
│ [Editable text area]             │
│                                  │
│ Remember to send stems...        │
│                                  │
│ [Save Notes]                     │
│                                  │
│ Documents:                       │
│ • track-notes.txt (Download)     │
│ • stems-checklist.pdf (Download) │
│                                  │
│ [+ Upload Document]              │
└──────────────────────────────────┘
```

**Upload Form** (optional):
```
Notes (Optional):
┌─────────────────────────────────┐
│ [Text area]                     │
│ Add any notes about this track  │
└─────────────────────────────────┘
```

#### Implementation Steps:

**Backend**:
1. Add endpoint: `PATCH /releases/:releaseId/notes` (save notes text)
2. Add endpoint: `POST /releases/:releaseId/notes/files` (upload documents)
3. Add endpoint: `DELETE /releases/:releaseId/notes/files/:filename`
4. Create folder: `{releaseId}/notes/` for documents

**Frontend**:
1. Add notes text area to detail page
2. Add save button (auto-save on blur optional)
3. Add file upload interface (similar to label deal documents)
4. Add document list with download/delete
5. Optionally add notes field to upload form

#### Acceptance Criteria:
- [ ] Can add/edit notes on detail page
- [ ] Notes save correctly
- [ ] Can upload documents to notes section
- [ ] Can download/delete documents
- [ ] Notes section doesn't interfere with other features
- [ ] Empty notes section doesn't break page

---

### 6. Edit Track Button & Form (4-6 hours)

**Goal**: Edit track metadata without deleting and re-uploading

#### Where to Display:

**Detail Page** (next to Delete button):
```
Bottom of right column:
┌─────────────────────────────────────┐
│ [✏️ Edit Track] [🗑️ Delete Track]   │
└─────────────────────────────────────┘
```

#### What Can Be Edited:
- Artist name
- Title
- Genre
- Production date
- Format
- BPM
- Key
- Private URL
- Notes

**Cannot Edit**:
- Release ID (would break file system)
- Files (use delete/re-upload instead)

#### Edit Form Design:

**Option A**: Modal overlay
```
┌─────────────────────────────────┐
│ Edit Track                      │
├─────────────────────────────────┤
│ Artist: [Mathias Berthelemot]   │
│ Title: [Anomaly 2]              │
│ Genre: [Indie Dance ▼]          │
│ BPM: [126]  Key: [A minor ▼]   │
│ ...                             │
│                                 │
│ [Cancel] [Save Changes]         │
└─────────────────────────────────┘
```

**Option B**: Navigate to edit page (`/releases/{releaseId}/edit`)

**My Recommendation**: Option A (modal, keeps user in context)

#### Implementation Steps:

**Backend**:
1. Add endpoint: `PATCH /releases/:releaseId/metadata`
2. Accept: artist, title, genre, releaseDate, releaseFormat, bpm, key, privateUrl
3. Validate changes
4. Update metadata.json
5. Handle releaseId if title/artist changed (complex - skip for MVP)

**Frontend**:
1. Add "Edit Track" button to detail page
2. Create edit modal component
3. Pre-fill form with current metadata
4. On save, call PATCH endpoint
5. Refresh detail page data
6. Show success notification

#### Important Considerations:

**releaseId Handling**:
- If user changes artist/title, releaseId format would change
- **For MVP**: Don't change releaseId (just warn user)
- **Future**: Rename folder and update all references

**File Handling**:
- Editing metadata doesn't change files
- To change files, user must delete and re-upload (for now)

#### Acceptance Criteria:
- [ ] Edit button appears on detail page
- [ ] Modal opens with pre-filled form
- [ ] Can edit all editable fields
- [ ] Changes save correctly
- [ ] Detail page refreshes with new data
- [ ] releaseId remains unchanged (for MVP)
- [ ] Success notification shows

---

### 7. Marketing & Promo Section (8-12 hours)

**Goal**: Complete promo tracking system similar to Label Deals

This is the largest feature. Break it into sub-features:

#### 7A. Promo Section UI (2 hours)

**Detail Page** (replace placeholder "Marketing Content"):
```
┌─────────────────────────────────────┐
│ 📢 Marketing & Promo                │
├─────────────────────────────────────┤
│ [+ Add Promo Deal]                  │
│ [✨ Generate Marketing Content]     │
│                                     │
│ Active Promos:                      │
│ • SoundCloud Promo - Live           │
│ • Blog Feature - Scheduled          │
└─────────────────────────────────────┘
```

#### 7B. Add Promo Deal Form (2 hours)

**Form Fields**:
```
┌─────────────────────────────────────┐
│ Add Promo Deal                      │
├─────────────────────────────────────┤
│ Promo Name: [___________________]   │
│ Platform: [Dropdown]                │
│   - SoundCloud                      │
│   - YouTube                         │
│   - Blog/Magazine                   │
│   - Radio                           │
│   - Playlist                        │
│   - Social Media                    │
│   - Other                           │
│                                     │
│ Status: [Dropdown]                  │
│   - Not Started                     │
│   - In Progress                     │
│   - Scheduled                       │
│   - Live                            │
│   - Completed                       │
│                                     │
│ [If Scheduled selected]:            │
│ Go Live Date: [Date picker]         │
│                                     │
│ [If Live selected]:                 │
│ Went Live: [Date picker]            │
│                                     │
│ Notes: [Text area]                  │
│                                     │
│ [Cancel] [Add Promo]                │
└─────────────────────────────────────┘
```

#### Data Structure:
```json
{
  "distribution": {
    "promote": [
      {
        "promoId": "promo_1234567890",
        "name": "SoundCloud Premiere",
        "platform": "SoundCloud",
        "status": "Live",
        "scheduledDate": "2026-02-20",
        "liveDate": "2026-02-20",
        "timestamp": "2026-02-14T00:00:00.000Z",
        "notes": "Featured on their main channel"
      }
    ]
  },
  "promoDeals": {
    "promo_1234567890": {
      "promoId": "promo_1234567890",
      "name": "SoundCloud Premiere",
      "platform": "SoundCloud",
      "contact": {
        "name": "John Doe",
        "email": "promo@soundcloud.com",
        "role": "Promo Manager"
      },
      "documents": [
        {
          "filename": "promo-agreement.pdf",
          "uploadedAt": "...",
          "size": 12345
        }
      ]
    }
  }
}
```

#### 7C. Promoted Badge (1 hour)

**Logic**:
```javascript
const isPromoted = release.distribution?.promote?.some(
  entry => entry.status?.toLowerCase() === 'live'
)
```

**Display**:
- Homepage: Add badge (green, "Promoted" or "🔥 Promo")
- Detail page: Add badge in sidebar
- Stats page: Add "Promoted" count

**Filter**:
- Add 6th filter button: "Promoted"
- Shows tracks with live promo deals

#### 7D. Promo Deal Summary in Detail Page (1 hour)

**Location**: Below "Label Deal" section in sidebar

```
┌─────────────────────────────┐
│ 🎯 Promo Deals              │
├─────────────────────────────┤
│ SoundCloud Premiere         │
│ Status: Live                │
│ Went Live: Feb 20, 2026     │
│                             │
│ [View Full Details →]       │
└─────────────────────────────┘
```

#### 7E. Promo Deal Detail Page (3-4 hours)

**New Page**: `/releases/{releaseId}/promo-deal`

**Structure** (similar to Label Deal page):
```
┌──────────────────────────────────────┐
│ ← Back to Release                    │
│                                      │
│ 🎯 Promo Deal: SoundCloud Premiere   │
├──────────────────────────────────────┤
│ Promo Contact                        │
│ [+ Add Contact]                      │
│                                      │
│ • John Doe (Promo Manager)           │
│   email@soundcloud.com               │
│   [Edit] [Delete]                    │
│                                      │
│ Documents                            │
│ [+ Upload Document]                  │
│                                      │
│ • promo-agreement.pdf (Download)     │
│   Uploaded: Feb 14, 2026             │
│   [Delete]                           │
└──────────────────────────────────────┘
```

**Features**:
- Contact management (same as Label Deal)
- Document uploads (same as Label Deal)
- Promo-specific details

#### 7F. Generate Marketing Content (2-3 hours)

**UI**:
```
┌─────────────────────────────────────┐
│ ✨ Generate Marketing Content       │
├─────────────────────────────────────┤
│ [Option 1: Use AI to generate]      │
│  - Social media captions            │
│  - Press release                    │
│  - Email announcement               │
│                                     │
│ [Option 2: Upload your own]         │
│  [+ Upload promotional materials]   │
│                                     │
│ Saved Content:                      │
│ • Instagram caption (View/Edit)     │
│ • Press release.pdf (Download)      │
│ • Promo video.mp4 (Download)        │
└─────────────────────────────────────┘
```

**Implementation Options**:

**Option A**: Simple file upload
- Let user upload their own marketing materials
- Store in `{releaseId}/marketing/` folder
- List uploaded files

**Option B**: AI-powered generation
- Use Claude API (if enabled in artifacts)
- Generate captions based on track metadata
- Let user edit before saving
- Save as text files

**My Recommendation**: Start with Option A (upload), add Option B later

#### Implementation Steps:

**Backend** (3-4 hours):
1. Add `PATCH /releases/:releaseId/distribution` to handle promo entries
2. Create promo deal storage structure
3. Add contact endpoints (reuse label deal logic)
4. Add document endpoints (reuse label deal logic)
5. Add marketing content storage endpoints

**Frontend** (4-6 hours):
1. Create "Marketing & Promo" section component
2. Create "Add Promo Deal" form modal
3. Add promo list display
4. Create Promoted badge component
5. Add Promoted filter to homepage
6. Create promo deal detail page (`/promo-deal`)
7. Add contact/document management (reuse Label Deal components)
8. Create marketing content upload interface

#### Acceptance Criteria:
- [ ] Can add promo deals with all fields
- [ ] Status changes to "Live" shows Promoted badge
- [ ] Promoted filter works on homepage
- [ ] Promo summary shows in detail page
- [ ] Can navigate to promo detail page
- [ ] Can add contacts to promo deals
- [ ] Can upload documents to promo deals
- [ ] Can upload marketing materials
- [ ] All promos tracked in distribution.promote array

---

## 🗓️ Suggested Implementation Timeline

### Week 1: Quick Wins (8-10 hours)
**Day 1-2** (3-4 hours):
- Released badge
- BPM/Key visibility
- Button color differentiation

**Day 3-4** (3-4 hours):
- URL field for private links
- Notes section (basic)

**Day 5-7** (2-3 hours):
- Polish and test all Week 1 features
- Fix any bugs

### Week 2: Edit & Promo Foundation (10-12 hours)
**Day 1-3** (4-6 hours):
- Edit Track button and form
- Test editing all fields

**Day 4-5** (3-4 hours):
- Marketing & Promo section UI
- Add Promo Deal form
- Promoted badge

**Day 6-7** (3-4 hours):
- Promo summary in detail page
- Promoted filter

### Week 3: Promo Detail System (8-10 hours)
**Day 1-4** (6-8 hours):
- Promo Deal detail page
- Contact management (reuse code)
- Document management (reuse code)

**Day 5-7** (2-3 hours):
- Marketing content upload
- Final testing
- Bug fixes

---

## 🎯 Development Approach

### For Each Feature:

1. **Read the spec** (this document)
2. **Check existing code** (don't reinvent, reuse!)
3. **Backend first** (if needed)
4. **Frontend second**
5. **Test immediately**
6. **Commit to GitHub**

### Reusable Components:

Many features reuse existing patterns:
- **Promo contacts** → Same as Label Deal contacts
- **Promo documents** → Same as Label Deal documents
- **Badges** → Same component, different colors
- **Forms** → Similar to label submission forms

### Testing Checklist (for each feature):

- [ ] Feature works as specified
- [ ] No console errors
- [ ] No broken layouts
- [ ] Works with existing tracks
- [ ] Works with new tracks
- [ ] Edge cases handled (missing data, etc.)

---

## 📊 Priority Matrix

### Must Have (Week 1):
1. Released badge
2. BPM/Key visibility
3. Button colors
4. URL field
5. Notes section

### Should Have (Week 2):
6. Edit track functionality
7. Promo deals (basic)
8. Promoted badge

### Nice to Have (Week 3):
9. Promo detail page
10. Marketing content generation

---

## 🚨 Important Notes

### Data Compatibility:
- All new fields are **optional**
- Old tracks without new data won't break
- Gradual migration (add data as you use the app)

### Reuse Existing Code:
- Label Deal system → Template for Promo Deals
- Submission forms → Template for Promo forms
- Badge components → Just change colors

### Keep It Simple:
- Don't over-engineer
- Start with basic versions
- Add complexity later if needed

### Test Thoroughly:
- Test with tracks that have all data
- Test with tracks missing data
- Test with brand new tracks

---

## 📝 How to Use This Prompt

### Starting a Feature:

**Tell Claude**:
> "I want to implement [Feature Name] from the continuation prompt. Walk me through it step by step."

**Claude will**:
1. Review the spec
2. Show you the code
3. Explain what it does
4. Tell you how to test

### Example Requests:

> "Let's add the Released badge to the homepage"

> "I want to add the URL field to the upload form"

> "Help me create the Edit Track button and form"

> "Let's build the Marketing & Promo section"

---

## ✅ Success Criteria

### Phase 2A Complete When:
- [ ] All Quick Wins implemented
- [ ] Released badge visible
- [ ] BPM/Key showing on cards
- [ ] Button colors distinct
- [ ] URL field working
- [ ] Notes section functional

### Phase 2B Complete When:
- [ ] Edit button works
- [ ] Can edit all metadata fields
- [ ] Changes save correctly

### Phase 2C Complete When:
- [ ] Can add promo deals
- [ ] Promoted badge shows
- [ ] Promo filter works
- [ ] Promo detail page exists
- [ ] Can manage contacts/documents

### Full Phase 2 Complete When:
- [ ] All features from this prompt implemented
- [ ] No major bugs
- [ ] App used for real work for 1 week
- [ ] Feedback collected on new features

---

## 🎓 Learning Outcomes

After completing this phase, you'll understand:
- Complex form handling (edit, promo deals)
- Badge systems and conditional rendering
- Code reuse and component patterns
- Backend API design for CRUD operations
- File upload and management
- Status tracking across multiple systems
- Data structure design for related entities

---

**Ready to start?** Begin with the Quick Wins (Phase 2A) and work through systematically. Each feature builds on what you've already learned!

**Next Review**: After Phase 2A (Quick Wins) complete  
**Target Completion**: 2-3 weeks at steady pace
