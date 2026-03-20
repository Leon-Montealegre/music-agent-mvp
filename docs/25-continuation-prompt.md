# 🎛️ Continuation Prompt — March 21, 2026 (Session 6)

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.
Then read `16.03.26_Continuatuon_Prompt.md` for Phase 2 architecture decisions + PostgreSQL schema.
Then read `20.03.26_Continuation_Prompt.md` for full migration status.
Then read `22-continuation-prompt.md` for Session 4 (artwork fixes + CDN).
Then read `23 continuation prompt.md` for Session 5 (register page, user pill, login errors).
Then read `25-continuation-prompt.md` for Session 6 (settings page, admin panel).

---

## Current Phase: CLOUD MIGRATION COMPLETE ✅ — Pre-Launch Polish In Progress

Branch: `cloud-migration`
Backend: Railway — https://music-agent-mvp-production.up.railway.app ✅ LIVE
Frontend: Vercel — https://music-agent-mvp.vercel.app ✅ LIVE
Database: Railway PostgreSQL — connected and working ✅
File Storage: Cloudflare R2 — connected and working ✅
Auth: JWT backend + NextAuth.js frontend — working ✅

---

## What Was Done This Session (March 21, 2026 — Session 6)

### Step 6 — Settings Page ✅
- Added `PATCH /auth/me` endpoint to `file-handler/routes/auth.js`
  - Accepts `{ name?, email?, currentPassword?, newPassword? }` — any combination
  - Email change checks for conflicts with other accounts (409)
  - Password change requires `currentPassword` verified with bcrypt, minimum 8 chars
  - Returns a fresh JWT token (with `is_admin` preserved) so session updates immediately
- Rewrote `frontend/src/app/settings/page.js` with four cards:
  1. Display Name — updates via PATCH /auth/me
  2. Email Address — updates via PATCH /auth/me
  3. Change Password — client-side match + length validation before hitting server
  4. Default Artist Name — existing feature, preserved unchanged
- Each card has independent Save button with "Saving…" / "✅ Saved!" / "❌ Error" feedback
- Fixed NextAuth session not updating after name/email change:
  - `auth.js` jwt callback now handles `trigger === 'update'` — reads `session.name`, `session.email`, `session.token` and writes them into the stored JWT
  - `session` callback now also exposes `session.user.email` (was missing before)
  - `updateSession()` call passes flat `{ name, email, token }` (not nested under `user`)

### Step 7 — Admin Panel ✅
- Created migration `file-handler/migrations/004_add_is_admin.sql`
  - `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;`
  - Must be run manually in Railway's PostgreSQL query editor before deploying
- Updated `generateToken()` in `auth.js` routes to include `isAdmin: user.is_admin || false`
- Updated login response to include `is_admin` in user object
- Updated `authMiddleware.js` to expose `req.user.isAdmin` from decoded JWT
- Created `file-handler/routes/admin.js` — registered at `/admin` in `server.js`:
  - `GET /admin/users` — returns all users (id, name, email, created_at, is_admin)
  - `DELETE /admin/users/:userId` — deletes user + all their data via DB cascade; blocks self-deletion
  - Both routes protected by `authMiddleware` + `adminMiddleware` (checks `req.user.isAdmin`)
- Threaded `isAdmin` through NextAuth: `authorize()` → `jwt` callback (`token.isAdmin`) → `session` callback (`session.user.isAdmin`)
- Created `frontend/src/app/admin/page.js`:
  - Shows "Access Denied" screen for non-admins
  - Table: avatar initial, name, email, joined date, Admin/User badge, Delete button
  - Delete is a two-step confirm/cancel flow — no accidental deletions
  - Can't delete yourself (button hidden for own row)
- Created `frontend/src/components/AdminButton.js`:
  - Only renders if `session.user.isAdmin === true` — invisible to regular users
  - Amber ghost style: `bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40`
  - Added to `layout.js` header between Feedback and Settings buttons
- **Bug fixed**: `PATCH /auth/me` was generating fresh tokens without `is_admin`, so admins who saved settings would silently lose admin access. Fixed by passing `is_admin: user.is_admin` into `freshUser` before calling `generateToken`.

---

## Pre-Launch Roadmap — Full Checklist

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Register page | ✅ Done | 🔴 Critical |
| 2 | Logout button + user pill in header | ✅ Done | 🔴 Critical |
| 3 | Friendly login error messages | ✅ Done | 🔴 Critical |
| 4 | Persistent sessions (30-day maxAge) | ✅ Done | 🟠 High |
| 5 | Empty states on homepage | ✅ Done | 🟠 High |
| 6 | Settings page (name, email, password) | ✅ Done | 🟠 High |
| 7 | Admin panel (list + delete users) | ✅ Done | 🟡 Medium |
| 8 | 404 + global error pages | 🔜 Next | 🟡 Medium |
| 9 | Forgot password flow | 🔜 | 🟡 Medium |
| 10 | Onboarding / empty state for new users | 🔜 | 🟢 Low |
| 11 | Email notifications on status change | 🔜 | 🟢 Low |
| 12 | Bulk actions on releases/collections | 🔜 | 🟢 Low |

