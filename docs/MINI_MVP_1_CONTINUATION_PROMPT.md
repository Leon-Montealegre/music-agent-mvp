# Mini-MVP 1: Release Dashboard — Continuation Prompt

**Use this prompt to continue development with Claude (Sonnet or Opus).**  
**Date:** February 9, 2026  
**Prerequisites:** Read the Release Management Master Prompt (in Project Knowledge) for full project context.

---

## What This Prompt Is For

I'm building Mini-MVP 1 of my Release Management System — a **Release Dashboard** built with Next.js that shows all my music releases and their status. I need help planning and building this step by step.

**My skill level:** Beginner coder learning through building. I'm comfortable with terminal commands and have built a working Express API (Node.js), but I've never built a Next.js app before. Explain concepts simply and show working code first, then explain WHY.

---

## What Already Exists (My Backend)

I have a working Express API running on **port 3001** at `~/Documents/music-agent-mvp/file-handler/server.js`. It manages music release data stored as JSON files on disk.

### Existing API Endpoints I'll Use

**GET /releases** — Returns all releases, sorted newest first.  
Response example:
```json
[
  {
    "releaseId": "2026-02-07_ArtistName_TrackTitle",
    "metadata": {
      "releaseId": "2026-02-07_ArtistName_TrackTitle",
      "artist": "Artist Name",
      "title": "Track Title",
      "genre": "Melodic House and Techno",
      "releaseType": "Single",
      "releaseDate": "2026-02-07",
      "createdAt": "2026-02-07T04:00:00.000Z",
      "versions": { "primary": { "versionName": "Primary Version", "versionId": "primary" } },
      "files": {
        "audio": [{ "filename": "track.wav", "size": 56379422, "mimetype": "audio/wav" }],
        "artwork": [{ "filename": "cover.png", "size": 3437306, "mimetype": "image/png" }],
        "video": []
      },
      "distribution": {
        "release": [],
        "submit": [],
        "promote": []
      }
    }
  }
]
```

**GET /releases/:releaseId** — Returns a single release with full metadata.  
Response: Same structure as one item from the array above, but as a single object.

**PATCH /releases/:releaseId/distribution** — Updates distribution tracking.  
Request body example (log a SoundCloud upload):
```json
{
  "path": "release",
  "entry": {
    "platform": "SoundCloud",
    "versionId": "primary",
    "status": "uploaded",
    "privacy": "public",
    "url": "https://soundcloud.com/artist/track"
  }
}
```
Request body example (log a label submission):
```json
{
  "path": "submit",
  "entry": {
    "platform": "LabelRadar",
    "label": "Anjunadeep",
    "status": "submitted",
    "notes": "Sent Primary Version"
  }
}
```

**POST /upload?releaseId=...&artist=...&title=...&genre=...** — Uploads files (audio, artwork, video) via multipart form data.

**POST /metadata** — Saves metadata.json for a release.

**GET /health** — Returns `{"status":"ok","message":"File handler is running"}`

### How Data is Stored

Each release lives in its own folder:
```
~/Documents/Music Agent/Releases/
  └── 2026-02-07_ArtistName_TrackTitle/
        ├── versions/primary/audio/track.wav
        ├── artwork/cover.png
        ├── metadata.json          ← all release data lives here
        └── packages/              ← generated ZIP files (utility)
```

The `metadata.json` file is the source of truth for each release. The Express API reads/writes these files. There is no database — just JSON files on disk.

### Key Data Concepts

- **releaseId format:** `YYYY-MM-DD_ArtistName_TrackTitle` (e.g., `2026-02-07_ArtistName_TrackTitle`)
- **Genre options (dropdown):** Ambient, Deep House, House, Indie Dance, Melodic House and Techno, Progressive House, Tech House, Techno, Trance, Other
- **Release types:** Singles only (in MVP)
- **3-path distribution tracking:**
  - `release` path: Platform uploads (SoundCloud, DistroKid, Bandcamp, YouTube)
  - `submit` path: Label submissions (LabelRadar, email, private links)
  - `promote` path: Marketing content (captions, clips)

---

## What We Need to Build (Mini-MVP 1)

### The Next.js Frontend

Create a new Next.js app at `~/Documents/music-agent-mvp/frontend/` that talks to the Express API at `http://localhost:3001`.

**Tech choices:**
- Next.js with App Router (the `/app` directory structure)
- Client-side data fetching (use `fetch()` or a simple wrapper — no need for server components fetching from Express)
- Tailwind CSS for styling (comes with Next.js by default)
- No additional UI libraries needed for MVP — keep it simple

