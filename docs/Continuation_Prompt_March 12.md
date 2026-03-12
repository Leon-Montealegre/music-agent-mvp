Continuation Prompt — Music Agent MVP - March 12 6:04am
Context
Read these files before starting:

~/Documents/music-agent-mvp/frontend/src/app/page.js

~/Documents/music-agent-mvp/frontend/src/app/releases/new/page.js

~/Documents/music-agent-mvp/frontend/src/app/releases/[releaseId]/page.js

~/Documents/music-agent-mvp/frontend/src/components/EditMetadataModal.js

~/Documents/music-agent-mvp/file-handler/server.js

Also run these to understand the current data shapes:

bash
curl http://localhost:3001/releases/$(ls ~/Documents/Music\ Agent/Releases/ | head -1) | python3 -m json.tool
curl http://localhost:3001/collections | python3 -m json.tool
sed -n '1750,1870p' ~/Documents/music-agent-mvp/file-handler/server.js
Architecture Decision — Collection Distribution
EPs and Albums need their own distribution tracking, exactly like individual tracks. A user should be able to mark an entire EP as submitted to a label, signed, or released on platforms. This means:

The server.js collections endpoints need distribution: { release: [], submit: [], promote: [] } added to every new collection at creation time

The server needs new endpoints mirroring track distribution:

PATCH /collections/:collectionId/distribution — add entry

DELETE /collections/:collectionId/distribution/:pathType/:timestamp — remove entry

The /collections GET list endpoint needs to return distribution data so the homepage status filter can use it

The homepage status filter needs to check collection-level distribution when filtering EPs/Albums

Changes — Page by Page (7 pages total)
Page 1 of 7: server.js
Add collection distribution endpoints — after the existing PATCH /collections/:collectionId endpoint, add:

text
PATCH /collections/:collectionId/distribution
  body: { path: 'release'|'submit'|'promote', entry: { ...data } }
  → appends entry to collections metadata.distribution[path]

DELETE /collections/:collectionId/distribution/:pathType/:timestamp
  → removes matching entry by timestamp

PATCH /collections/:collectionId/distribution/:pathType/:timestamp
  → updates matching entry by timestamp
Also update POST /collections to always initialise distribution: { release: [], submit: [], promote: [] } in the saved metadata.

Also update GET /collections list endpoint to include distribution in each returned collection object.

Test after: curl -X PATCH http://localhost:3001/collections/[any-collection-id]/distribution -H "Content-Type: application/json" -d '{"path":"submit","entry":{"label":"Test Label","platform":"Email","status":"Submitted","timestamp":"2026-01-01T00:00:00.000Z"}}'

Page 2 of 7: page.js (Homepage)
Fix status filtering for EPs/Albums — when status filter is active, check collection.distribution directly (same logic as tracks). An EP shows under "Submitted" if collection.distribution.submit.length > 0 and no signed entry exists, etc.

Remove "Sort by Releases" and "Sort by Submissions" from the sort dropdown.

Fix Key sorting — ascending/descending button must work. The keyOrder array and sort direction toggle are both present but the direction isn't being applied. Fix the sort logic so pressing Ascending/Descending actually reverses the order for all sort types including Key.

Test after: Select "EPs" filter + "Submitted" status — only EPs with submissions should show. Test ascending/descending on Key sort.

Page 3 of 7: releases/new/page.js
Three small fixes:

Remove "Remix" from collection creation — the "Create new EP / Album / Remix" radio label should say "Create new EP / Album". The type buttons should only be ['EP', 'Album'] (Remix already removed from buttons but label text still says Remix).

Remove placeholder text — e.g. Summer EP or any placeholder in the collection name field should be removed (empty string).

Remove the Production Date field from the "Create new collection" sub-form — the date is not needed when creating a collection inline during track upload.

Change button text — + Upload Track in the header of page.js should read + Add Track. Also the audio file upload should already be required — confirm it is.

Test after: Go to /releases/new, expand "Create new EP / Album", confirm no placeholder text, no Remix option, no date field.

