import Link from 'next/link'

export default function ReleaseCard({ release }) {
  const artworkUrl = `http://localhost:3001/releases/${release.releaseId}/artwork/`
  
  // Badge logic - check submission status for 'signed'
  const signedSubmission = release.distribution?.submit?.find(s => s.status === 'signed')
  const isSigned = !!signedSubmission
  const signedLabel = signedSubmission?.label || null
  
  const hasSubmissions = release.distribution?.submit?.length > 0
  const submittedLabel = hasSubmissions ? release.distribution.submit[0].label : null
  
  const showBadge = isSigned || hasSubmissions
  const badgeLabel = signedLabel || submittedLabel

  return (
    <Link href={`/releases/${release.releaseId}`}>
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-lg overflow-hidden shadow-2xl transition-all hover:shadow-purple-500/20 cursor-pointer">
        {/* Artwork */}
        <div className="aspect-square bg-gray-900/50 overflow-hidden">
          {release.fileCounts?.artwork > 0 ? (
            <img 
              src={artworkUrl} 
              alt={`${release.title} artwork`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-6xl">
              🎵
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-100 mb-1 line-clamp-1">
            {release.title}
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            {release.artist}
          </p>

          {/* Tags Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Genre Tag */}
            {release.genre && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-xs font-medium ring-1 ring-purple-500/20">
                {release.genre}
              </span>
            )}

            {/* Signed/Submitted Badge */}
            {showBadge && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                isSigned 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50 ring-green-500/20' 
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 ring-yellow-500/20'
              }`}>
                {isSigned ? '✓ Signed' : '📤 Submitted'}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>
              {release.distribution?.release?.length || 0} platforms
            </span>
            <span>
              {release.distribution?.submit?.length || 0} submissions
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
