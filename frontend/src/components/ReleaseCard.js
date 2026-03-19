'use client'
import Link from 'next/link'
import { useState } from 'react'
import { API_BASE_URL } from '@/lib/api'

export default function ReleaseCard({ release }) {
  const [, setArtworkError] = useState(false)

  const isSigned       = release.distribution?.submit?.some(s => s.status?.toLowerCase() === 'signed')
  const hasSubmissions = release.distribution?.submit?.length > 0
  const isReleased     = release.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')
  const isPromoted     = release.distribution?.promote?.some(e => e.status?.toLowerCase() === 'live')

  const collectionName = release.collectionId
    ? release.collectionId.replace(/^\d{4}-\d{2}-\d{2}_[^_]+_/, '').replace(/_/g, ' ')
    : null

  return (
    <Link href={`/releases/${release.releaseId}`} className="block">
      <div className="flex bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-lg overflow-hidden shadow transition-all hover:shadow-purple-500/20 cursor-pointer">

        {/* Artwork — compact square thumbnail */}
        <div className="w-[88px] h-[88px] flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          <img
            src={`${API_BASE_URL}/releases/${release.releaseId}/artwork`}
            alt={release.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              setArtworkError(true)
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback vinyl — scaled to thumbnail size */}
          <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 120 120" opacity="0.5">
              <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
              <circle cx="60" cy="60" r="30" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
              <circle cx="60" cy="60" r="20" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="7"  fill="#000" stroke="#9ca3af" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0 flex-grow px-3 py-2.5 gap-1">

          {/* Title + artist */}
          <div>
            <h3 className="font-semibold text-sm text-gray-100 truncate leading-tight">{release.title}</h3>
            <p className="text-xs text-gray-400 truncate">{release.artist}</p>
            {collectionName && (
              <p className="text-xs text-indigo-400/70 truncate">Part of {collectionName}</p>
            )}
          </div>

          {/* Tags + status badges — all in one compact row */}
          <div className="flex flex-wrap items-center gap-1">
            {release.genre && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-purple-600/30 text-purple-300 border border-purple-500/40">
                {release.genre}
              </span>
            )}
            {release.bpm && <span className="text-xs text-gray-500">⚡ {release.bpm}</span>}
            {release.key && <span className="text-xs text-gray-500">🎹 {release.key}</span>}
            {isSigned && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/40">Signed</span>
            )}
            {!isSigned && hasSubmissions && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Submitted</span>
            )}
            {isReleased && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/30 text-blue-300 border border-blue-500/40">Released</span>
            )}
            {isPromoted && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-orange-400/30 text-pink-200 border border-pink-400/50">Promoted</span>
            )}
          </div>

        </div>
      </div>
    </Link>
  )
}
