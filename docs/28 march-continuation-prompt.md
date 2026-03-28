# 🎛️ Continuation Prompt — March 28, 2026 (Session 8)

Always read `MASTER_PROMPT_MARCH_15_2026.md` first for full context.
Then read `16.03.26_Continuatuon_Prompt.md` for Phase 2 architecture decisions + PostgreSQL schema.
Then read `20.03.26_Continuation_Prompt.md` for full migration status.
Then read `22-continuation-prompt.md` for Session 4 (artwork fixes + CDN).
Then read `23 continuation prompt.md` for Session 5 (register page, user pill, login errors).
Then read `25-continuation-prompt.md` for Session 6 (settings page, admin panel).
Then read `26-continuation-prompt.md` for Session 7 (404 pages, forgot password, domain launch).
Then read `27-continuation-prompt.md` for Session 8 (email suppression: unsubscribe, snooze, notifications toggle).

---

## Current Phase: CLOUD MIGRATION COMPLETE ✅ — Pre-Launch Polish In Progress

Branch: `cloud-migration`
Backend: Railway — https://music-agent-mvp-production.up.railway.app ✅ LIVE
Frontend: Vercel — https://musicagentchigui.com ✅ LIVE (custom domain)
Database: Railway PostgreSQL — connected and working ✅
File Storage: Cloudflare R2 — connected and working ✅
Auth: JWT backend + NextAuth.js frontend — working ✅
Email: Resend — DNS verified, reminders@musicagentchigui.com ✅

---

## What Was Done This Session (March 28, 2026 — Session 8)

### Step — Email Suppression System ✅

**Problem:** Admin-deleted accounts were still receiving follow-up reminder emails if the cron ran before the deletion. No way to stop emails without logging in.

**Root cause:** The cron query had no awareness of user account status — it just JOINed on the email field and sent regardless.

**Solution — three layers of protection built:**

#### 1. Migration 008 — new columns on `users` table
File: `file-handler/migrations/008_add_email_notifications.sql` — **must be run manually in Railway PostgreSQL query editor**

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS users_unsubscribe_token_idx ON users (unsubscribe_token);
```

- `email_notifications_enabled`: boolean flag, default TRUE. Set to FALSE via unsubscribe link or settings toggle.
- `unsubscribe_token`: a random UUID per user, used as a secret to authorize one-click unsubscribe and snooze without login.

#### 2. Cron query updated (`file-handler/server.js`)
- Added `COALESCE(ur.email_notifications_enabled, uc.email_notifications_enabled, TRUE) = TRUE` to the WHERE clause — users with the flag set to FALSE are silently skipped.
- Added `COALESCE(ur.unsubscribe_token, uc.unsubscribe_token) AS unsubscribe_token` to SELECT — passed to the email template.
- Also added `de.id` to the SELECT (was `row.id` already) — passed as `entryId` for the snooze link.

#### 3. Email template updated (`sendFollowUpEmail` in `file-handler/server.js`)
- Function now accepts `unsubscribeToken` and `entryId` params.
- Email now contains two new action buttons below the "Open entry" button:
  - **⏸ Snooze 10 days** — hits `GET /snooze?entryId=<id>&days=10&token=<unsubscribeToken>`
  - **Unsubscribe from all reminder emails** — hits `GET /unsubscribe?token=<unsubscribeToken>`
- Both are plain `<a href>` links — no login required, works from any email client.

#### 4. New backend endpoints (`file-handler/server.js`)

`GET /unsubscribe?token=<uuid>`
- Looks up user by `unsubscribe_token`, sets `email_notifications_enabled = FALSE`
- Returns a styled HTML confirmation page (no redirect needed)
- Safe: token is a random UUID, not guessable

`GET /snooze?entryId=<uuid>&days=<n>&token=<uuid>`
- Verifies that the `unsubscribe_token` belongs to the owner of that `distribution_entry`
- Pushes `follow_up_date` forward by N days (capped at 90), clears `last_reminded_at` so it will re-fire
- Returns a styled HTML confirmation page

#### 5. Settings page toggle (frontend + backend)

Backend — `file-handler/routes/auth.js`:
- Added `GET /auth/me/notifications` — returns `{ emailNotificationsEnabled: boolean }`
- Added `PATCH /auth/me/notifications` — body `{ emailNotificationsEnabled: boolean }`, updates the DB column

Frontend — `frontend/src/app/settings/page.js`:
- Added "Email Notifications" card between Default Artist Name and Legal
- Toggle switch (purple when on, grey when off) — clicking it immediately calls `PATCH /auth/me/notifications`
- Loads current preference from `GET /auth/me/notifications` on mount
- Shows "✅ Preference saved" / "❌ Failed to save" feedback inline

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
| 10 | Email suppression (unsubscribe, snooze, settings toggle) | ✅ Done | 🟠 High |
| 11 | File upload size limit (1GB cap) | 🔜 Next | 🔴 Critical |
| 12 | Storage usage monitoring | 🔜 | 🟠 High |
| 13 | Mobile responsive design | 🔜 | 🟠 High |
| 14 | Public-ready feature suggestions | 🔜 | 🟡 Medium |
| 15 | Onboarding / empty state for new users | 🔜 | 🟢 Low |
| 16 | Bulk actions on releases/collections | 🔜 | 🟢 Low |

---

## CRITICAL — Migration 008 Must Be Applied Before Deploying

Before pushing this session's changes to Railway, run this in the Railway PostgreSQL query editor:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS users_unsubscribe_token_idx ON users (unsubscribe_token);
```

The new cron query and the `/unsubscribe` + `/snooze` endpoints both read these columns — they will error if the migration hasn't been applied.

---

## Next Task: Step 11 — File Upload Size Limit (1GB cap)

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

## Files Changed This Session

| File | Change |
|------|--------|
| `file-handler/migrations/008_add_email_notifications.sql` | Created — adds `email_notifications_enabled` + `unsubscribe_token` to users table |
| `file-handler/server.js` | Updated `sendFollowUpEmail` (new params + unsubscribe/snooze links in email body); updated cron query (filter + token select); added `GET /unsubscribe` endpoint; added `GET /snooze` endpoint |
| `file-handler/routes/auth.js` | Added `GET /auth/me/notifications` and `PATCH /auth/me/notifications` endpoints |
| `frontend/src/app/settings/page.js` | Added email notifications toggle card (state, load on mount, save handler, UI) |

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
CRON_SECRET=... (set from before — do not change)
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
| Migration 008 not yet applied | 🔴 Critical | Run `008_add_email_notifications.sql` in Railway PostgreSQL query editor BEFORE pushing this session's code |
| Migration 005 not yet applied | 🔴 Critical | Run `005_add_password_reset_tokens.sql` in Railway if not already done (from Session 7) |
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