### Pages to Build

#### Page 1: Release List (`/` — the homepage)

**What it shows:**
- Grid or list of all releases, each showing:
  - Artwork thumbnail (or placeholder if no artwork)
  - Track title + artist name
  - Genre tag
  - Release date
  - Quick status summary: how many platforms uploaded, how many label submissions pending
- Sorted by release date (newest first)
- "Create New Release" button at the top

**Data source:** `GET http://localhost:3001/releases`

**User interactions:**
- Click a release card → navigate to `/releases/[releaseId]`
- Click "Create New Release" → navigate to `/releases/new`

#### Page 2: Release Detail (`/releases/[releaseId]`)

**What it shows — organized in sections:**

**Section A: Release Info (top of page)**
- Large artwork image (or placeholder)
- Title, artist, genre, release type, release date
- File info: audio filename + size, artwork filename + size, video if present
- Version info: list all versions (Primary, Extended Mix, etc.)

**Section B: Release Path — Platform Status**
- Table/list showing all platforms with their status:
  - Platform name (SoundCloud, DistroKid, Bandcamp, YouTube, Beatport, Spotify, Apple Music)
  - Status: Not Started / Package Generated / Uploaded / Live
  - Date (when uploaded/went live)
  - URL (if available — link to the track on that platform)
- "Log Upload" button → opens a form to record a new platform upload
- The form asks: Platform (dropdown), Status (dropdown), URL (optional text), Notes (optional text)

**Section C: Submit Path — Label Submissions**
- Table/list showing all label submissions for this release:
  - Label name
  - Platform used (LabelRadar, Email, Private SoundCloud Link, Other)
  - Date submitted
  - Status: Submitted / Listened / Rejected / Signed / No Response
  - Days waiting (calculated from submission date)
  - Notes
- Visual highlight for submissions waiting 14+ days (needs follow-up)
- "Log Submission" button → opens a form to record a new label submission
- The form asks: Label name (text), Platform (dropdown), Notes (optional text)

**Section D: Promote Path — Marketing Content**
- Simple list of what promo content has been created
- For now, just shows existing entries from metadata.json
- "Generate Captions" button — placeholder for Mini-MVP 5 (disabled/grayed out for now)

**Data source:** `GET http://localhost:3001/releases/[releaseId]`  
**Updates:** `PATCH http://localhost:3001/releases/[releaseId]/distribution`

#### Page 3: Create New Release (`/releases/new`)

**What it shows:**
- Form with fields:
  - Artist name (text input, required)
  - Track title (text input, required)
  - Genre (dropdown with the 10 options, required)
  - Release date (date picker, defaults to today)
  - Audio file (file input, required — accepts .wav, .mp3, .flac, .aiff)
  - Artwork file (file input, optional — accepts .jpg, .png)
  - Video file (file input, optional — accepts .mp4, .mov)
- "Create Release" submit button
- On success: redirect to the new release's detail page

**Backend calls needed:**
1. Generate the releaseId from the form data: `YYYY-MM-DD_ArtistName_TrackTitle` (sanitize: remove spaces, special characters)
2. POST to `/upload` with the files + query params (releaseId, artist, title, genre)
3. POST to `/metadata` with the full metadata object
4. Redirect to `/releases/[newReleaseId]`

**Important:** The current `/upload` endpoint expects multipart form data with files. The releaseId and metadata are passed as query parameters. You'll need to construct the request carefully from the Next.js frontend.

---

## Step-by-Step Build Plan

Here's the suggested order. Each step should be testable before moving to the next.

### Step 1: Set Up Next.js Project
- Create new Next.js app in `~/Documents/music-agent-mvp/frontend/`
- Verify it runs on localhost:3000
- Confirm Tailwind CSS is working
- Create basic layout with header/navigation

### Step 2: API Helper Functions
- Create `src/lib/api.js` with helper functions:
  - `fetchReleases()` — calls GET /releases
  - `fetchRelease(releaseId)` — calls GET /releases/:releaseId
  - `updateDistribution(releaseId, path, entry)` — calls PATCH /releases/:releaseId/distribution
- Test that the Express API responds correctly from the browser (CORS should already be enabled on the backend)

### Step 3: Release List Page (Homepage)
- Build the `/` page that fetches and displays all releases
- Start simple: just a list of release titles + artists
- Then add: artwork thumbnails, genre tags, status counts
- Add "Create New Release" button (links to /releases/new, page can be placeholder)

