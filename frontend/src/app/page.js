'use client'

import { useEffect, useState } from 'react'
import { checkHealth, fetchReleases } from '@/lib/api'

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState('Checking...')
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function testAPI() {
      // Test 1: Check if API is running
      const health = await checkHealth()
      setApiStatus(health.status === 'ok' ? '✅ Connected' : '❌ Disconnected')

      // Test 2: Fetch releases
      try {
        const data = await fetchReleases()
        console.log('API Response:', data) // Debug: see what we got
        
        // Make sure data is an array
        if (Array.isArray(data)) {
          setReleases(data)
        } else {
          console.error('Expected array, got:', typeof data, data)
          setError('API returned unexpected format')
        }
      } catch (error) {
        console.error('Failed to fetch releases:', error)
        setError(error.message)
      }
      
      setLoading(false)
    }

    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Release Management System
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">API Status</h2>
          <p className="text-gray-600">{apiStatus}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Releases</h2>
          
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                Check the browser console (F12) for details
              </p>
            </div>
          ) : releases.length === 0 ? (
            <p className="text-gray-500">No releases yet. Create your first one!</p>
          ) : (
            <ul className="space-y-2">
              {releases.map((release) => (
                <li key={release.releaseId} className="p-3 bg-gray-50 rounded">
                  {/* Check if release has error first */}
                  {release.error ? (
                    <div>
                      <div className="font-medium text-red-600">{release.releaseId}</div>
                      <div className="text-sm text-red-500">{release.error}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{release.title}</div>
                      <div className="text-sm text-gray-600">
                        {release.artist} • {release.genre}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {release.releaseDate} • {release.versionCount} version(s)
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}