'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import FeedbackButton from './FeedbackButton'
import HeaderNav from './HeaderNav'

/**
 * MobileMenu
 *
 * On desktop (md+):   renders all nav items in a row — same as before.
 * On mobile (< md):   renders the back button (if applicable) + a ☰ hamburger.
 *                     Tapping ☰ opens a full-width dropdown with all nav items.
 *
 * Used in layout.js to replace the previous list of individual header components.
 */
export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const initial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : '?'

  function close() {
    setIsOpen(false)
  }

  return (
    <>
      {/* ── Desktop nav (md and above) ─────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3">

        <FeedbackButton />

        {session?.user?.isAdmin && (
          <Link
            href="/admin"
            style={{ height: '36px' }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all font-medium border border-amber-500/40 hover:border-amber-400/70 hover:shadow-md hover:shadow-amber-500/20"
          >
            <span className="text-base">🛡️</span>
            <span>Admin</span>
          </Link>
        )}

        <Link
          href="/settings"
          style={{ height: '36px' }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors font-medium shadow-md border border-gray-600/50"
        >
          <span className="text-base">⚙️</span>
          <span>Settings</span>
        </Link>

        {session && (
          <div
            style={{ height: '36px' }}
            className="flex items-center gap-2 px-3 rounded-lg bg-gray-700 border border-gray-600/50 text-gray-300"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-sm font-medium">
              {initial}
            </span>
            <span className="text-sm font-medium">{session.user?.name ?? 'User'}</span>
            <span className="text-gray-500">|</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        )}

        <a
          href="https://www.buymeacoffee.com/musicagent"
          target="_blank"
          rel="noopener noreferrer"
          style={{ height: '36px' }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors font-medium shadow-md hover:shadow-lg border border-orange-500/20"
        >
          <span className="text-base">☕</span>
          <span>Buy me a coffee</span>
        </a>

        <HeaderNav />
      </div>

      {/* ── Mobile: back button + hamburger button (below md) ──────────────── */}
      <div className="flex md:hidden items-center gap-2">
        {/* Back button still shows on mobile so you can navigate back */}
        <HeaderNav />

        <button
          onClick={() => setIsOpen(o => !o)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600/50 transition-colors text-base"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── Mobile dropdown (full-width, appears below the header bar) ─────── */}
      {isOpen && (
        <>
          {/* Invisible backdrop — clicking it closes the menu */}
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={close}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div className="md:hidden absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-700 shadow-2xl z-50 px-4 py-4 space-y-2">

            {/* User row — name + log out */}
            {session && (
              <div className="flex items-center justify-between pb-3 mb-1 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-sm font-semibold text-gray-300">
                    {initial}
                  </span>
                  <span className="text-gray-200 text-sm font-medium">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Log out
                </button>
              </div>
            )}

            {/* Settings */}
            <Link
              href="/settings"
              onClick={close}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
            >
              ⚙️ Settings
            </Link>

            {/* Admin — only shown to admins */}
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                onClick={close}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30 transition-colors"
              >
                🛡️ Admin Panel
              </Link>
            )}

            {/* Feedback */}
            <div className="w-full">
              <FeedbackButton />
            </div>

            {/* Buy me a coffee */}
            <a
              href="https://www.buymeacoffee.com/musicagent"
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors"
            >
              ☕ Buy me a coffee
            </a>

          </div>
        </>
      )}
    </>
  )
}
