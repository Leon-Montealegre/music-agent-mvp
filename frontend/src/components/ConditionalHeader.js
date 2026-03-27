'use client'
// ConditionalHeader — renders the sticky nav on every page EXCEPT the unauthenticated landing page.
// When a logged-in user is on /, they see the catalogue and still need the header.
// When a logged-out visitor is on /, they see the full-bleed landing page — no header.

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import MobileMenu from './MobileMenu'

export default function ConditionalHeader() {
  const pathname = usePathname()
  const { status } = useSession()

  // Hide header only when on the landing page AND not authenticated
  if (pathname === '/' && status !== 'authenticated') return null

  return (
    <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50 shadow-xl relative">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Music Agent Logo"
              width={160}
              height={80}
              priority
              className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
