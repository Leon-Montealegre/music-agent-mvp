'use client'

import { useEffect, useState } from 'react'
import { checkHealth, fetchReleases } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState('Checking...')
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadReleases() {
      // Check API health
      const health = await checkHealth()
      setApiStatus(health.status === 'ok' ? '✅ Connected' : '❌ Disconnected')

      // Fetch releases
      try {
        const data = await fetchReleases()
        
        if (Array.isArray(data)) {
          // Filter out releases with errors
          const validReleases = data.filter(release => !release.error)
          setReleases(validReleases)
        } else {
          setError('API returned unexpected format')
        }
      } catch (error) {
        console.error('Failed to fetch releases:', error)
        setError(error.message)
      }
      
      setLoading(false)
    }

    loadReleases()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Release Dashboard
              </h1>
              <p className="text-gray-600">
                {releases.length} release{releases.length !== 1 ? 's' : ''} • {apiStatus}
              </p>
            </div>
            <Link
              href="/releases/new"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Create New Release
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 mt-4">Loading releases...</p>
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium mb-2">Error Loading Releases</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                Check the browser console (F12) for details
              </p>
            </div>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No releases yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first release to get started
            </p>
            <Link
              href="/releases/new"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Create New Release
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