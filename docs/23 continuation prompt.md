# 🎛️ Continuation Prompt — March 19, 2026 (Session 5)

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.
Then read `16.03.26_Continuatuon_Prompt.md` for Phase 2 architecture decisions + PostgreSQL schema.
Then read `20.03.26_Continuation_Prompt.md` for full migration status.
Then read `22-continuation-prompt.md` for Session 4 (artwork fixes + CDN).

---

## Current Phase: CLOUD MIGRATION COMPLETE ✅ — Pre-Launch Polish In Progress

Branch: `cloud-migration`
Backend: Railway — https://music-agent-mvp-production.up.railway.app ✅ LIVE
Frontend: Vercel — https://music-agent-mvp.vercel.app ✅ LIVE
Database: Railway PostgreSQL — connected and working ✅
File Storage: Cloudflare R2 — connected and working ✅
Auth: JWT backend + NextAuth.js frontend — working ✅

---

## What Was Done This Session (March 19, 2026 — Session 5)

### Task 1 — Register Page ✅
- Created `frontend/src/app/register/page.js`
- Fields: Name, Email, Password, Confirm Password
- On success: calls `POST /auth/register` then auto signs in via NextAuth and redirects to `/`
- Validates passwords match before submitting
- Shows error if email already exists (409)
- Added "Don't have an account? Register here" link on `/login`
- Added "Already have an account? Log in" link on `/register`

### Task 2 — User Pill + Logout in Header ✅
- Created `frontend/src/components/UserPill.js` (Client Component)
- Shows: first letter initial in a circle + user's name + "| Log out" link
- Logout calls `signOut({ callbackUrl: '/login' })`
- Inserted `<UserPill />` in `frontend/src/app/layout.js` between Settings and Buy Me Coffee
- Fixed root cause: `authorize` function in `frontend/src/lib/auth.js` was not returning `name`
  - Updated return to: `{ id: data.user?.id, email: data.user?.email, name: data.user?.name, token: data.token }`
- Fixed JWT callback: added `token.name = user.name`
- Fixed session callback: added `session.user.name = token.name`

### Task 3 — Friendly Login Error Messages ✅
- `frontend/src/app/login/page.js` already had error state — extended it
- Error clears when user starts typing (onChange on email + password fields)
- Network failure (fetch throws) → "Could not connect to server. Please try again."
- Wrong credentials (result?.error) → "Invalid email or password. Please try again."
- signIn() call wrapped in try/catch

---

## Pre-Launch Roadmap — Full Checklist

This roadmap was created to finish the cloud migration and make the app ready
to share with a small group of musicians.

| # | Task | Status | Priority |
|---|------|--------|----------|
| 1 | Register page | ✅ Done | 🔴 Critical |
| 2 | Logout button + user pill in header | ✅ Done | 🔴 Critical |
| 3 | Friendly login error messages | ✅ Done | 🔴 Critical |
| 4 | Persistent sessions (30-day maxAge) | 🔜 Next | 🟠 High |
| 5 | Empty states on homepage | 🔜 | 🟠 High |
| 6 | Settings page in UI | 🔜 | 🟠 High |
| 7 | Admin panel (list + delete users) | 🔜 | 🟡 Medium |
| 8 | 404 + global error pages | 🔜 | 🟡 Medium |

---

## Next Task: Task 4 — Persistent Sessions

File to edit: `frontend/src/lib/auth.js`

Add a session config block:
```js
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30 days in seconds
}
Do NOT change anything else in auth.js.
Test: log in, close browser entirely, reopen — confirm still logged in.

Task 5 — Empty States (after Task 4)
File to edit: frontend/src/app/page.js

After releases/collections load, if arrays are empty show:

Icon 🎵, heading "No releases yet", subtext "Create your first release to get started"

A button "✚ Add your first release" — same action as the existing Add Track button

Same pattern for collections if empty

Task 6 — Settings Page in UI (after Task 5)
File to edit: frontend/src/app/settings/page.js
Backend endpoints already exist: GET /settings and PATCH /settings

On load: fetch GET /settings → populate fields

Fields: Artist Name (text), Default Genre (text)

Save button → PATCH /settings

Show "Settings saved ✓" for 2 seconds after saving

Read-only account info: Email + Member since (from useSession())

Task 7 — Admin Panel (after Task 6)
Requires running this SQL in Railway PostgreSQL console FIRST:

sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
Backend: add adminMiddleware + GET /admin/users + DELETE /admin/users/:userId
Frontend: create frontend/src/app/admin/page.js — table of users with delete button
Show "Admin" link in UserPill or header only if session.user.isAdmin === true
Pass isAdmin through JWT + session callbacks in auth.js

Task 8 — 404 + Error Pages (after Task 7)
Create frontend/src/app/not-found.js — "404 — Page not found" with link back to /

Create frontend/src/app/error.js — 'use client', "Something went wrong" + reset() button

Dark theme matching the rest of the app. No other files touched.

Files Changed This Session
File	Change
frontend/src/app/register/page.js	Created — new register page
frontend/src/app/login/page.js	Added register link + improved error handling
frontend/src/components/UserPill.js	Created — user name + logout pill
frontend/src/app/layout.js	Added <UserPill /> import + insertion
frontend/src/lib/auth.js	Fixed authorize return, JWT callback, session callback
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
Development Rules (Reminders)
Always work on cloud-migration branch — never commit to main

Always run git ls-files | grep -i env before pushing — must return nothing

Small testable steps — test locally with npm run dev before pushing

Explain everything — developer is a beginner

Never rebuild working code — only extend