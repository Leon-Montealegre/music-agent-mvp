# 🎛️ Continuation Prompt — March 21, 2026 (Session 7)

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.
Then read `16.03.26_Continuatuon_Prompt.md` for Phase 2 architecture decisions + PostgreSQL schema.
Then read `20.03.26_Continuation_Prompt.md` for full migration status.
Then read `22-continuation-prompt.md` for Session 4 (artwork fixes + CDN).
Then read `23 continuation prompt.md` for Session 5 (register page, user pill, login errors).
Then read `25-continuation-prompt.md` for Session 6 (settings page, admin panel).
Then read `26-continuation-prompt.md` for Session 7 (404 pages, forgot password, domain launch).

---

## Current Phase: CLOUD MIGRATION COMPLETE ✅ — Pre-Launch Polish In Progress

Branch: `cloud-migration`
Backend: Railway — https://music-agent-mvp-production.up.railway.app ✅ LIVE
Frontend: Vercel — https://musicagentchigui.com ✅ LIVE (custom domain)
Database: Railway PostgreSQL — connected and working ✅
File Storage: Cloudflare R2 — connected and working ✅
Auth: JWT backend + NextAuth.js frontend — working ✅
Email: Resend — DNS records added, verification pending (can take a few hours)

---

## What Was Done This Session (March 21, 2026 — Session 7)

### Step 8 — 404 / Error Pages ✅
- Created `frontend/src/app/not-found.js` — global 404 page, Server Component, dark theme, large "404" + 🎵 emoji, "← Back to Catalogue" button
- Created `frontend/src/app/error.js` — global runtime error boundary, requires `'use client'`, props `{ error, reset }`, "Try again" + "← Back to Catalogue" buttons
- Improved inline not-found states in `/releases/[releaseId]/page.js` and `/collections/[collectionId]/page.js` with proper headings and back links
- Split `if (loading || !track)` into two separate guards in releases page (loading state vs null track state)

### Step 9 — Forgot Password Flow ✅
- Created `file-handler/migrations/005_add_password_reset_tokens.sql`:
  - Table: `password_reset_tokens` with `user_id UUID FK`, `token TEXT UNIQUE`, `expires_at TIMESTAMPTZ`, `used_at TIMESTAMPTZ`
  - Index on `token` column for fast lookups
  - **Must be applied manually in Railway's PostgreSQL query editor**
- Updated `file-handler/routes/auth.js`:
  - Added `const crypto = require('crypto')` at top
  - Added `sendPasswordResetEmail(toEmail, resetUrl)` helper — calls Resend HTTP API directly via Node.js `fetch` (no npm package needed)
  - Added `POST /auth/forgot-password` — generates token, stores in DB, sends email, always returns 200 (no email enumeration)
  - Added `POST /auth/reset-password` — validates token (exists, not expired, not used), updates password with bcrypt, marks token used
  - Uses env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`
- Created `frontend/src/app/forgot-password/page.js` — email form, "Check your inbox" success state
- Created `frontend/src/app/reset-password/page.js` — reads `?token=` from URL, `useSearchParams()` wrapped in `<Suspense>`, new+confirm password fields, handles missing/expired/used token states
- Updated `frontend/src/app/login/page.js` — added "Forgot password?" link next to Password label
- Updated `frontend/src/middleware.js` — added `forgot-password` and `reset-password` to public routes exclusion list in matcher

### Domain Launch ✅
- Purchased `musicagentchigui.com` on Namecheap
- Pointed Namecheap nameservers to Vercel: `ns1.vercel-dns.com` + `ns2.vercel-dns.com`
- Added domain to Vercel project — shows green "Valid Configuration"
- Added 4 Resend DNS records in Vercel DNS panel for `musicagentchigui.com` (eu-west-1 region):
  1. `resend._domainkey` TXT — DKIM key
  2. `send` TXT — `v=spf1 include:amazonses.com ~all`
  3. `send` MX — `feedback-smtp.eu-west-1.amazonses.com`
  4. `_dmarc` TXT — `v=DMARC1; p=none;`
- Clicked "Verify DNS Records" in Resend — status is "pending" (normal, DNS propagation takes a few hours)
- Updated env vars:
  - Vercel: `NEXTAUTH_URL` → `https://musicagentchigui.com`
  - Railway: `FRONTEND_URL` → `https://musicagentchigui.com`
  - Railway: `RESEND_FROM_EMAIL` → `Music Agent <noreply@musicagentchigui.com>`
  - Railway: `RESEND_API_KEY` — was already set from before, unchanged
- Site is now live at https://musicagentchigui.com ✅

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
| 8 | 404 + global error pages | ✅ Done | 🟡 Medium |
| 9 | Forgot password flow | ✅ Done | 🟡 Medium |
| 10 | File upload size limit (1GB cap) | 🔜 Next | 🔴 Critical |
| 11 | Storage usage monitoring | 🔜 | 🟠 High |
| 12 | Mobile responsive design | 🔜 | 🟠 High |
| 13 | Public-ready feature suggestions | 🔜 | 🟡 Medium |
| 14 | Onboarding / empty state for new users | 🔜 | 🟢 Low |
| 15 | Email notifications on status change | 🔜 | 🟢 Low |
| 16 | Bulk actions on releases/collections | 🔜 | 🟢 Low |

