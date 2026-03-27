#22 🎛️ Continuation Prompt — March 18, 2026 at 11:32pm

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.
Then read `16.03.26_Continuatuon_Prompt.md` for Phase 2 architecture decisions + PostgreSQL schema.
Then read `20.03.26_Continuation_Prompt.md` for full migration status.
Then read `21.3 continuation prompt march 18.md` for Session 3 bug fixes.

---

## Current Phase: CLOUD MIGRATION COMPLETE ✅

Branch: `cloud-migration`
Backend: Railway — https://music-agent-mvp-production.up.railway.app ✅ LIVE
Frontend: Vercel — https://music-agent-mvp.vercel.app ✅ LIVE
Database: Railway PostgreSQL — connected and working ✅
File Storage: Cloudflare R2 — connected and working ✅
Auth: JWT backend + NextAuth.js frontend — working ✅

---

## What Was Done This Session (March 18, 2026 — Session 4)

### Artwork Bug Fixed ✅
- Root cause: `CollectionCard` in `page.js` was checking `item.fileCounts?.artwork > 0`
  which is never populated by the PostgreSQL API — always undefined, always showed placeholder
- Root cause: `ReleaseCard.js` was checking a stale condition (old JSON-era field)
- Fix: Both components now always render `<img>` and use `onError` to show the SVG
  fallback only when the image actually fails to load
- Pattern used in both files:
  ```jsx
  <img
    src={`${API_BASE_URL}/releases/${release.releaseId}/artwork`}
    alt={release.title}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
  />
  <div style={{ display: 'none', ... }}>
    <VinylSVG /> {/* fallback */}
  </div>
Artwork CDN Performance Fix ✅
Artwork was slow because Railway was streaming files from R2 through the server

Added R2_PUBLIC_URL env var to Railway (Cloudflare R2 Public Development URL)

Both GET artwork endpoints now return a 302 redirect to the R2 public URL directly

Browser fetches image straight from Cloudflare CDN — near-instant load

Fallback to streaming remains if R2_PUBLIC_URL is not set

Verified: curl -I .../artwork returns HTTP/2 302 with correct location: header

Cleanup ✅
Removed GET /debug-r2 endpoint from server.js

Fixed false "Backend not reachable" error — catch block now only shows error
screen on TypeError (real network failure), not on HTTP errors like 401

Environment Variables
Backend (Railway)
text
DATABASE_URL=postgresql://... (public URL, not internal)
JWT_SECRET=...
R2_ACCOUNT_ID=a1bfaf248e7a05fbf6c2914c9916ff1f  (32 chars exactly)
R2_ACCESS_KEY_ID=9fc8c567ce16be99b3ca100fd4190130
R2_SECRET_ACCESS_KEY=ce0d055953ddfee98f954bab14af0ec49112e8b6893979870bc9fc1a31c13415
R2_BUCKET_NAME=music-agent-mvp
R2_PUBLIC_URL=https://pub-3c05591763454110a291e9540ef84fd3.r2.dev
PORT=(set automatically by Railway — do NOT add manually)
Frontend (Vercel)
text
NEXT_PUBLIC_API_URL=https://music-agent-mvp-production.up.railway.app
NEXTAUTH_SECRET=... (regenerated session 3)
NEXTAUTH_URL=https://music-agent-mvp.vercel.app
Test Credentials
Email: you@example.com / Password: yourpassword / Name: Mathias

Token shortcut:

bash
TOKEN=$(curl -s -X POST https://music-agent-mvp-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' | jq -r .token)
Known Issues / Still To Do
Issue	Priority	Notes
Artwork CDN — custom domain	Low	Replace pub-xxx.r2.dev with custom domain later
Mobile responsive redesign	Phase 3	Tailwind CSS recommended per master prompt
GET /collections/:id/notes/files/:filename still has authMiddleware	Low	Fine — notes files are private
Git Commits (This Session)
Description
fix: always attempt artwork load with onError fallback
chore: remove debug-r2 endpoint, fix false backend-not-reachable error
perf: redirect artwork to R2 public CDN instead of streaming through Railway
Next Phase: Phase 3 — CRM Features
Per the master prompt roadmap, these are next:

Shared contacts store — contacts table in PostgreSQL, referenced by ID across releases

"Choose existing contact" picker — when adding contacts to label/promo entries

Follow-up reminders — set follow-up date on submissions, overdue badge on homepage

Label response tracking — No Reply / Passed / Interested / Signed per submission

Activity feed — chronological log of all actions

Mobile responsive redesign — Tailwind CSS

Development Rules (Reminders)
Always work on cloud-migration branch — never commit to main

Always run git ls-files | grep -i env before pushing — must only return the two .example files

Small testable steps — test with curl or the UI before moving on

Explain everything — developer is a beginner

Never rebuild working code — only extend