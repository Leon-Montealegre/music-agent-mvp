'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ReleaseCard({ release }) {
  const [imageError, setImageError] = useState(false)
  
  // Build the artwork URL (with trailing slash!)
  const artworkUrl = `http://localhost:3001/releases/${release.releaseId}/artwork/`
  
  // Calculate actual counts from distribution data
  const platformCount = release.distribution?.release?.length || 0
  const submissionCount = release.distribution?.submit?.length || 0 
  
  return (
    <Link href={`/releases/${release.releaseId}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {/* Artwork */}
        <div className="aspect-square bg-gray-200 relative">
          {release.fileCounts?.artwork > 0 && !imageError ? (
            <img
              src={artworkUrl}
              alt={`${release.title} artwork`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-6xl">
              🎵
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title & Artist */}
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
            {release.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 truncate">
            {release.artist}
          </p>

          {/* Genre Tag */}
          <div className="mb-3">
            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
              {release.genre}
            </span>
          </div>

          {/* Release Date */}
          <p className="text-xs text-gray-500 mb-3">
            {new Date(release.releaseDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>

          {/* Status Indicators */}
          <div className="flex gap-4 text-xs text-gray-600">
            <span>{platformCount} platform{platformCount !== 1 ? 's' : ''}</span>
            <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Version Count */}
          {release.versionCount > 1 && (
            <div className="mt-2 text-xs text-gray-500">
              {release.versionCount} versions
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
