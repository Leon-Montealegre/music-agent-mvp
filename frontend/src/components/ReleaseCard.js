import Link from 'next/link'
import { useState } from 'react'

export default function ReleaseCard({ release }) {
  const artworkUrl = `http://localhost:3001/releases/${release.releaseId}/artwork/`
  const [artworkError, setArtworkError] = useState(false)

  const signedSubmission = release.distribution?.submit?.find(s => s.status?.toLowerCase() === 'signed')
  const isSigned      = !!signedSubmission
  const hasSubmissions = release.distribution?.submit?.length > 0
  const isReleased    = release.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')

  const collectionName = release.collectionId
  ? release.collectionId.replace(/^\d{4}-\d{2}-\d{2}_[^_]+_/, '').replace(/_/g, ' ')

    : null

  const hasArtwork = release.fileCounts?.artwork > 0 && !artworkError

  const VinylSVG = () => (
    <div className="flex items-center justify-center h-full">
      <svg width="140" height="140" viewBox="0 0 120 120" className="opacity-60">
        <defs>
          <radialGradient id={`vinyl-${release.releaseId}`}>
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill={`url(#vinyl-${release.releaseId})`}/>
        <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="1.5"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
        <circle cx="60" cy="60" r="45" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
        <circle cx="60" cy="60" r="40" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
        <circle cx="60" cy="60" r="35" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
        <circle cx="60" cy="60" r="25" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
        <circle cx="60" cy="60" r="8"  fill="#000000" stroke="#9ca3af" strokeWidth="1.5"/>
      </svg>
    </div>
  )

  return (
    <Link href={`/releases/${release.releaseId}`} className="block h-full">
      <div className="h-full flex flex-col bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-lg overflow-hidden shadow-2xl transition-all hover:shadow-purple-500/20 cursor-pointer">

        {/* Artwork */}
        <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative flex-shrink-0">
          {hasArtwork ? (
            <img
              src={artworkUrl}
              alt={`${release.title} artwork`}
              className="w-full h-full object-cover"
              onError={() => setArtworkError(true)}
            />
          ) : (
            <VinylSVG />
          )}

        </div>

        {/* Info */}
        <div className="flex flex-col flex-grow p-4">

          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-100 line-clamp-1">{release.title}</h3>
            <p className="text-sm text-gray-300 line-clamp-1">{release.artist}</p>
            {collectionName ? (
              <p className="text-xs text-indigo-400/80 mt-0.5 line-clamp-1">Part of {collectionName}</p>
            ) : (
              <p className="text-xs text-transparent mt-0.5 select-none">-</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap items-center min-h-[28px] mb-3">
            {release.genre && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-600/30 text-purple-300 border border-purple-500/50">
                {release.genre}
              </span>
            )}
            {release.bpm && <span className="text-xs text-gray-400">⚡ {release.bpm} BPM</span>}
            {release.key && <span className="text-xs text-gray-400">🎹 {release.key}</span>}
          </div>

          <div className="flex gap-2 flex-wrap min-h-[28px] mb-3">
            {isSigned && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/50">
                Signed
              </span>
            )}
            {!isSigned && hasSubmissions && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                Submitted
              </span>
            )}
            {isReleased && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/50">
                Released
              </span>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>{release.distribution?.release?.length || 0} platforms</span>
            <span>{release.distribution?.submit?.length || 0} submissions</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
