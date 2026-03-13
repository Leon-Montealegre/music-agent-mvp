Perfect. Here are both documents — copy each into a `.md` file and save them in `~/Documents/music-agent-mvp/`.

***

## MASTER_PROMPT_MAR_13_2026.md

```markdown
# 🎛️ Music Release Management System — Master Prompt
**Last Updated:** March 13, 2026

---

## Project Overview
A personal release management dashboard for an electronic music artist. Tracks every release
across three paths: Release (platform uploads), Submit (label pitching), and Promote (promo deals).
Built local-first as an MVP, with cloud deployment planned next.

**Philosophy:** Management over automation. The system tracks and organises — it does not
auto-upload to platforms.

---

## Tech Stack
| Layer      | Tech                        | Port  |
|------------|-----------------------------|-------|
| Backend    | Node.js / Express           | 3001  |
| Frontend   | Next.js (App Router)        | 3000  |
| Storage    | JSON files on disk          | —     |
| Dev Tools  | macOS, Cursor IDE, GitHub Desktop | — |

---

## File Paths (Critical)
```
~/Documents/music-agent-mvp/
  file-handler/
    server.js                  ← entire Express API
    settings.json              ← app settings

~/Documents/Music Agent/
  Releases/
    [releaseId]/
      metadata.json
      versions/
        primary/
          audio/               ← WAV, MP3, etc.
      artwork/                 ← cover image
      video/                   ← video files
      label-deal/              ← contract documents
      notes/                   ← text notes + documents
  Collections/
    [collectionId]/
      metadata.json
      artwork/
      label-deal/
      notes/

~/Documents/music-agent-mvp/frontend/
  app/
    page.jsx                              ← Home / Catalogue
    releases/[releaseId]/
      page.jsx                            ← Release detail page
      label-deal/page.jsx                 ← Release label deal page
    collections/[collectionId]/
      page.jsx                            ← Collection detail page
      label-deal/page.jsx                 ← Collection label deal page
  components/
    Modal.jsx
    BackButton.jsx
    LogPlatformForm.jsx
    LogSubmissionForm.jsx
    DownloadModal.jsx
    DeleteTrackModal.jsx
    TrackNotes.jsx
    EditMetadataModal.jsx
    LabelContactForm.jsx
    ConfirmDeleteModal.jsx
  lib/
    api.js                                ← fetchRelease, updateDistribution, etc.
```

---

## releaseId Format
```
YYYY-MM-DD_ArtistName_TrackTitle
e.g. 2024-03-01_Doe_MyTrack
```

## collectionId Format
```
YYYY-MM-DD_ArtistName_CollectionTitle
e.g. 2024-06-01_Doe_SummerEP
```

---

## Core Concepts
- **3-Path Tracking:** Every action is `release` (platform upload), `submit` (label pitch), or `promote` (promo deal)
- **Versions:** Audio lives inside `versions.primary`. Each release has a primary version by default. Additional named versions (e.g. "Radio Edit") can be added.
- **Collections:** EPs and Albums that group multiple releases together. Have their own distribution, artwork, label deal, and promo tracking — identical structure to releases.
- **Signed Badge:** When a label submission is marked `signed`, a green "Signed" badge appears on the home page and detail page.
- **Released Badge:** When a platform entry has status `live`, a blue "Released" badge appears.
- **Promoted Badge (planned):** When a promo deal status is `live`, a pink/orange "Promoted" badge will appear.

---

## metadata.json Structure (Release)
```json
{
  "releaseId": "2024-03-01_Artist_Title",
  "metadata": {
    "title": "Track Title",
    "artist": "Artist Name",
    "genre": "Deep House",
    "bpm": 124,
    "key": "Am",
    "trackDate": "2024-03-01",
    "releaseDate": "2024-03-01",
    "releaseType": "Single",
    "releaseFormat": "Single",
    "collectionId": null,
    "distribution": {
      "release": [{ "platform": "Beatport", "status": "Live", "url": "...", "timestamp": "..." }],
      "submit":  [{ "label": "Anjuna", "platform": "Email", "status": "Pending", "timestamp": "..." }],
      "promote": [{ "promoName": "Blog Name", "status": "Live", "liveDate": "...", "notes": "...", "timestamp": "..." }]
    },
    "labelInfo": {
      "isSigned": false,
      "label": null,
      "signedDate": null,
      "contractDocuments": [],
      "contacts": []
    }
  },
  "versions": {
    "primary": {
      "versionName": "Primary Version",
      "versionId": "primary",
      "createdAt": "...",
      "files": {
        "audio":   [{ "filename": "track.wav", "size": 0, "duration": 0, "bitrate": 0, "sampleRate": 0, "channels": 0, "codec": "..." }],
        "artwork": [{ "filename": "cover.jpg", "size": 0 }],
        "video":   [{ "filename": "video.mp4", "size": 0 }]
      }
    }
  },
  "songLinks": [{ "id": "1234567890", "label": "Spotify", "url": "https://..." }],
  "notes": { "text": "", "documents": [] },
  "updatedAt": "..."
}
```

---

## API Endpoints Reference

### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server status check |
| GET | `/storage/status` | Disk space info |
| GET | `/settings` | App settings |
| PATCH | `/settings` | Update settings |

### Releases — Core
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/releases` | List all releases |
| GET | `/releases/:releaseId` | Get single release |
| POST | `/metadata` | Create/update metadata |
| PATCH | `/releases/:releaseId/metadata` | Edit track metadata fields |
| DELETE | `/releases/:releaseId` | Delete release + all files |

