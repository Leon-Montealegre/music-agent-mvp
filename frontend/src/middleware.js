// middleware.js — Route protection
//
// This file runs before EVERY page load (on the server edge).
// If the user isn't signed in, it redirects them to /login.
//
// How it works:
//   NextAuth's built-in middleware checks for a valid session cookie.
//   If no cookie exists → redirect to the signIn page (/login).
//   If a valid cookie exists → let the request through.
//
// The "matcher" config below excludes routes that should be public:
//   - /login         → the login page itself (obviously public)
//   - /api/auth/*    → NextAuth's own API routes (signin/signout/session)
//   - /_next/*       → Next.js internal assets (JS, CSS, etc.)
//   - /favicon.ico   → browser icon
//   - /logo.png      → your logo (shown on the login page before signing in)

export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
