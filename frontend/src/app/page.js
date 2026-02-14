'use client'
import { useEffect, useState } from 'react'
import { fetchReleases } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'

export default function HomePage() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReleases() {
      try {
        const data = await fetchReleases()
        setReleases(data)
      } catch (err) {
        console.error('Error loading tracks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReleases()
  }, [])

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">
                Catalogue Dashboard
              </h1>
              <p className="text-gray-400">
                {releases.length} {releases.length === 1 ? 'track' : 'tracks'} in your catalogue
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/releases/new"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                + Upload Track
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {releases.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {releases.map((release) => (
              <ReleaseCard key={release.releaseId} release={release} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
