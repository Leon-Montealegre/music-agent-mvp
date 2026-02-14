import Link from 'next/link'


export default function ReleaseCard({ release }) {
  const artworkUrl = `http://localhost:3001/releases/${release.releaseId}/artwork/`
  
  // Badge logic - check submission status for 'signed'
  const signedSubmission = release.distribution?.submit?.find(s => s.status === 'signed')
  const isSigned = !!signedSubmission
  const signedLabel = signedSubmission?.label || null
  
  const hasSubmissions = release.distribution?.submit?.length > 0
  const submittedLabel = hasSubmissions ? release.distribution.submit[0].label : null
  
  // Released badge logic
  const isReleased = release.distribution?.release?.some(
    entry => entry.status?.toLowerCase() === 'live'
  )
  
  const showBadge = isSigned || hasSubmissions


  return (
    <Link href={`/releases/${release.releaseId}`}>
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-lg overflow-hidden shadow-2xl transition-all hover:shadow-purple-500/20 cursor-pointer">
        {/* Artwork */}
        <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          {release.fileCounts?.artwork > 0 ? (
            <img 
              src={artworkUrl} 
              alt={`${release.title} artwork`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {/* Vinyl Record SVG */}
              <svg width="140" height="140" viewBox="0 0 120 120" className="opacity-60">
                {/* Glow effect */}
                <defs>
                  <radialGradient id="vinylGlow">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.1"/>
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="58" fill="url(#vinylGlow)"/>
                
                {/* Outer vinyl circle */}
                <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="1.5"/>
                
                {/* Grooves - lighter for visibility */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="45" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="40" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
                <circle cx="60" cy="60" r="35" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
                
                {/* Label area - with purple tint */}
                <circle cx="60" cy="60" r="25" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
                
                {/* Center hole */}
                <circle cx="60" cy="60" r="8" fill="#000000" stroke="#9ca3af" strokeWidth="1.5"/>
              </svg>
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

          {/* Badges Row */}
          {(showBadge || isReleased) && (
            <div className="mb-3 flex gap-2 flex-wrap">
              {showBadge && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                  isSigned 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50 ring-green-500/20' 
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 ring-yellow-500/20'
                }`}>
                  {isSigned ? '✓ Signed' : '📤 Submitted'}
                </span>
              )}
              
              {isReleased && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/50 ring-1 ring-blue-500/20">
                  🔴 Released
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
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
