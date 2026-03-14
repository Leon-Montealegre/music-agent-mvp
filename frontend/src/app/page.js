'use client'
import { useEffect, useState } from 'react'
import { fetchReleases } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'

const COLLECTION_BADGE_STYLES = {
  EP:    'bg-indigo-600/90 border-indigo-400/50 text-white',
  Album: 'bg-purple-600/90 border-purple-400/50 text-white',
}

const KEY_ORDER = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B']

export default function HomePage() {
  const [releases, setReleases] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-newest')
  const [sortDirection, setSortDirection] = useState('asc')

  // Collapsible section state
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [singlesOpen, setSinglesOpen] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [releasesData, collectionsRes] = await Promise.all([
          fetchReleases(),
          fetch('http://localhost:3001/collections').then(r => r.json())
        ])
        setReleases(releasesData)
        setCollections(collectionsRes.collections || [])
      } catch (err) {
        console.error('Error loading catalogue:', err)
        setError('Could not connect to backend. Make sure the server is running on port 3001.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // --- Counts ---
  const countSingles = releases.filter(r => !r.collectionId).length
  const countEPs     = collections.filter(c => c.collectionType === 'EP').length
  const countAlbums  = collections.filter(c => c.collectionType === 'Album').length
  const totalAll     = releases.length + collections.length

  // --- Shared status helper ---
  function matchesStatusFilter(dist) {
    if (statusFilter === 'all') return true
    const isSigned       = dist?.submit?.some(e => e.status?.toLowerCase() === 'signed')
    const isReleased     = dist?.release?.some(e => e.status?.toLowerCase() === 'live')
    const isPromoted     = dist?.promote?.some(e => e.status?.toLowerCase() === 'live')
    const hasSubmissions = dist?.submit?.length > 0
    const hasNonSigned   = dist?.submit?.some(e => e.status?.toLowerCase() !== 'signed')
    if (statusFilter === 'not-submitted') return !hasSubmissions
    if (statusFilter === 'submitted')     return hasNonSigned && !isSigned && !isReleased
    if (statusFilter === 'signed')        return isSigned
    if (statusFilter === 'released')      return isReleased
    if (statusFilter === 'promoted')      return isPromoted
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

  // --- Collection card (inline, same as before) ---
  const CollectionCard = ({ item }) => (
    <Link href={`/collections/${item.releaseId}`} className="group block h-full">
      <div className="relative h-full">
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-lg bg-indigo-900/40 border border-indigo-500/20" />
        <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-lg bg-indigo-900/60 border border-indigo-500/30" />
        <div className="relative flex flex-col h-full bg-gray-800/95 border-2 border-indigo-500/50 rounded-lg overflow-hidden group-hover:border-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all">
          <div className="aspect-square bg-gradient-to-br from-indigo-950 to-gray-900 relative overflow-hidden flex-shrink-0">
            {item.fileCounts?.artwork > 0 ? (
              <img src={`http://localhost:3001/collections/${item.releaseId}/artwork`} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg width="140" height="140" viewBox="0 0 120 120" className="opacity-60">
                  <defs>
                    <radialGradient id={`coll-${item.releaseId}`}>
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  <circle cx="60" cy="60" r="58" fill={`url(#coll-${item.releaseId})`}/>
                  <circle cx="60" cy="60" r="55" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
                  <circle cx="60" cy="60" r="30" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
                  <circle cx="60" cy="60" r="18" fill="#0f0e2a" stroke="#6366f1" strokeWidth="1.5"/>
                  <circle cx="60" cy="60" r="6"  fill="#000" stroke="#818cf8" strokeWidth="1.5"/>
                  <line x1="20" y1="95" x2="100" y2="95" stroke="#4338ca" strokeWidth="1" opacity="0.5"/>
                  <line x1="24" y1="99" x2="96"  y2="99" stroke="#4338ca" strokeWidth="0.8" opacity="0.3"/>
                </svg>
              </div>
            )}
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold border ${COLLECTION_BADGE_STYLES[item.collectionType] || COLLECTION_BADGE_STYLES['EP']}`}>
              {item.collectionType}
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-indigo-500/50 text-indigo-300 text-xs font-medium">
              {item.tracks?.length || 0} {item.tracks?.length === 1 ? 'track' : 'tracks'}
            </div>
          </div>
          <div className="flex flex-col flex-grow p-4 border-t-2 border-indigo-500/30">
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-indigo-100 line-clamp-1 group-hover:text-indigo-300 transition-colors">{item.title}</h3>
              <p className="text-sm text-indigo-300/70 line-clamp-1">{item.artist}</p>
              <p className="text-xs text-transparent select-none">-</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center min-h-[28px] mb-3">
              {item.genre && (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-600/30 text-indigo-300 border border-indigo-500/50">{item.genre}</span>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap min-h-[28px] mb-3">
              {item.distribution?.release?.some(e => e.status?.toLowerCase() === 'live') && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/60 text-green-300 border border-green-700/50">Released</span>
              )}
              {item.distribution?.submit?.some(e => e.status?.toLowerCase() === 'signed') && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900/60 text-yellow-300 border border-yellow-700/50">Signed</span>
              )}
              {item.distribution?.submit?.length > 0 &&
               !item.distribution.submit.some(e => e.status?.toLowerCase() === 'signed') &&
               !item.distribution.release?.some(e => e.status?.toLowerCase() === 'live') && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">Submitted</span>
              )}
              {item.distribution?.promote?.some(e => e.status?.toLowerCase() === 'live') && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-orange-400/30 text-pink-200 border border-pink-400/60">Promoted</span>
              )}
            </div>
            <div className="mt-auto pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs">
              <span className="text-indigo-400 font-medium">View {item.collectionType}</span>
              <span className="text-indigo-400/50">{item.releaseDate || ''}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )

  // --- Collapsible section header ---
  const SectionHeader = ({ label, count, isOpen, onToggle, accent = 'purple' }) => {
    const colors = {
      purple: 'text-purple-300 border-purple-700/50',
      indigo: 'text-indigo-300 border-indigo-700/50',
    }
    return (
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-3 border-b ${colors[accent]} hover:opacity-80 transition-opacity mb-6`}
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
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Catalogue Dashboard</h1>
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
            <div className="flex items-center gap-4">
              <Link href="/stats" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                📊 Statistics
              </Link>
              <Link href="/releases/new" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                + Add Track
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">

            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, artist, label, genre, BPM, or key..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg">×</button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium whitespace-nowrap">Show:</span>
                {[
                  { value: 'all',     label: 'All' },
                  { value: 'singles', label: 'Singles' },
                  { value: 'eps',     label: 'EPs' },
                  { value: 'albums',  label: 'Albums' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                      typeFilter === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="h-6 w-px bg-gray-600 hidden sm:block" />

              {/* Status filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 text-sm font-medium whitespace-nowrap">Status:</span>
                {[
                  { value: 'all',           label: 'All' },
                  { value: 'not-submitted', label: 'Not Submitted' },
                  { value: 'submitted',     label: 'Submitted' },
                  { value: 'signed',        label: 'Signed' },
                  { value: 'released',      label: 'Released' },
                  { value: 'promoted',      label: 'Promoted' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                      statusFilter === value ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-500 text-sm font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm transition-colors"
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
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No tracks in your catalogue yet</h2>
            <p className="text-gray-500 mb-8">Upload your first track to get started</p>
            <Link href="/releases/new" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Add Track
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
                    {sortedCollections.map(item => <CollectionCard key={item.releaseId} item={item} />)}
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
                    {sortedSingles.map(item => <ReleaseCard key={item.releaseId} release={item} />)}
                  </div>
                )}
              </div>
            )}
          </div>

        ) : (
          // ── FLAT VIEW (filtered to specific type) ──
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-start">
            {flatItems.map(item =>
              item._type === 'collection'
                ? <CollectionCard key={item.releaseId} item={item} />
                : <ReleaseCard key={item.releaseId} release={item} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