### Step 4: Release Detail Page
- Build the `/releases/[releaseId]` page
- Section A first: display release info (metadata, files, versions)
- Then Section B: Platform Status table (read-only first, just displaying existing data)
- Then Section C: Label Submissions table (read-only first)
- Then Section D: Promote status (read-only)

### Step 5: "Log Upload" Form (Release Path)
- Add the "Log Upload" button to Section B
- Build a simple modal or inline form
- On submit: call PATCH /releases/:releaseId/distribution with path "release"
- Page refreshes/updates to show the new entry

### Step 6: "Log Submission" Form (Submit Path)
- Add the "Log Submission" button to Section C
- Build the form (label name, platform, notes)
- On submit: call PATCH /releases/:releaseId/distribution with path "submit"
- Show "days waiting" calculation and highlight overdue submissions

### Step 7: Create New Release Page
- Build the `/releases/new` form
- Handle file uploads from the browser to the Express API
- This is the most complex step — multipart form data from a React form
- On success: redirect to the new release's detail page

### Step 8: Polish & Test
- Test with real release data (upload a real track)
- Fix any UI issues, improve visual design
- Ensure all pages work end-to-end
- Test the full flow: create release → log platform upload → log label submission → see everything on dashboard

---

## Backend Changes Needed

The existing Express API may need small additions. Here's what might be needed:

### Potentially Needed: POST /releases (Create Release Without Files)
The current flow requires n8n to orchestrate file upload + metadata creation. For the Next.js form, we might want a simpler endpoint that:
1. Accepts form data with files
2. Generates the releaseId
3. Saves files to the right folders
4. Creates metadata.json
5. Returns the new release data

Alternatively, the frontend can call the existing endpoints in sequence (/upload then /metadata). Decide which approach is cleaner when we get to Step 7.

### Potentially Needed: Artwork Serving
The frontend needs to display artwork thumbnails. Options:
- **Option A:** Express serves static files from the Releases folder (add `express.static()`)
- **Option B:** Next.js reads images from the filesystem directly
- **Option A is simpler** — add a route like GET /releases/:releaseId/artwork that returns the image file

### CORS
The Express API already has CORS enabled (`app.use(cors())`), so cross-origin requests from localhost:3000 to localhost:3001 should work. If not, we'll troubleshoot.

---

## Definition of Done (Mini-MVP 1)

When all of these are true, Mini-MVP 1 is complete:

- [ ] Next.js app runs on localhost:3000
- [ ] Homepage shows all releases with artwork, title, artist, genre, date
- [ ] Clicking a release shows its full detail page
- [ ] Detail page shows platform upload status for all platforms
- [ ] Detail page shows label submission history
- [ ] Can log a new platform upload in under 10 seconds (click button → fill form → save)
- [ ] Can log a new label submission in under 10 seconds
- [ ] Submissions waiting 14+ days are visually highlighted
- [ ] Can create a new release through the UI (with file upload)
- [ ] Created release appears on the homepage immediately
- [ ] Tested with at least one real track end-to-end

---

## How to Use This Prompt

Start a new conversation with Claude and say:

> "I'm building Mini-MVP 1 of my Release Management System. Please read the Release Management Master Prompt in Project Knowledge for full context. Then let's start with Step 1: Setting up the Next.js project. I've never used Next.js before, so please explain as we go."

Then work through the steps sequentially. After each step, test it before moving on.

If you need to start a new conversation mid-way, say:

> "I'm continuing Mini-MVP 1 of my Release Management System. Please read the Release Management Master Prompt and this Continuation Prompt in Project Knowledge. I've completed Steps 1-[X] and I'm on Step [X+1]. Here's where I left off: [describe current state]."

---

## Important Notes for Claude

- **The user is a beginner.** Explain concepts in plain language. Use music production analogies when possible.
- **Show working code first**, then explain why it works.
- **Small testable steps.** After each piece of code, tell the user how to test it (what to type in terminal, what to see in browser).
- **The Express API already exists and works.** Don't rebuild it. The frontend fetches data from it.
- **Express runs on port 3001, Next.js on port 3000.** They are separate apps.
- **No database.** All data is in metadata.json files inside release folders at `~/Documents/Music Agent/Releases/`.
- **The user has the Release Management Master Prompt in Project Knowledge** which contains full API details, data structures, and project history.
- **Keep styling simple.** Tailwind CSS utility classes. Functional first, pretty second. The user can improve styling later.
- **Don't use any additional libraries** unless absolutely necessary. No Redux, no SWR, no Zustand. Keep dependencies minimal for a beginner.
