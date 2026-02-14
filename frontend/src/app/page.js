'use client'
import { useEffect, useState } from 'react'
import { fetchReleases } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'


export default function HomePage() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, not-submitted, submitted, signed, released


  useEffect(() => {
    async function loadReleases() {
      try {
        const data = await fetchReleases()
        console.log('📊 ALL RELEASES DATA:', data)
        console.log('📊 FIRST RELEASE FULL:', JSON.stringify(data[0], null, 2))
        setReleases(data)
      } catch (err) {
        console.error('Error loading tracks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReleases()
  }, [])
  
  


  // Filter and search logic
  const filteredReleases = releases.filter(release => {
    // Safety check: skip invalid releases
    if (!release) return false
    
    // Metadata is either at release.metadata OR release itself (flat structure)
    const metadata = release.metadata || release
    
    // Search filter - if no search query, show all
    if (!searchQuery) {
      // Just apply status filter
      if (statusFilter === 'all') return true
      
      // Check for signed status - track is signed if any submission has status "signed"
      const hasSignedSubmission = metadata.distribution?.submit?.some(
        entry => entry.status?.toLowerCase() === 'signed'
      )
      
      // Check for released status (has platforms with status "Live")
      const isReleased = metadata.distribution?.release?.some(
        entry => entry.status?.toLowerCase() === 'live'
      )
      
      // Check for submissions (any submissions at all)
      const hasSubmissions = metadata.distribution?.submit?.length > 0
      
      // Check for non-signed submissions (submitted but not signed)
      const hasNonSignedSubmissions = metadata.distribution?.submit?.some(
        entry => entry.status?.toLowerCase() !== 'signed'
      )
      
      if (statusFilter === 'not-submitted') {
        return !hasSubmissions
      } else if (statusFilter === 'submitted') {
        // Submitted = has non-signed submissions AND not signed AND not released
        return hasNonSignedSubmissions && !hasSignedSubmission && !isReleased
      } else if (statusFilter === 'signed') {
        return !!hasSignedSubmission
      } else if (statusFilter === 'released') {
        return !!isReleased
      }
      
      return true
    }
    
    // Search filter with query
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      metadata.title?.toLowerCase().includes(searchLower) ||
      metadata.artist?.toLowerCase().includes(searchLower) ||
      metadata.genre?.toLowerCase().includes(searchLower) ||
      metadata.bpm?.toString().includes(searchLower) ||
      metadata.key?.toLowerCase().includes(searchLower) ||
      // Also search in submission labels
      metadata.distribution?.submit?.some(s => s.label?.toLowerCase().includes(searchLower))


    // If doesn't match search, exclude
    if (!matchesSearch) return false
    
    // Apply status filter to search results
    if (statusFilter === 'all') return true
    
    const hasSignedSubmission = metadata.distribution?.submit?.some(
      entry => entry.status?.toLowerCase() === 'signed'
    )
    const isReleased = metadata.distribution?.release?.some(
      entry => entry.status?.toLowerCase() === 'live'
    )
    const hasSubmissions = metadata.distribution?.submit?.length > 0
    const hasNonSignedSubmissions = metadata.distribution?.submit?.some(
      entry => entry.status?.toLowerCase() !== 'signed'
    )
    
    if (statusFilter === 'not-submitted') {
      return !hasSubmissions
    } else if (statusFilter === 'submitted') {
      return hasNonSignedSubmissions && !hasSignedSubmission && !isReleased
    } else if (statusFilter === 'signed') {
      return !!hasSignedSubmission
    } else if (statusFilter === 'released') {
      return !!isReleased
    }


    return true
  })


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


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header Section */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">
                Catalogue Dashboard
              </h1>
              <p className="text-gray-400">
                {filteredReleases.length} {filteredReleases.length === 1 ? 'track' : 'tracks'} 
                {searchQuery || statusFilter !== 'all' ? ' (filtered)' : ''} • {releases.length} total
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/stats"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                📊 Statistics
              </Link>
              <Link
                href="/releases/new"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                + Upload Track
              </Link>
            </div>
          </div>


          {/* Search & Filter Controls */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search by title, artist, label, genre, BPM, or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>


            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Tracks
              </button>
              <button
                onClick={() => setStatusFilter('not-submitted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'not-submitted'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Not Submitted
              </button>
              <button
                onClick={() => setStatusFilter('submitted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'submitted'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Submitted
              </button>
              <button
                onClick={() => setStatusFilter('signed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'signed'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Signed
              </button>
              <button
                onClick={() => setStatusFilter('released')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'released'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Released
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredReleases.length === 0 && releases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              No tracks in your catalogue yet
            </h2>
            <p className="text-gray-500 mb-8">
              Upload your first track to get started
            </p>
            <Link 
              href="/releases/new"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Upload Track
            </Link>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              No tracks match your filters
            </h2>
            <p className="text-gray-500 mb-8">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredReleases.map((release) => (
              <ReleaseCard key={release.releaseId} release={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
