'use client'
import { useEffect, useState } from 'react'
import { fetchReleases } from '@/lib/api'
import Link from 'next/link'

export default function StatsPage() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    unreleased: 0,
    submitted: 0,
    signed: 0,
    byGenre: {},
    byLabel: {},
    byKey: {},
    avgBpm: 0,
    bpmRange: { min: 0, max: 0 },
    byYear: {}
  })

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchReleases()
        setReleases(data)
        calculateStats(data)
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function calculateStats(data) {
    if (data.length === 0) return

    const newStats = {
      total: data.length,
      notSubmitted: 0,
      submitted: 0,
      signed: 0,
      released: 0,
      byGenre: {},
      byLabel: {},
      byKey: {},
      avgBpm: 0,
      bpmRange: { min: Infinity, max: 0 },
      byYear: {}
    }

    let bpmSum = 0
    let bpmCount = 0

    data.forEach(release => {
      // Safety check: skip invalid releases
      if (!release) return
      
      // Metadata is either at release.metadata OR release itself (flat structure)
      const metadata = release.metadata || release

      // Status counts
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
      
      // Count categories (track can be in multiple)
      if (hasSignedSubmission) {
        newStats.signed++
        
        // Label breakdown - get label from the signed submission
        const signedSubmission = metadata.distribution.submit.find(
          entry => entry.status?.toLowerCase() === 'signed'
        )
        if (signedSubmission?.label) {
          newStats.byLabel[signedSubmission.label] = (newStats.byLabel[signedSubmission.label] || 0) + 1
        }
      }
      
      if (isReleased) {
        newStats.released++
      }
      
      if (hasNonSignedSubmissions && !hasSignedSubmission && !isReleased) {
        // Submitted = has non-signed submissions but NOT signed and NOT released
        newStats.submitted++
      }
      
      if (!hasSubmissions) {
        newStats.notSubmitted++
      }

      // Genre breakdown
      if (metadata.genre) {
        const genre = metadata.genre
        newStats.byGenre[genre] = (newStats.byGenre[genre] || 0) + 1
      }

      // Key breakdown
      if (metadata.key) {
        const key = metadata.key
        newStats.byKey[key] = (newStats.byKey[key] || 0) + 1
      }

      // BPM stats
      if (metadata.bpm) {
        const bpm = parseInt(metadata.bpm)
        if (!isNaN(bpm)) {
          bpmSum += bpm
          bpmCount++
          newStats.bpmRange.min = Math.min(newStats.bpmRange.min, bpm)
          newStats.bpmRange.max = Math.max(newStats.bpmRange.max, bpm)
        }
      }

      // Year breakdown
      if (metadata.releaseDate || metadata.trackDate) {
        const dateStr = metadata.releaseDate || metadata.trackDate
        const year = dateStr.split('-')[0]
        newStats.byYear[year] = (newStats.byYear[year] || 0) + 1
      }
    })

    // Calculate average BPM
    if (bpmCount > 0) {
      newStats.avgBpm = Math.round(bpmSum / bpmCount)
    }

    // Reset min if no BPMs found
    if (newStats.bpmRange.min === Infinity) {
      newStats.bpmRange.min = 0
    }

    setStats(newStats)
  }

  // Helper to get top N items from an object
  const getTopN = (obj, n = 5) => {
    return Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-300">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">
              📊 Catalogue Statistics
            </h1>
            <p className="text-gray-400">Analytics for {stats.total} tracks</p>
          </div>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            ← Back to Catalogue
          </Link>
        </div>

        {releases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              No statistics yet
            </h2>
            <p className="text-gray-500 mb-8">
              Upload some tracks to see your statistics
            </p>
            <Link 
              href="/releases/new"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Upload Track
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overview Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-gray-100 mb-4">📀 Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Tracks:</span>
                  <span className="text-2xl font-bold text-purple-400">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Not Submitted:</span>
                  <span className="text-xl font-semibold text-gray-300">{stats.notSubmitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-xl font-semibold text-yellow-400">{stats.submitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Signed:</span>
                  <span className="text-xl font-semibold text-green-400">{stats.signed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Released:</span>
                  <span className="text-xl font-semibold text-blue-400">{stats.released}</span>
                </div>
              </div>
            </div>

            {/* BPM Stats Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-gray-100 mb-4">🎵 BPM Analysis</h2>
              {stats.avgBpm > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average BPM:</span>
                    <span className="text-2xl font-bold text-purple-400">{stats.avgBpm}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Range:</span>
                    <span className="text-lg font-semibold text-gray-300">
                      {stats.bpmRange.min} - {stats.bpmRange.max}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-500">
                      Based on {Object.values(releases).filter(r => r.metadata.bpm).length} tracks with BPM data
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No BPM data available yet. Add BPM to your tracks!</p>
              )}
            </div>

            {/* Top Genres Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-gray-100 mb-4">🎸 Top Genres</h2>
              <div className="space-y-2">
                {getTopN(stats.byGenre, 5).map(([genre, count]) => (
                  <div key={genre} className="flex justify-between items-center">
                    <span className="text-gray-300">{genre}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Labels Card */}
            {stats.signed > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-gray-100 mb-4">🏷️ Top Labels</h2>
                <div className="space-y-2">
                  {getTopN(stats.byLabel, 5).map(([label, count]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-gray-300">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.signed) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Keys Card */}
            {Object.keys(stats.byKey).length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-gray-100 mb-4">🎹 Most Common Keys</h2>
                <div className="space-y-2">
                  {getTopN(stats.byKey, 5).map(([key, count]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-300">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(count / Object.values(stats.byKey).reduce((a, b) => a + b, 0)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productivity by Year Card */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-gray-100 mb-4">📅 Production by Year</h2>
              <div className="space-y-2">
                {Object.entries(stats.byYear)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([year, count]) => (
                    <div key={year} className="flex justify-between items-center">
                      <span className="text-gray-300">{year}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
