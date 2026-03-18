'use client'
// components/Providers.js
//
// Why this file exists:
// layout.js is a "Server Component" — it runs on the server, not in the browser.
// But SessionProvider (from NextAuth) needs to run in the browser.
// The solution is to put everything browser-side in this separate Providers component.
//
// What this does:
// 1. Wraps the whole app in SessionProvider so any page can call useSession()
// 2. Reads the token from the session and stores it in api.js's module-level
//    variable — so ALL fetch() calls in the app automatically include the
//    Authorization header without each page having to do it manually.

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { setToken } from '@/lib/api'

// This inner component watches for a session and pushes the token into api.js
function TokenSetter() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.token) {
      setToken(session.token)
    }
  }, [session])

  // Renders nothing — it just runs the effect
  return null
}

// The outer component wraps everything in SessionProvider
export default function Providers({ children }) {
  return (
    <SessionProvider>
      <TokenSetter />
      {children}
    </SessionProvider>
  )
}
