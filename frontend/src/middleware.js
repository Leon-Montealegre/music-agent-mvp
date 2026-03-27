// middleware.js — Route protection
//
// Runs on the Next.js Edge Runtime before every protected page load.
// Uses getToken() directly (rather than withAuth) so we can pass the secret
// explicitly — this avoids intermittent failures on Vercel's edge network
// where NEXTAUTH_SECRET is sometimes not picked up automatically by withAuth.
//
// Public routes excluded by the matcher below:
//   /login, /register, /forgot-password, /reset-password, /terms, /privacy
//   /api/auth/*  — NextAuth's own API routes
//   /_next/*     — Next.js internal assets
//   /favicon.ico, /logo.png

import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|terms|privacy|api/auth|_next/static|_next/image|favicon.ico|logo.png)(?!$).*)',
  ],
}
