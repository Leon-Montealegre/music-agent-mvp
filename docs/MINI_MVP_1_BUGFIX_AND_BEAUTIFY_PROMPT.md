# Mini-MVP 1: Bug Fixes & UI Beautification

**Use this prompt to fix bugs and improve the UI of the completed Mini-MVP 1.**  
**Date:** February 11, 2026  
**Prerequisites:** Read the Release Management Master Prompt in Project Knowledge for full context.

---

## Context

Mini-MVP 1 (Release Dashboard) is functionally complete with these features:
- ✅ Release list page with cards
- ✅ Release detail page with all metadata
- ✅ Log Platform Upload form (working)
- ✅ Log Label Submission form (working)
- ✅ Data persists to metadata.json files

However, there are bugs and UX issues that need fixing before moving to Mini-MVP 2.

---

## Bugs to Fix

### Bug 1: "Unknown" Release Being Created

**Symptom:** When uploading via n8n, an extra release folder called "unknown" is created with invalid metadata.

**Evidence:** metadata.json shows:
```json
{
  "metadata": {
    "releaseId": "unknown",
    "artist": "ff",
    "title": "dd",
    "genre": "Deep House",
    "releaseDate": "2026-02-11",
    // ...
  },
  "releaseId": "unknown"
}
```

**Root cause:** The n8n workflow is not generating the releaseId properly. The releaseId should be `YYYY-MM-DD_ArtistName_TrackTitle` format, not "unknown".

**Where the issue is:**
- Either the n8n workflow's releaseId generation is broken
- OR the Express API's metadata creation is defaulting to "unknown"

**How to fix:**
1. Check the n8n workflow's releaseId generation logic
2. Verify the Express API's POST /metadata endpoint handles missing releaseId
3. Fix whichever is causing "unknown" to be set

**Note:** This might be a good reason to replace n8n with a Next.js form (see Task 5 below).

---

### Bug 2: Invalid Date Displayed on Cards

**Symptom:** Release cards show "Invalid Date" instead of the actual release date.

**Root cause:** The releaseId format is "unknown" instead of "YYYY-MM-DD_Artist_Title", so date parsing fails.

**How to fix:** Once Bug 1 is fixed (proper releaseId), this should resolve automatically. However, we should add defensive code:

In `src/components/ReleaseCard.js`, update the date display:

```javascript
{/* Release Date */}
<p className="text-xs text-gray-500 mb-3">
  {release.releaseDate ? 
    new Date(release.releaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 
    'No date set'
  }
</p>
```

---

### Bug 3: Missing Metadata Details on Cards

**Symptom:** Cards don't show release type, proper dates, genre, etc.

**Root cause:** The simplified `/releases/` endpoint returns limited data. The cards need more info.

**Current data returned by GET /releases/:**
```json
{
  "releaseId": "...",
  "artist": "...",
  "title": "...",
  "genre": "...",
  "releaseDate": "...",
  "versionCount": 1,
  "fileCounts": {...}
}
```

**What's missing:** releaseType, full files list, distribution counts

**How to fix:**
- Option A: Update the Express API's GET /releases/ endpoint to include releaseType
- Option B: Accept that the card view is simplified (this is actually fine for performance)

**My recommendation:** Option B - cards are meant to be lightweight. Full details are on the detail page.

---

### Bug 4: Question Mark for Label Submission Count

**Symptom:** Cards show "?" instead of actual submission count like "1 submission".

**Root cause:** In `ReleaseCard.js`, the submission count logic is:
```javascript
const submissionCount = release.hasDistribution ? '?' : 0
```

This is a placeholder! We need to calculate the actual count.

**How to fix:** Update `src/components/ReleaseCard.js`:

```javascript
// Calculate status counts
const platformCount = release.fileCounts?.audio > 0 ? 1 : 0
const submissionCount = 0 // We'll calculate this from the API

// Actually, the simplified endpoint doesn't include distribution
// So we need to either:
// 1. Add distribution count to the /releases/ endpoint response
// 2. Or just show "?" until they click into the detail page

// For now, let's just hide it if we don't have the data
```

**Better solution:** Update the GET /releases/ endpoint in Express to include distribution counts.

Add this to the Express API's GET /releases/ response for each release:

```javascript
distributionCounts: {
  platforms: metadata.distribution?.release?.length || 0,
  submissions: metadata.distribution?.submit?.length || 0,
  promotions: metadata.distribution?.promote?.length || 0
}
```

Then in ReleaseCard.js:
```javascript
const platformCount = release.distributionCounts?.platforms || 0
const submissionCount = release.distributionCounts?.submissions || 0
```

---

## UX Improvements

### Task 1: Dark Theme for Electronic Music Vibe

**Goal:** Change from light gray background to dark/black theme suitable for electronic music.

**Current colors:**
- Background: `bg-gray-50` (light)
- Cards: `bg-white`
- Text: `text-gray-900`, `text-gray-600`

**New color scheme:**
- Background: Dark with subtle gradient
- Cards: Dark gray with slight transparency
- Text: Light colors for contrast
- Accent: Keep purple-600 for buttons (good electronic vibe)

**Approach:**
1. Use Tailwind's dark theme utilities
2. Create a consistent color palette
3. Update all pages (homepage, detail page, modals)

**Suggested palette:**
```javascript
// Background gradient
bg-gradient-to-br from-gray-900 via-gray-800 to-black

// Cards
bg-gray-800/80 backdrop-blur-sm border border-gray-700

// Text
text-gray-100 (headings)
text-gray-300 (body)
text-gray-400 (metadata)

// Accents
Purple (keep for buttons): bg-purple-600 hover:bg-purple-500
Green (for status): text-green-400
Blue (for links): text-blue-400
```

