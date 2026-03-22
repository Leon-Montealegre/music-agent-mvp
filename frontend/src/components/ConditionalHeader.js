'use client'
// ConditionalHeader — renders the sticky nav on every page EXCEPT the landing page (/).
// The landing page is full-bleed with its own design and doesn't need the app header.

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import MobileMenu from './MobileMenu'

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Hide the global header on the landing page — it has its own layout
  if (pathname === '/') return null

  return (
    <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50 shadow-xl relative">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Music Agent Logo"
              className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
