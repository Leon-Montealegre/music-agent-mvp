'use client'
import { usePathname } from 'next/navigation'
import Breadcrumb from './Breadcrumb'

// IDs look like '2024-03-01 Artist Title' — strip the date prefix for clean labels
function formatId(id) {
  return decodeURIComponent(id).replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
}

export default function HeaderNav() {
  const pathname = usePathname()

  // Home page — no breadcrumb needed
  if (pathname === '/') return null

  // Level 2: Release detail → Catalogue › Track Title
  const releaseMatch = pathname.match(/^\/releases\/([^/]+)$/)
  if (releaseMatch) {
    return (
      <Breadcrumb crumbs={[
        { label: 'Catalogue', href: '/' },
        { label: formatId(releaseMatch[1]) },
      ]} />
    )
  }

  // Level 3: Release label or promo entry → Catalogue › Track Title › Label/Promo Entry
  const releaseEntryMatch = pathname.match(/^\/releases\/([^/]+)\/(label|promo)\/[^/]+$/)
  if (releaseEntryMatch) {
    const [, releaseId, type] = releaseEntryMatch
    return (
      <Breadcrumb crumbs={[
        { label: 'Catalogue', href: '/' },
        { label: formatId(releaseId), href: `/releases/${releaseId}` },
        { label: type === 'label' ? 'Label Entry' : 'Promo Entry' },
      ]} />
    )
  }

  // Level 2: Collection detail → Catalogue › Collection Title
  const collectionMatch = pathname.match(/^\/collections\/([^/]+)$/)
  if (collectionMatch) {
    return (
      <Breadcrumb crumbs={[
        { label: 'Catalogue', href: '/' },
        { label: formatId(collectionMatch[1]) },
      ]} />
    )
  }

  // Level 3: Collection label or promo entry → Catalogue › Collection Title › Label/Promo Entry
  const collectionEntryMatch = pathname.match(/^\/collections\/([^/]+)\/(label|promo)\/[^/]+$/)
  if (collectionEntryMatch) {
    const [, collectionId, type] = collectionEntryMatch
    return (
      <Breadcrumb crumbs={[
        { label: 'Catalogue', href: '/' },
        { label: formatId(collectionId), href: `/collections/${collectionId}` },
        { label: type === 'label' ? 'Label Entry' : 'Promo Entry' },
      ]} />
    )
  }

  // Flat named pages
  const flatPages = {
    '/stats':    'Statistics',
    '/settings': 'Settings',
    '/contacts': 'Contacts',
    '/files':    'Files',
    '/admin':    'Admin',
  }
  if (flatPages[pathname]) {
    return (
      <Breadcrumb crumbs={[
        { label: 'Catalogue', href: '/' },
        { label: flatPages[pathname] },
      ]} />
    )
  }

  // Fallback
  return (
    <Breadcrumb crumbs={[
      { label: 'Catalogue', href: '/' },
      { label: 'Back' },
    ]} />
  )
}
