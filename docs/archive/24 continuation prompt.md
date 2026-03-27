Music Agent MVP — Continuation Prompt
This is a Next.js (App Router, 'use client') + Node.js (file-handler/server.js) music distribution management app. The workspace is at /sessions/.../mnt/music-agent-mvp. Auth is NextAuth.js JWT — token stored in _token via setToken() in Providers.js; all API calls use apiFetch() which injects Authorization: Bearer. File storage is Cloudflare R2. Database is PostgreSQL via pg.
What's already built and working:

Release (track) detail pages with notes, file attachments, distribution entries
Collection detail pages (same structure, multi-track)
Label deal pages (per release and per collection)
Promo pages (per release and per collection)
Contacts page — global view, pulls from /contacts endpoint
Files page — global view with Audio/Video/Label/Promo/General filters, pulls from /files endpoint (DB docs + R2 audio/video)
Mark as Signed flow — updates both releases.is_signed and distribution_entries.status = 'Signed'
File upload via FileAttachments component (shared across track, label, promo pages)
Login / signup

Remaining steps to build:
Step 6 — Settings page
A user-facing settings page at /settings. Should include: change display name, change email, change password (current password required), and optionally a danger zone to delete account. PATCH /auth/me or similar endpoint for updates. Password change should require currentPassword + newPassword fields, verified server-side with bcrypt.
Step 7 — Admin panel
A protected /admin page, only accessible if user.role === 'admin' (or equivalent flag in the DB). Should list all users (id, email, name, created_at, role) and allow deleting a user (which should cascade-delete their releases, collections, files, contacts etc., or at minimum mark them inactive). Needs GET /admin/users and DELETE /admin/users/:userId server endpoints, both guarded by an admin-only middleware check.
Step 8 — 404 / error pages
Add not-found.jsx at frontend/src/app/not-found.jsx for global 404s, plus inline not-found states on dynamic routes (release, collection, label, promo pages already return early with an error state — these should be styled consistently). Also add error.jsx at frontend/src/app/error.jsx for unexpected runtime errors (Next.js App Router error boundary).
Step 9 — Forgot password flow
A /forgot-password page where the user enters their email. Server sends a reset link with a short-lived signed token (can use crypto.randomBytes + store in a password_resets table with token, user_id, expires_at). A /reset-password?token=... page lets them set a new password. Server validates token hasn't expired, hashes new password with bcrypt, deletes the token row. Email sending via nodemailer or an existing transactional email integration if one exists.
Possible additional steps to consider:

Onboarding / empty state — first-time users land on a blank dashboard; a simple "Add your first track" welcome card could help
Email notifications — notify the user when a submission status changes (e.g. a label responds)
Bulk actions on releases/collections — select multiple and delete or export