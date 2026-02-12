'use client'

export default function DeleteTrackModal({ isOpen, onClose, onConfirm, trackTitle, trackArtist }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-800 border border-red-500/50 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-red-400">⚠️ Delete Track</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete this track? This action <strong className="text-red-400">cannot be undone</strong>.
          </p>
          
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Track to delete:</p>
            <p className="text-gray-100 font-semibold">{trackTitle}</p>
            <p className="text-gray-300 text-sm">{trackArtist}</p>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> All files, metadata, distribution logs, and submissions will be permanently deleted.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg transition-all font-medium"
            >
              🗑️ Delete Permanently
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