---

## Next Task: Step 10 — File Upload Size Limit (1GB cap)

File to edit: `file-handler/server.js`

### What to change

Currently multer has no size limit:
```js
const upload = multer({ storage: multer.memoryStorage() })
```

Change it to enforce a 1GB limit across all file types:
```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 * 1024 } // 1GB
})
```

This single change applies to ALL upload routes since they all reference the same `upload` instance (`trackArtworkUpload`, `releaseNotesUpload`, `collectionPromoEntryUpload`, `collectionLabelEntryUpload` all alias to it).

Also add proper error handling for when the limit is exceeded — multer throws a `MulterError` with `code === 'LIMIT_FILE_SIZE'`. Add this middleware to `server.js` after the routes:
```js
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 1GB.' })
  }
  next(err)
})
```

No frontend changes needed — the upload form will receive a 413 error if someone tries to upload over 1GB, which the existing error handling will display.

---

## Step 11 — Storage Usage Monitoring

Two approaches to discuss with the user and implement one:

### Option A — Manual (Cloudflare R2 dashboard)
No code needed. In Cloudflare dashboard:
- Go to R2 → `music-agent-mvp` bucket → **Metrics** tab
- Shows total storage used, object count, and data transfer
- Doesn't show per-user breakdown

### Option B — Admin panel storage view (recommended)
Add a storage column to the admin users table. This requires:
1. Tracking file sizes at upload time — add a `file_size_bytes BIGINT` column to the relevant DB tables (or a separate `files` table)
2. New endpoint `GET /admin/storage` — returns total R2 usage + per-user breakdown
3. Display in admin panel

**Note for next session:** Discuss with user which approach they prefer before building.

---

## Step 12 — Mobile Responsive Design

The app currently has no mobile-specific styling. Pages use fixed-width Tailwind classes that don't adapt to small screens.

Approach: use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to make layouts adapt.

Key pages to update:
- `frontend/src/app/layout.js` — header nav (hamburger menu on mobile?)
- `frontend/src/app/page.js` — releases grid
- `frontend/src/app/releases/[releaseId]/page.js` — release detail
- `frontend/src/app/collections/page.js` and `[collectionId]/page.js`
- Login / register pages — forms should stack vertically on mobile

**Note for next session:** Do one page at a time. Start with layout.js header since it affects every page.

---

## Step 13 — Public-Ready Feature Suggestions

Discuss with user before building any of these. Recommended priority order:

| Feature | Why it matters | Effort |
|---|---|---|
| Rate limiting on auth endpoints | Prevent brute force on login/register/forgot-password | Low — add `express-rate-limit` package |
| Terms of Service + Privacy Policy pages | Required for any public web app | Low — static pages |
| SEO metadata (og:title, og:description, favicon) | Makes sharing links look good | Low |
| Landing/marketing page at root | Currently `/` redirects to login — a landing page explains what the app is | Medium |
| Email verification on registration | Low priority given current user base, but adds legitimacy | Medium |

---

## Files Changed This Session

| File | Change |
|------|--------|
| `frontend/src/app/not-found.js` | Created — global 404 page |
| `frontend/src/app/error.js` | Created — global error boundary (`'use client'`) |
| `frontend/src/app/releases/[releaseId]/page.js` | Split loading/null guard; added "Track not found" state |
| `frontend/src/app/collections/[collectionId]/page.js` | Improved inline not-found state |
| `file-handler/migrations/005_add_password_reset_tokens.sql` | Created — password_reset_tokens table |
| `file-handler/routes/auth.js` | Added forgot-password + reset-password endpoints; Resend email helper |
| `frontend/src/app/forgot-password/page.js` | Created — email input form |
| `frontend/src/app/reset-password/page.js` | Created — token-based password reset form |
| `frontend/src/app/login/page.js` | Added "Forgot password?" link |
| `frontend/src/middleware.js` | Added forgot-password + reset-password to public routes |

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
FRONTEND_URL=https://musicagentchigui.com
RESEND_API_KEY=... (set from before — do not change)
RESEND_FROM_EMAIL=Music Agent <noreply@musicagentchigui.com>
PORT=(set automatically by Railway — do NOT add manually)
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://music-agent-mvp-production.up.railway.app
NEXTAUTH_SECRET=... (regenerated session 3)
NEXTAUTH_URL=https://musicagentchigui.com
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
| Resend DNS verification | Pending | DNS propagating — check resend.com/domains in a few hours, should auto-verify |
| Migration 005 not yet applied | 🔴 Critical | Run `005_add_password_reset_tokens.sql` in Railway PostgreSQL query editor before using forgot password |
| File upload has no size limit | 🔴 Critical | Next task — add 1GB multer limit |
| Artwork CDN — custom domain | Low | Replace pub-xxx.r2.dev with custom domain later |
| `PATCH /auth/me` doesn't update `isAdmin` in session via `updateSession` | Low | Admin flag doesn't change via settings, so no practical impact |

---

## Development Rules (Reminders)
- Always work on `cloud-migration` branch — never commit to `main`
- Always run `git ls-files | grep -i env` before pushing — must return nothing
- Small testable steps — test locally with `npm run dev` before pushing
- Explain everything — developer is a beginner
- Never rebuild working code — only extend
