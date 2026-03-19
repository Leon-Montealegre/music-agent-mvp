'use client'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/api'

export default function ReleaseCard({ release }) {
  const isSigned       = release.distribution?.submit?.some(s => s.status?.toLowerCase() === 'signed')
  const hasSubmissions = release.distribution?.submit?.length > 0
  const isReleased     = release.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')
  const isPromoted     = release.distribution?.promote?.some(e => e.status?.toLowerCase() === 'live')
  const hasAnyBadge    = isSigned || hasSubmissions || isReleased || isPromoted

  const collectionName = release.collectionId
    ? release.collectionId.replace(/^\d{4}-\d{2}-\d{2}_[^_]+_/, '').replace(/_/g, ' ')
    : null

  return (
    <Link href={`/releases/${release.releaseId}`} className="block group">
      <div className="flex flex-col bg-gray-800/80 border border-gray-700 group-hover:border-purple-500 rounded-xl overflow-hidden shadow-lg transition-all duration-200 group-hover:shadow-purple-500/20 group-hover:-translate-y-0.5">

        {/* Artwork — fixed height, not aspect-square */}
        <div className="h-44 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden flex-shrink-0">
          <img
            src={`${API_BASE_URL}/releases/${release.releaseId}/artwork`}
            alt={release.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback vinyl */}
          <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 120 120" opacity="0.4">
              <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
              <circle cx="60" cy="60" r="40" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
              <circle cx="60" cy="60" r="32" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
              <circle cx="60" cy="60" r="22" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="8"  fill="#000" stroke="#9ca3af" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>

        {/* Info strip */}
        <div className="p-3 flex flex-col gap-1.5">

          {/* Title + artist */}
          <div>
            <h3 className="font-semibold text-base text-gray-100 truncate leading-snug">
              {release.title}
            </h3>
            <p className="text-sm text-gray-400 truncate">{release.artist}</p>
            {collectionName && (
              <p className="text-xs text-indigo-400/70 truncate mt-0.5">Part of {collectionName}</p>
            )}
          </div>

          {/* Metadata tags */}
          {(release.genre || release.bpm || release.key) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {release.genre && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-600/25 text-purple-300 border border-purple-500/30">
                  {release.genre}
                </span>
              )}
              {release.bpm && (
                <span className="text-xs text-gray-500">⚡ {release.bpm} BPM</span>
              )}
              {release.key && (
                <span className="text-xs text-gray-500">🎹 {release.key}</span>
              )}
            </div>
          )}

          {/* Status badges — only rendered if at least one is active */}
          {hasAnyBadge && (
            <div className="flex flex-wrap gap-1">
              {isSigned && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Signed</span>
              )}
              {!isSigned && hasSubmissions && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Submitted</span>
              )}
              {isReleased && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600/25 text-blue-300 border border-blue-500/30">Released</span>
              )}
              {isPromoted && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500/25 via-rose-500/25 to-orange-400/25 text-pink-200 border border-pink-400/40">Promoted</span>
              )}
            </div>
          )}

        </div>
      </div>
    </Link>
  )
}
