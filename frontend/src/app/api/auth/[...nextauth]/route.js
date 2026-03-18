// app/api/auth/[...nextauth]/route.js
// This file creates the NextAuth API endpoints automatically.
// The "[...nextauth]" part means it handles ALL auth routes:
//   /api/auth/signin
//   /api/auth/signout
//   /api/auth/session
//   /api/auth/callback/...
//   etc.

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// Next.js App Router needs named exports for HTTP methods
export { handler as GET, handler as POST }