**Files to update:**
- `src/app/page.js` (homepage)
- `src/app/layout.js` (header)
- `src/app/releases/[releaseId]/page.js` (detail page)
- `src/components/ReleaseCard.js` (cards)
- `src/components/Modal.js` (modal backdrop/content)
- `src/components/LogPlatformForm.js` (form styling)
- `src/components/LogSubmissionForm.js` (form styling)

**Example transformation for ReleaseCard.js:**

Before:
```javascript
<div className="bg-white rounded-lg shadow hover:shadow-lg">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Artist</p>
</div>
```

After:
```javascript
<div className="bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 hover:border-purple-500 transition-all">
  <h3 className="text-gray-100">Title</h3>
  <p className="text-gray-300">Artist</p>
</div>
```

---

### Task 2: Improve Font Visibility

**Problem:** Light gray fonts are barely visible, especially platform names and section headers.

**Where to fix:**
- Platform names in Platform Status section
- Label names in Label Submissions section  
- Section headers ("Platform Status", "Label Submissions")
- Card text (title, artist, genre)

**Solution:** Increase contrast by using lighter text colors on dark backgrounds.

**Updates needed:**

In detail page sections:
```javascript
// Before
<p className="font-medium">{entry.platform}</p>  // Default gray-900
<h2 className="text-xl font-semibold">Platform Status</h2>

// After
<p className="font-medium text-gray-100">{entry.platform}</p>
<h2 className="text-xl font-semibold text-gray-100">Platform Status</h2>
```

In cards:
```javascript
// Before
<h3 className="font-bold text-lg text-gray-900">{release.title}</h3>
<p className="text-sm text-gray-600">{release.artist}</p>

// After
<h3 className="font-bold text-lg text-gray-100">{release.title}</h3>
<p className="text-sm text-gray-300">{release.artist}</p>
```

---

### Task 3: Add Glassmorphism Effects (Optional Cool Feature)

**What it is:** Translucent cards with blur effects - very modern, very "electronic music festival" vibe.

**Example:**
```javascript
<div className="bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl">
  {/* Content */}
</div>
```

**Where to use:**
- Release cards on homepage
- Modal backgrounds
- Section containers on detail page

**CSS needed (add to globals.css if not already using backdrop-blur):**
```css
/* Tailwind includes backdrop-blur by default, so just use the utilities */
```

---

### Task 4: Improve Genre Tag Styling

**Current:** Purple tags look good but could pop more on dark background.

**Suggestion:**
```javascript
// Before
<span className="bg-purple-100 text-purple-800">Genre</span>

// After (glowing effect)
<span className="bg-purple-500/20 text-purple-300 border border-purple-500/50 ring-1 ring-purple-500/20">
  Genre
</span>
```

---

### Task 5: Replace n8n Form with Next.js Form (Optional but Recommended)

**Why:** 
- n8n is creating the "unknown" release bug
- Manual trigger is annoying
- Integrated form is better UX
- One less dependency

**What to build:**
A form at `/releases/new` that:
1. Accepts: artist, title, genre, release date
2. Uploads files (audio, artwork, video - optional)
3. Generates proper releaseId: `YYYY-MM-DD_Artist_Title`
4. Calls POST /upload and POST /metadata APIs
5. Redirects to the new release detail page

**Implementation (if user wants this):**
- Copy the modal form patterns from LogPlatformForm
- Use HTML5 file inputs for uploads
- Use FormData for multipart file upload
- Show progress indicator during upload
- Handle validation (required fields, file types)

**This solves Bug 1 at the root.**

---

## Testing Checklist After Fixes

- [ ] No "unknown" releases created
- [ ] All dates display correctly
- [ ] Cards show accurate submission/platform counts
- [ ] Dark theme applied consistently
- [ ] All text is readable with good contrast
- [ ] Forms work on dark background
- [ ] Modals look good with new theme
- [ ] Genre tags are visible and styled well

---

## Step-by-Step Implementation Plan

1. **Fix Bug 1 (unknown releases)** - Either fix n8n OR build Next.js form
2. **Fix Bug 4 (submission counts)** - Update Express API and ReleaseCard
3. **Apply dark theme** - Update all pages and components
4. **Fix font visibility** - Increase text contrast
5. **Test everything** - Run through checklist
6. **Optional enhancements** - Glassmorphism, better genre tags

---

## Questions for the User

Before starting, ask:
1. **Do you want to fix n8n or replace it with Next.js form?** (I recommend replacing)
2. **How dark should the theme be?** (Pure black, dark gray gradient, or subtle dark blue?)
3. **Do you want glassmorphism effects?** (Translucent blurred cards)

---

## Definition of Done

When these are true, bugs are fixed and UI is beautified:

- [ ] No invalid/unknown releases
- [ ] All dates display correctly  
- [ ] Dark theme applied throughout
- [ ] All text is clearly visible
- [ ] Cards look modern and professional
- [ ] Forms work perfectly on dark background
- [ ] User can create releases with one click
- [ ] Tested with at least 3 real releases

---

## How to Use This Prompt

Start a new Claude conversation and say:

> "I'm fixing bugs and beautifying Mini-MVP 1 of my Release Management System. Please read the Release Management Master Prompt and the Bug Fix & Beautification Prompt in Project Knowledge. Let's start by fixing the 'unknown release' bug - I want to replace n8n with a Next.js form."

OR if you want to keep n8n:

> "I'm fixing bugs and beautifying Mini-MVP 1. Please read both prompts in Project Knowledge. Let's debug why n8n is creating 'unknown' releases instead of proper releaseIds."

Then work through the tasks sequentially.
