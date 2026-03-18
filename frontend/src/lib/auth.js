// lib/auth.js — NextAuth configuration
// This is the central config for authentication.
// It tells NextAuth to use your own backend (localhost:3001) for login.

import CredentialsProvider from 'next-auth/providers/credentials'

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
        const res = await fetch('http://localhost:3001/auth/login', {
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
            id:    data.userId || '1',
            email: credentials.email,
            token: data.token,       // ← the JWT from your backend
          }
        }

        return null
      },
    }),
  ],

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
      }
      return token
    },
    async session({ session, token }) {
      // Expose the backend token to the browser via session.token
      session.token = token.accessToken
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
