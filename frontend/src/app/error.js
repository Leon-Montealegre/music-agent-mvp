'use client'

// ── Global runtime error boundary ────────────────────────────────────────────
// Next.js App Router renders this when an unexpected JS error is thrown inside
// a page. MUST have 'use client' — Next.js requires error boundaries to be
// client components.
//
// Props:
//   error  — the Error object that was thrown
//   reset  — a function provided by Next.js that retries rendering the segment

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  // Log the error to the console so it's still visible in dev tools
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Warning icon */}
        <div className="text-6xl mb-6">⚠️</div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Something went wrong
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          An unexpected error occurred. You can try again, or head back to the
          catalogue if the problem persists.
        </p>

        {/* Two options: retry the same page, or go home */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-lg"
          >
            Try again
          </button>

          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium transition-colors border border-gray-600/50"
          >
            ← Back to Catalogue
          </Link>
        </div>

      </div>
    </div>
  )
}