---

## Next Task: Step 8 — 404 / Error Pages

### 8a — Global 404 page
File to create: `frontend/src/app/not-found.js`

Next.js App Router automatically renders this file when no route matches.
- Dark theme matching the rest of the app (`bg-gradient-to-br from-gray-900 via-gray-800 to-black`)
- Show a large "404" or emoji, a heading, short message, and a "← Back to Catalogue" link to `/`
- This is a **Server Component** — no `'use client'` needed, no hooks

### 8b — Global runtime error boundary
File to create: `frontend/src/app/error.js`

Next.js App Router renders this when an unexpected JS error is thrown inside a page.
- **Must** have `'use client'` at the top — Next.js requires error boundaries to be client components
- Props: `({ error, reset })` — `reset` is a function that retries rendering the segment
- Show a friendly message + a "Try again" button that calls `reset()`
- Same dark theme

### 8c — Consistent inline not-found states (optional polish)
The dynamic route pages (`/releases/[releaseId]/page.js`, `/collections/[collectionId]/page.js`, etc.) already return early with an error state when the API returns 404. These should be checked and styled consistently to match the new not-found page style.

No backend changes needed for Step 8.

---

## Files Changed This Session

| File | Change |
|------|--------|
| `file-handler/routes/auth.js` | Added `PATCH /auth/me` endpoint; updated `generateToken` to include `isAdmin`; fixed fresh token to preserve `is_admin`; login response now includes `is_admin` |
| `file-handler/authMiddleware.js` | Exposes `req.user.isAdmin` from decoded JWT |
| `file-handler/routes/admin.js` | Created — `GET /admin/users` + `DELETE /admin/users/:userId` with admin middleware |
| `file-handler/server.js` | Registered `adminRoutes` at `/admin` |
| `file-handler/migrations/004_add_is_admin.sql` | Created — adds `is_admin` column to users table |
| `frontend/src/app/settings/page.js` | Full rewrite — 4 cards: name, email, password, default artist |
| `frontend/src/app/admin/page.js` | Created — user table with delete flow, access denied guard |
| `frontend/src/components/AdminButton.js` | Created — amber ghost button, only renders for admins |
| `frontend/src/app/layout.js` | Added `<AdminButton />` import + insertion in header |
| `frontend/src/lib/auth.js` | Added `isAdmin` to authorize/jwt/session; fixed `trigger === 'update'` handling; exposed `session.user.email` |

---

## Environment Variables

### Backend (Railway)
```
DATABASE_URL=postgresql://... (public URL, not internal)
JWT_SECRET=...
R2_ACCOUNT_ID=a1bfaf248e7a05fbf6c2914c9916ff1f
R2_ACCESS_KEY_ID=9fc8c567ce16be99b3ca100fd4190130
R2_SECRET_ACCESS_KEY=ce0d055953ddfee98f954bab14af0ec49112e8b6893979870bc9fc1a31c13415
R2_BUCKET_NAME=music-agent-mvp
R2_PUBLIC_URL=https://pub-3c05591763454110a291e9540ef84fd3.r2.dev
PORT=(set automatically by Railway — do NOT add manually)
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://music-agent-mvp-production.up.railway.app
NEXTAUTH_SECRET=... (regenerated session 3)
NEXTAUTH_URL=https://music-agent-mvp.vercel.app
```

---

## Test Credentials
Email: you@example.com / Password: yourpassword / Name: Mathias

Token shortcut:
```bash
TOKEN=$(curl -s -X POST https://music-agent-mvp-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' | jq -r .token)
```

Admin account: admin@musicagent.com (is_admin = true in DB)
To promote a user to admin: `UPDATE users SET is_admin = true WHERE email = 'x@x.com';`

---

## Known Issues / Still To Do

| Issue | Priority | Notes |
|-------|----------|-------|
| Artwork CDN — custom domain | Low | Replace pub-xxx.r2.dev with custom domain later |
| Mobile responsive redesign | Phase 3 | Tailwind CSS recommended per master prompt |
| `GET /collections/:id/notes/files/:filename` still has authMiddleware | Low | Fine — notes files are private |
| `PATCH /auth/me` doesn't update `isAdmin` in session via `updateSession` | Low | Admin flag doesn't change via settings, so no practical impact |

---

## Development Rules (Reminders)
- Always work on `cloud-migration` branch — never commit to `main`
- Always run `git ls-files | grep -i env` before pushing — must return nothing
- Small testable steps — test locally with `npm run dev` before pushing
- Explain everything — developer is a beginner
- Never rebuild working code — only extend