Page 4 of 7: EditMetadataModal.js
Same three fixes as Page 3 but in the Edit modal:

Remove "Remix" from the radio label text "Create new EP / Album / Remix" → "Create new EP / Album"

Remove the ['EP', 'Album', 'Remix'] array → ['EP', 'Album']

Remove the orange Remix ternary styling branch

Remove placeholder text from the collection name input

Remove the Production Date field from the new collection sub-form

Test after: Open Edit Track on any track, expand "Create new EP / Album", confirm no Remix, no placeholder, no date field.

Page 5 of 7: releases/[releaseId]/page.js
Three fixes:

Move EP/Album tag to the right of track title — currently it sits above the title. Move it inline, to the right of <h1> on the same line. Format: Track Title [EP badge] → EP Name. If the EP has artwork uploaded, show a small thumbnail (32x32px rounded) to the left of the badge.

To check if the collection has artwork, fetch it from http://localhost:3001/collections/${collectionId}/artwork — if the response is an image (not 404), show it. Use a simple onError handler on an <img> tag to hide it gracefully if no artwork exists.

Bring back edit/delete emojis — the Edit Track and Delete Track buttons at the bottom should have emojis: ✏️ Edit Track and 🗑️ Delete Track Permanently.

Confirm artwork display — the sidebar artwork should show if track.versions?.primary?.files?.artwork?.length > 0. This should already be fixed from the previous session but confirm it works.

Test after: Open a track that belongs to an EP — title should show inline with EP badge to its right. Open a track with no collection — no badge, clean title.

Page 6 of 7: collections/[collectionId]/page.js (CREATE NEW FILE)
This page does not exist yet. Create it at:
~/Documents/music-agent-mvp/frontend/src/app/collections/[collectionId]/page.js

It should mirror the structure of releases/[releaseId]/page.js but for collections. Sections:

Header:

Collection title + artist

Type badge (EP / Album)

Status badges (Submitted / Signed / Released) based on collection-level distribution

Back to Catalogue link

Left sidebar:

Collection artwork (if uploaded), otherwise vinyl placeholder

Genre, production date

Track count

Collection ID (read only)

Edit Collection button (opens edit modal inline)

Right content — 4 sections:

Tracks — list of all tracks in this collection with links to their detail pages. Show each track's title, BPM, key, and its own submission/release status badges. Allow reordering (up/down buttons). Allow removing a track from the collection.

Label Submissions — identical to the track version. Log submissions, mark as signed, edit/delete entries. Uses PATCH /collections/:collectionId/distribution with path: 'submit'.

Platform Distribution — identical to track version. Uses path: 'release'.

Notes — simple text notes field, saved via PATCH /collections/:collectionId with { notes: '...' }.

Bottom actions:

✏️ Edit Collection — opens a simple modal to edit title, artist, genre

🗑️ Delete Collection — with confirmation modal. When deleting, also patch all member tracks to remove their collectionId and reset releaseFormat to 'Single'

Test after: Navigate to an EP from the catalogue — full page should load with all sections. Add a submission, confirm it saves. Click a track in the list — navigates to track detail page.

Page 7 of 7: EditMetadataModal.js — collection display fix
When a track is already in a collection, the modal should pre-select the correct radio button ("Add to existing EP / Album") and pre-select the correct collection in the dropdown — not default to "Standalone Single".

Currently grouping always starts as 'standalone' even if the track has a collectionId. Fix the initial state:

js
const [grouping, setGrouping] = useState(
  currentCollectionId ? 'existing' : 'standalone'
)
const [selectedCollectionId, setSelectedCollectionId] = useState(
  currentCollectionId || ''
)
Test after: Edit a track that's already in an EP — the modal should open with "Add to existing EP / Album" pre-selected and the correct EP pre-selected in the dropdown.

Rules for Each Page
Replace entire file with clean code — no partial edits

After each file, confirm with a test command or browser check before moving to next

Keep a running count e.g. "Page 2 of 7 complete"

At the end of each page give a 3-bullet summary of what changed

