import Link from 'next/link'

// ── Global 404 page ───────────────────────────────────────────────────────────
// Next.js App Router automatically renders this file when no route matches.
// This is a Server Component — no 'use client' needed, no hooks.

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Big 404 number */}
        <div className="text-9xl font-black text-gray-700 leading-none mb-4 select-none">
          404
        </div>

        {/* Vinyl record emoji as a small visual accent */}
        <div className="text-5xl mb-6">🎵</div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Page not found
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-lg"
        >
          ← Back to Catalogue
        </Link>

      </div>
    </div>
  )
}
