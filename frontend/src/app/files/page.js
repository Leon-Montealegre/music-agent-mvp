'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { fetchAllFiles } from '@/lib/contacts'

const CATEGORIES = ['All', 'Label Deal', 'Promo Deal', 'Label Submission', 'Promo Entry', 'Notes']

function getFileType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return { icon: '📄', tint: 'text-red-400' }
  if (['wav', 'mp3', 'flac', 'aiff', 'm4a', 'ogg'].includes(ext)) return { icon: '🎵', tint: 'text-purple-400' }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return { icon: '🖼️', tint: 'text-blue-400' }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return { icon: '🎬', tint: 'text-orange-400' }
  return { icon: '📎', tint: 'text-gray-400' }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const CATEGORY_BADGE_STYLES = {
  'Label Deal': 'bg-purple-600/40 text-purple-300 border-purple-500/50',
  'Promo Deal': 'bg-pink-600/40 text-pink-300 border-pink-500/50',
  'Label Submission': 'bg-blue-600/40 text-blue-300 border-blue-500/50',
  'Promo Entry': 'bg-rose-600/40 text-rose-300 border-rose-500/50',
  'Notes': 'bg-gray-600/40 text-gray-400 border-gray-500/50',
}

async function handleDownload(downloadUrl, filename) {
  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    // Fallback: open in new tab (server may trigger download via Content-Disposition)
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchAllFiles()
        setFiles(data)
        setError(null)
      } catch (err) {
        console.error('Error loading files:', err)
        setError(err.message)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredFiles = useMemo(() => {
    let list = files
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(f => (f.filename || '').toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      list = list.filter(f => f.category === categoryFilter)
    }
    return list
  }, [files, searchQuery, categoryFilter])

  const totalCount = files.length

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-lg font-medium mb-2">Could not load files</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Files</h1>
            <p className="text-gray-400">
              {totalCount} file{totalCount !== 1 ? 's' : ''} across your catalogue
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500 text-sm font-medium">Filter:</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === 'All' ? 'all' : cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                    (categoryFilter === 'all' && cat === 'All') || categoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-full rounded-lg bg-gray-700/60 animate-pulse"
              />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No files uploaded yet</h2>
            <p className="text-gray-500">Upload documents to your releases and collections to see them here.</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No files match your search</h2>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg overflow-hidden">
            {filteredFiles.map((file, idx) => {
              const { icon, tint } = getFileType(file.filename)
              const badgeStyle = CATEGORY_BADGE_STYLES[file.category] || 'bg-gray-600/40 text-gray-400 border-gray-500/50'
              return (
                <div
                  key={file.filename + file.sourceId + idx}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-700/80 last:border-b-0 hover:bg-white/[0.04] transition-colors"
                >
                  <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl ${tint}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
                      {file.category}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-20 text-right">
                    <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                  </div>
                  <div className="flex-shrink-0 w-24 text-right">
                    <p className="text-sm text-gray-500">{formatDate(file.uploadedAt)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      href={file.sourceHref}
                      className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 truncate max-w-[120px] inline-block"
                    >
                      {file.sourceName}
                    </Link>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file.downloadUrl, file.filename)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ↓ Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