### Releases — Files
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/upload?releaseId=` | Original upload (creates version) |
| POST | `/releases/:releaseId/versions/primary/audio` | ✅ Add audio to existing primary version |
| DELETE | `/releases/:releaseId/versions/primary/audio/:filename` | Delete audio file |
| POST | `/releases/:releaseId/video` | ✅ Upload video (bypasses versions) |
| DELETE | `/releases/:releaseId/video/:filename` | ✅ Delete video file |
| GET | `/releases/:releaseId/artwork` | Serve artwork image |
| POST | `/releases/:releaseId/artwork` | Upload/replace artwork |
| DELETE | `/releases/:releaseId/artwork` | Delete artwork |
| GET | `/releases/:releaseId/files/:fileType/:filename` | Download any file |

### Releases — Distribution
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/releases/:releaseId/distribution` | Add distribution entry |
| PATCH | `/releases/:releaseId/distribution/:pathType/:timestamp` | Edit entry |
| DELETE | `/releases/:releaseId/distribution/:pathType/:timestamp` | Delete entry |
| PATCH | `/releases/:releaseId/sign` | Mark as signed by label |

### Releases — Song Links
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/song-links` | Add link (must include `id` field) |
| DELETE | `/releases/:releaseId/song-links/:id` | Delete link by id |

### Releases — Versions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/versions` | Add a named version (e.g. Radio Edit) |

### Releases — Label Deal
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/releases/:releaseId/label-deal/files` | Upload contract document |
| GET | `/releases/:releaseId/label-deal/files/:filename` | Download document |
| DELETE | `/releases/:releaseId/label-deal/files/:filename` | Delete document |
| POST | `/releases/:releaseId/label-deal/contacts` | Add contact |
| PATCH | `/releases/:releaseId/label-deal/contacts/:contactId` | Edit contact |
| DELETE | `/releases/:releaseId/label-deal/contacts/:contactId` | Delete contact |

### Collections — Core
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/collections` | Create EP or Album |
| GET | `/collections` | List all collections |
| GET | `/collections/:collectionId` | Get single collection |
| PATCH | `/collections/:collectionId` | Update collection metadata |
| DELETE | `/collections/:collectionId` | Delete collection |
| GET | `/collections/:collectionId/tracks` | Get enriched track list |

### Collections — Files & Distribution
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/collections/:collectionId/artwork` | Upload/replace artwork |
| DELETE | `/collections/:collectionId/artwork` | Delete artwork |
| PATCH | `/collections/:collectionId/distribution` | Add distribution entry |
| PATCH | `/collections/:collectionId/distribution/:pathType/:timestamp` | Edit entry |
| DELETE | `/collections/:collectionId/distribution/:pathType/:timestamp` | Delete entry |

### Collections — Label Deal
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/collections/:collectionId/label-deal/files` | Upload document |
| GET | `/collections/:collectionId/label-deal/files/:filename` | Download document |
| DELETE | `/collections/:collectionId/label-deal/files/:filename` | Delete document |
| POST | `/collections/:collectionId/label-deal/contacts` | Add contact |
| PATCH | `/collections/:collectionId/label-deal/contacts/:contactId` | Edit contact |
| DELETE | `/collections/:collectionId/label-deal/contacts/:contactId` | Delete contact |

---

## Badges (Home Page + Detail Pages)
| Badge | Colour | Trigger |
|-------|--------|---------|
| Signed | Green | A submit entry has status `signed` |
| Submitted | Yellow | Has submit entries, none signed |
| Released | Blue | A release entry has status `live` |
| Promoted | Pink/Orange | A promote entry has status `Live` *(planned)* |

---

## Home Page Filters (current)
All, Released, Submitted, Signed, Singles, EPs/Albums

**Planned:** Add "Promoted" filter

---

## Development Principles
- Show working code first, then explain why
- Small testable steps — run/test immediately
- Never rebuild working API — only extend it
- No database migrations — JSON files are the source of truth
- No Redux/Zustand — keep state local with useState
- No unnecessary libraries
- Always `await loadTrack()` / `await loadCollection()` after mutations to keep UI in sync

---

## Roadmap

### ✅ Completed
- Milestones 1–4: Backend API, file uploads, metadata, versions
- Mini-MVP 1: Release Dashboard (Next.js frontend)
- Release detail page with distribution, submissions, label deal, notes, files, links
- Collection detail page (EP/Album) with identical feature set
- Label Deal pages (contacts + documents) for both releases and collections
- Home page with catalogue, filters, sorting
- Quick artwork upload from sidebar (release + collection pages)
- Audio/video upload buttons in sidebar (empty state + existing)
- Artwork and video delete from sidebar
- Song link delete fix (now uses `link.id`, not array index)

### 🔜 Next: Promo Deal System
See CONTINUATION_PROMPT_MAR_13_2026.md for full spec.

### 🗓️ After Promo Deals
1. **Cloud Deployment** — host so any user can log in
2. **CRM features** — based on user feedback
3. **Mass Upload / Catalogue Import** — CSV import post-cloud; SoundCloud API import later
4. **SoundCloud + YouTube plugins** — embed/link integrations
5. **Media Player** — Wavesurfer.js (audio waveform player) + Video.js (video playback) served from local Express API
```

***