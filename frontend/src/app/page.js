'use client'

import { useEffect, useState } from 'react'
import { fetchReleases } from '@/lib/api'
import ReleaseCard from '@/components/ReleaseCard'
import Link from 'next/link'

export default function HomePage() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState('Checking...')

  useEffect(() => {
    async function loadReleases() {
      try {
        setApiStatus('Connected')
        const data = await fetchReleases()
        setReleases(data)
      } catch (err) {
        console.error('Error loading releases:', err)
        setApiStatus('Disconnected')
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
          <p className="text-gray-300">Loading releases...</p>
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
                Release Dashboard
              </h1>
              <p className="text-gray-300">
                {releases.length} release{releases.length !== 1 ? 's' : ''} • {apiStatus}
              </p>
            </div>
            
            <Link 
              href="/releases/new" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
            >
              + Add New Track
            </Link>
          </div>
        </div>
      </div>

      {/* Releases Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {releases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl mb-6">No releases yet</p>
            <Link 
              href="/releases/new" 
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
            >
              + Add Your First Track
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