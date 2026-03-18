// lib/auth.js — NextAuth configuration
// This is the central config for authentication.
// It calls your Express backend's /auth/login endpoint.

import CredentialsProvider from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const authOptions = {
  // ─── Providers ────────────────────────────────────────────────────────────
  // "Credentials" means username/password — we'll forward them to your Express backend.
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Call your existing Express login endpoint
        const res = await fetch(`${API_URL}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:    credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null   // wrong password → NextAuth shows an error

        const data = await res.json()

        // Return an object — NextAuth stores this as the "user" in the session
        if (data.token) {
          return {
            id:    data.user?.id || data.userId || '1',
            email: data.user?.email || credentials.email,
            name:  data.user?.name,
            token: data.token,
          }
        }

        return null
      },
    }),
  ],

  // ─── Session ──────────────────────────────────────────────────────────────
  // Keep the user logged in for 30 days, even if they close the browser.
  // "jwt" strategy means the session is stored in a cookie (not a database).
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,  // 30 days in seconds = 2,592,000
  },

  // ─── Callbacks ────────────────────────────────────────────────────────────
  // These two callbacks copy the backend JWT into the NextAuth session so
  // every page can read it with useSession().
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, "user" is the object returned by authorize() above.
      // We store the backend token inside NextAuth's own JWT.
      if (user) {
        token.accessToken = user.token
        token.email       = user.email
        token.name        = user.name
      }
      return token
    },
    async session({ session, token }) {
      // Expose the backend token to the browser via session.token
      session.token = token.accessToken
      session.user.name = token.name
      return session
    },
  },

  // ─── Pages ────────────────────────────────────────────────────────────────
  // Use your custom login page instead of NextAuth's default one.
  pages: {
    signIn: '/login',
  },

  // ─── Secret ───────────────────────────────────────────────────────────────
  // NEXTAUTH_SECRET must be set in .env.local  (see setup instructions)
  secret: process.env.NEXTAUTH_SECRET,
}
