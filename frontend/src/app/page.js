'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { fetchReleases, apiFetch, API_BASE_URL } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'

const COLLECTION_BADGE_STYLES = {
  EP:    'bg-indigo-600/90 border-indigo-400/50 text-white',
  Album: 'bg-purple-600/90 border-purple-400/50 text-white',
}

const KEY_ORDER = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B']

export default function HomePage() {
  const { status } = useSession()   // 'loading' | 'authenticated' | 'unauthenticated'
  const [releases, setReleases] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-newest')
  const [sortDirection, setSortDirection] = useState('asc')
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('catalogueView') || 'grid'
    }
    return 'grid'
  })

  // Collapsible section state
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [singlesOpen, setSinglesOpen] = useState(true)

  useEffect(() => {
    // Wait until NextAuth has finished loading the session.
    // Without this, the fetch fires before the token is set → 401 → empty page.
    if (status !== 'authenticated') return

    async function loadData() {
      try {
        const [releasesData, collectionsRes] = await Promise.all([
          fetchReleases(),
          apiFetch('/collections').then(r => r.json())
        ])
        setReleases(releasesData)
        setCollections(collectionsRes.collections || [])
      } catch (err) {
        // Only show the error screen for actual network failures (TypeError = fetch failed).
        // HTTP errors like 401 throw differently and should not block the UI.
        if (err instanceof TypeError) {
          setError('Could not connect to backend. Make sure the server is running.')
        } else {
          console.error('Error loading catalogue:', err)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [status])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalogueView', viewMode)
    }
  }, [viewMode])

  // --- Counts ---
  const countSingles = releases.filter(r => !r.collectionId).length
  const countEPs     = collections.filter(c => c.collectionType === 'EP').length
  const countAlbums  = collections.filter(c => c.collectionType === 'Album').length
  const totalAll     = releases.length + collections.length

  // --- Shared status helper ---
  function matchesStatusFilter(dist) {
    if (statusFilter === 'all') return true
    const isSigned    = dist?.submit?.some(e => e.status?.toLowerCase() === 'signed')
    const isSubmitted = dist?.submit?.some(e => e.status?.toLowerCase() === 'submitted')
    const isReleased  = dist?.release?.some(e => e.status?.toLowerCase() === 'live')
    const isPromoted  = dist?.promote?.some(e => e.status?.toLowerCase() === 'live')
    if (statusFilter === 'signed')    return isSigned
    if (statusFilter === 'submitted') return isSubmitted
    if (statusFilter === 'released')  return isReleased
    if (statusFilter === 'promoted')  return isPromoted
    return true
  }

  // --- Filter singles ---
  const filteredReleases = releases.filter(release => {
    if (!release) return false
    if (typeFilter === 'eps' || typeFilter === 'albums') return false
    if (typeFilter === 'singles' && release.collectionId) return false
    if (!matchesStatusFilter(release.distribution)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        release.title?.toLowerCase().includes(q) ||
        release.artist?.toLowerCase().includes(q) ||
        release.genre?.toLowerCase().includes(q) ||
        release.bpm?.toString().includes(q) ||
        release.key?.toLowerCase().includes(q) ||
        release.distribution?.submit?.some(s => s.label?.toLowerCase().includes(q))
      )
    }
    return true
  })

  // --- Filter collections ---
  const filteredCollections = collections.filter(collection => {
    if (typeFilter === 'singles') return false
    if (typeFilter === 'eps'    && collection.collectionType !== 'EP')    return false
    if (typeFilter === 'albums' && collection.collectionType !== 'Album') return false
    if (!matchesStatusFilter(collection.distribution)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        collection.title?.toLowerCase().includes(q) ||
        collection.artist?.toLowerCase().includes(q) ||
        collection.genre?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // --- Sort function (shared) ---
  const sortItems = (a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'title':       cmp = (a.title  || '').localeCompare(b.title  || ''); break
      case 'artist':      cmp = (a.artist || '').localeCompare(b.artist || ''); break
      case 'genre':       cmp = (a.genre  || '').localeCompare(b.genre  || ''); break
      case 'type': {
        const ta = a.collectionType || a.releaseFormat || 'Single'
        const tb = b.collectionType || b.releaseFormat || 'Single'
        cmp = ta.localeCompare(tb); break
      }
      case 'bpm':         cmp = (a.bpm||0) - (b.bpm||0); break
      case 'key':         cmp = KEY_ORDER.indexOf((a.key||'').split(' ')[0]) - KEY_ORDER.indexOf((b.key||'').split(' ')[0]); break
      case 'date-oldest': return (a.releaseId||'').localeCompare(b.releaseId||'')
      case 'date-newest': return (b.releaseId||'').localeCompare(a.releaseId||'')
      default:            return (b.releaseId||'').localeCompare(a.releaseId||'')
    }
    return sortDirection === 'asc' ? cmp : -cmp
  }

  const sortedCollections = [...filteredCollections].sort(sortItems)
  const sortedSingles     = [...filteredReleases].sort(sortItems)

  // Build a slug → title lookup so ReleaseCard / ListRow can show the real EP/Album name
  const collectionsMap = Object.fromEntries(
    collections.map(c => [c.collectionId || c.releaseId, c.title])
  )

  // Flat merged list — used only when a specific type filter is active
  const flatItems = [
    ...filteredReleases.map(r  => ({ ...r, _type: 'single' })),
    ...filteredCollections.map(c => ({ ...c, _type: 'collection' })),
  ].sort(sortItems)

  const totalVisible = filteredReleases.length + filteredCollections.length
  const useSections  = typeFilter === 'all'

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={{ textAlign: 'center', color: '#f87171' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️ Backend not reachable</p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-300">Loading catalogue...</p>
        </div>
      </div>
    )
  }

  // --- Collection card — artwork on top, info strip below (matches ReleaseCard layout) ---
  const CollectionCard = ({ item }) => {
    const isItemSigned    = item.distribution?.submit?.some(e => e.status?.toLowerCase() === 'signed')
    const isItemSubmitted = !isItemSigned && item.distribution?.submit?.some(e => e.status?.toLowerCase() === 'submitted')
    const isItemReleased  = item.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')
    const isItemPromoted  = item.distribution?.promote?.some(e => e.status?.toLowerCase() === 'live')
    const hasAnyBadge     = isItemSigned || isItemSubmitted || isItemReleased || isItemPromoted

    return (
      <Link href={`/collections/${item.releaseId}`} className="block group">
        <div className="flex flex-col bg-gray-800/95 border-2 border-indigo-500/40 group-hover:border-indigo-400 rounded-xl overflow-hidden shadow-lg transition-all duration-200 group-hover:shadow-indigo-500/25 group-hover:-translate-y-0.5">

          {/* Artwork — square ratio so album art always looks correct */}
          <div className="aspect-square bg-gradient-to-br from-indigo-950 to-gray-900 relative overflow-hidden flex-shrink-0">
            <img
              src={`${API_BASE_URL}/collections/${item.releaseId}/artwork`}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            {/* Fallback disc */}
            <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 120 120" opacity="0.4">
                <circle cx="60" cy="60" r="55" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="36" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="26" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="16" fill="#0f0e2a" stroke="#6366f1" strokeWidth="1.5"/>
                <circle cx="60" cy="60" r="6"  fill="#000" stroke="#818cf8" strokeWidth="1.5"/>
              </svg>
            </div>
            {/* EP / Album badge — top left */}
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold border ${COLLECTION_BADGE_STYLES[item.collectionType] || COLLECTION_BADGE_STYLES['EP']}`}>
              {item.collectionType}
            </div>
            {/* Track count — bottom right */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-indigo-200 text-xs font-medium border border-indigo-500/30">
              {item.trackCount || 0} {item.trackCount === 1 ? 'track' : 'tracks'}
            </div>
          </div>

          {/* Info strip */}
          <div className="p-2.5 flex flex-col gap-1">

            {/* Title + artist */}
            <div>
              <h3 className="font-semibold text-sm text-indigo-100 truncate leading-snug group-hover:text-indigo-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-indigo-300/70 truncate">{item.artist}</p>
            </div>

            {/* Genre */}
            {item.genre && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-600/25 text-indigo-300 border border-indigo-500/30">
                  {item.genre}
                </span>
              </div>
            )}

            {/* Status badges */}
            {hasAnyBadge && (
              <div className="flex flex-wrap gap-1">
                {isItemSigned && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-300 border border-green-700/40">Signed</span>
                )}
                {isItemSubmitted && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-300 border border-yellow-700/40">Submitted</span>
                )}
                {isItemReleased && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/60 text-orange-300 border border-orange-700/40">Released</span>
                )}
                {isItemPromoted && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-900/60 text-pink-300 border border-pink-700/40">Promoted</span>
                )}
              </div>
            )}

          </div>
        </div>
      </Link>
    )
  }

  const ListRow = ({ item, type }) => {
    const isCollection = type === 'collection'
    const href = isCollection ? `/collections/${item.releaseId}` : `/releases/${item.releaseId}`
    const artworkSrc = isCollection
      ? `${API_BASE_URL}/collections/${item.releaseId}/artwork`
      : `${API_BASE_URL}/releases/${item.releaseId}/artwork`

    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderBottom: '1px solid #1f2937',
            cursor: 'pointer',
            transition: 'background 0.1s',
            minHeight: '56px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Artwork — with vinyl SVG fallback if image fails to load */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '6px',
            overflow: 'hidden', flexShrink: 0, position: 'relative',
            background: isCollection ? '#1e1b4b' : '#1a1a2e',
          }}>
            <img
              src={artworkSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div style={{
              display: 'none', position: 'absolute', inset: 0,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 120 120" opacity="0.5">
                <circle cx="60" cy="60" r="55" fill={isCollection ? '#1e1b4b' : '#2a2a2a'} stroke={isCollection ? '#6366f1' : '#6b7280'} strokeWidth="2"/>
                <circle cx="60" cy="60" r="38" fill="none" stroke={isCollection ? '#4338ca' : '#4b5563'} strokeWidth="1"/>
                <circle cx="60" cy="60" r="22" fill={isCollection ? '#0f0e2a' : '#1a1a2e'} stroke={isCollection ? '#6366f1' : '#7c3aed'} strokeWidth="2"/>
                <circle cx="60" cy="60" r="8"  fill="#000" stroke="#9ca3af" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <div style={{ minWidth: 0, width: '200px', flexShrink: 0 }}>
            <div style={{
              color: '#f3f4f6', fontWeight: 600, fontSize: '14px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.title}
            </div>
            {type === 'single' && item.collectionId && (
              <div style={{
                color: '#818cf8', fontSize: '11px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginTop: '1px',
              }}>
                {collectionsMap[item.collectionId] || item.collectionId.replace(/^\d{4}-\d{2}-\d{2}_[^_]+_/, '').replace(/_/g, ' ')}
              </div>
            )}
          </div>

          {/* Artist */}
          <div style={{
            color: '#9ca3af', fontSize: '13px', width: '140px', flexShrink: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.artist}
          </div>

          {/* Badges — right-aligned */}
          {(() => {
            const rowSigned    = item.distribution?.submit?.some(e => e.status?.toLowerCase() === 'signed')
            const rowSubmitted = !rowSigned && item.distribution?.submit?.some(e => e.status?.toLowerCase() === 'submitted')
            const rowReleased  = item.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')
            const rowPromoted  = item.distribution?.promote?.some(e => e.status?.toLowerCase() === 'live')
            return (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {rowSigned && (
                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(21,128,61,0.4)', color: '#86efac', border: '1px solid rgba(21,128,61,0.5)' }}>Signed</span>
                )}
                {rowSubmitted && (
                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(161,120,0,0.4)', color: '#fde047', border: '1px solid rgba(161,120,0,0.5)' }}>Submitted</span>
                )}
                {rowReleased && (
                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(194,65,12,0.4)', color: '#fdba74', border: '1px solid rgba(194,65,12,0.5)' }}>Released</span>
                )}
                {rowPromoted && (
                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: 'rgba(157,23,77,0.4)', color: '#f9a8d4', border: '1px solid rgba(157,23,77,0.5)' }}>Promoted</span>
                )}
              </div>
            )
          })()}
        </div>
      </Link>
    )
  }

  // --- Collapsible section header ---
  const SectionHeader = ({ label, count, isOpen, onToggle, accent = 'purple' }) => {
    const colors = {
      purple: 'text-purple-300 border-purple-700/50',
      indigo: 'text-indigo-300 border-indigo-700/50',
    }
    return (
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-2 border-b ${colors[accent]} hover:opacity-80 transition-opacity mb-4`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${colors[accent].split(' ')[0]}`}>{label}</span>
          <span className="text-sm text-gray-500">{count} {count === 1 ? 'item' : 'items'}</span>
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 mb-4">
        <div className="max-w-7xl mx-auto px-4 py-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 mb-1">Catalogue Dashboard</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-gray-400">{totalAll} total</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">{countSingles} Singles</span>
                {countEPs    > 0 && <><span className="text-gray-600">•</span><span className="text-indigo-400">{countEPs} EPs</span></>}
                {countAlbums > 0 && <><span className="text-gray-600">•</span><span className="text-purple-400">{countAlbums} Albums</span></>}
                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                  <span className="text-gray-500">— {totalVisible} shown</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View mode toggle */}
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  style={{
                    padding: '8px 12px',
                    background: viewMode === 'grid' ? '#7c3aed' : '#1f2937',
                    color: viewMode === 'grid' ? '#fff' : '#9ca3af',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    lineHeight: 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/>
                    <rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/>
                    <rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List view"
                  style={{
                    padding: '8px 12px',
                    background: viewMode === 'list' ? '#7c3aed' : '#1f2937',
                    color: viewMode === 'list' ? '#fff' : '#9ca3af',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    lineHeight: 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="14" height="2" rx="1"/>
                    <rect x="1" y="7" width="14" height="2" rx="1"/>
                    <rect x="1" y="12" width="14" height="2" rx="1"/>
                  </svg>
                </button>
              </div>

              <Link href="/contacts" className="px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50" style={{ height: '36px' }}>
                👤 Contacts
              </Link>
              <Link href="/files" className="px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50" style={{ height: '36px' }}>
                📁 Files
              </Link>
              <Link href="/stats" className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50" style={{ height: '36px' }}>
                📊 Stats
              </Link>
              <Link href="/releases/new" className="px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white" style={{ height: '36px' }}>
                ✚ Add Track
              </Link>
            </div>
          </div>

          {/* Filters — all on two compact rows */}
          <div className="space-y-2">

            {/* Row 1: search + type + status all inline */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-grow min-w-[180px]">
                <input
                  type="text"
                  placeholder="Search title, artist, genre, BPM, key…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">×</button>
                )}
              </div>

              <div className="h-5 w-px bg-gray-600" />

              {/* Type filter */}
              {[
                { value: 'all',     label: 'All' },
                { value: 'singles', label: 'Singles' },
                { value: 'eps',     label: 'EPs' },
                { value: 'albums',  label: 'Albums' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                    typeFilter === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="h-5 w-px bg-gray-600" />

              {/* Status filter */}
              {[
                { value: 'all',       label: 'All' },
                { value: 'signed',    label: 'Signed' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'released',  label: 'Released' },
                { value: 'promoted',  label: 'Promoted' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                    statusFilter === value ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Row 2: Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 text-xs font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-2.5 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="date-newest">Date (Newest First)</option>
                <option value="date-oldest">Date (Oldest First)</option>
                <option value="title">Name</option>
                <option value="artist">Artist</option>
                <option value="genre">Genre</option>
                <option value="type">Collection Type</option>
                <option value="bpm">BPM</option>
                <option value="key">Key</option>
              </select>
              {!sortBy.startsWith('date-') && (
                <button
                  onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-xs transition-colors"
                >
                  {sortDirection === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {totalAll === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No releases yet</h2>
            <p className="text-gray-500 mb-8">Create your first release to get started</p>
            <Link href="/releases/new" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              ✚ Add your first release
            </Link>
          </div>
        ) : totalVisible === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No items match your filters</h2>
            <p className="text-gray-500 mb-8">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all') }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>

        ) : useSections ? (
          // ── SECTIONED VIEW (typeFilter === 'all') ──
          <div className="space-y-10">

            {/* Collections section */}
            {sortedCollections.length > 0 && (
              <div>
                <SectionHeader
                  label="EPs & Albums"
                  count={sortedCollections.length}
                  isOpen={collectionsOpen}
                  onToggle={() => setCollectionsOpen(o => !o)}
                  accent="indigo"
                />
                {collectionsOpen && (
                  viewMode === 'list' ? (
                    <div style={{ border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
                      {sortedCollections.map(item => <ListRow key={item.releaseId} item={item} type="collection" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-start">
                      {sortedCollections.map(item => <CollectionCard key={item.releaseId} item={item} />)}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Singles section */}
            {sortedSingles.length > 0 && (
              <div>
                <SectionHeader
                  label="Singles"
                  count={sortedSingles.length}
                  isOpen={singlesOpen}
                  onToggle={() => setSinglesOpen(o => !o)}
                  accent="purple"
                />
                {singlesOpen && (
                  viewMode === 'list' ? (
                    <div style={{ border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
                      {sortedSingles.map(item => <ListRow key={item.releaseId} item={item} type="single" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-start">
                      {sortedSingles.map(item => <ReleaseCard key={item.releaseId} release={item} collectionsMap={collectionsMap} />)}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

        ) : (
          // ── FLAT VIEW (filtered to specific type) ──
          viewMode === 'list' ? (
            <div style={{ border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
              {flatItems.map(item =>
                <ListRow key={item.releaseId} item={item} type={item._type === 'collection' ? 'collection' : 'single'} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-start">
              {flatItems.map(item =>
                item._type === 'collection'
                  ? <CollectionCard key={item.releaseId} item={item} />
                  : <ReleaseCard key={item.releaseId} release={item} collectionsMap={collectionsMap} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
