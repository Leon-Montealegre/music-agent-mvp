'use client'

export default function DownloadModal({ isOpen, onClose, file, releaseId, fileType }) {
  if (!isOpen || !file) return null

  const handleDownload = () => {
    const downloadUrl = `http://localhost:3001/releases/${releaseId}/files/${fileType}/${encodeURIComponent(file.filename)}`
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Close modal after initiating download
    setTimeout(() => onClose(), 500)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const getFileIcon = () => {
    if (fileType === 'audio') return '🎵'
    if (fileType === 'artwork') return '🖼️'
    if (fileType === 'video') return '🎬'
    return '📄'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">Download File</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 mb-1">File name</p>
              <p className="text-gray-100 font-medium break-all">{file.filename}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-400">File size</p>
              <p className="text-gray-200">{formatFileSize(file.size)}</p>
            </div>
            
            {file.duration && (
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-gray-200">
                  {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-400">Type</p>
              <p className="text-gray-200 capitalize">{fileType}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              ⬇️ Download
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
