// middleware.js — Route protection
//
// This file runs before EVERY page load (on the server edge).
// If the user isn't signed in, it redirects them to /login.
//
// How it works:
//   NextAuth's withAuth() wraps your middleware function.
//   If no valid session cookie → redirect to the signIn page (/login).
//   If a valid cookie exists → let the request through.
//
// The "matcher" config below excludes routes that should be public:
//   - /login         → the login page itself (obviously public)
//   - /api/auth/*    → NextAuth's own API routes (signin/signout/session)
//   - /_next/*       → Next.js internal assets (JS, CSS, etc.)
//   - /favicon.ico   → browser icon
//   - /logo.png      → your logo (shown on the login page before signing in)
//
// NOTE: Next.js 16 requires middleware to export an explicit function.
//       The old `export { default } from 'next-auth/middleware'` no longer works.

import { withAuth } from 'next-auth/middleware'

// withAuth() returns a middleware function that checks for a valid NextAuth session.
// If the user is NOT signed in, they get redirected to the signIn page (set in auth.js).
export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|terms|privacy|api/auth|_next/static|_next/image|favicon.ico|logo.png)(?!$).*)',
  ],
}
