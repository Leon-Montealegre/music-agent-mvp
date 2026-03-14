'use client'
import { usePathname } from 'next/navigation'
import BackButton from './BackButton'

export default function HeaderNav() {
  const pathname = usePathname()

  // Home page — no back button
  if (pathname === '/') return null

  // Release detail: /releases/[releaseId]
  if (/^\/releases\/[^/]+$/.test(pathname)) {
    return <BackButton href="/" label="Back to Catalogue" />
  }

  // Release label or promo entry: /releases/[releaseId]/label/[labelId] or /promo/[promoId]
  const releaseEntryMatch = pathname.match(/^\/releases\/([^/]+)\/(label|promo)\/[^/]+$/)
  if (releaseEntryMatch) {
    return <BackButton href={`/releases/${releaseEntryMatch[1]}`} label="Back to Track" />
  }

  // Collection detail: /collections/[collectionId]
  if (/^\/collections\/[^/]+$/.test(pathname)) {
    return <BackButton href="/" label="Back to Catalogue" />
  }

  // Collection label or promo entry
  const collectionEntryMatch = pathname.match(/^\/collections\/([^/]+)\/(label|promo)\/[^/]+$/)
  if (collectionEntryMatch) {
    return <BackButton href={`/collections/${collectionEntryMatch[1]}`} label="Back to Collection" />
  }

  // Any other page
  return <BackButton href="/" label="Back" />
}
