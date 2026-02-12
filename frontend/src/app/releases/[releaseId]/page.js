'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchRelease, updateDistribution, deleteDistributionEntry, updateDistributionEntry, deleteRelease } from '@/lib/api'
import Modal from '@/components/Modal'
import LogPlatformForm from '@/components/LogPlatformForm'
import LogSubmissionForm from '@/components/LogSubmissionForm'
import DownloadModal from '@/components/DownloadModal'
import DeleteTrackModal from '@/components/DeleteTrackModal'

export default function TrackDetailPage({ params }) {
  const unwrappedParams = use(params)
  const trackId = unwrappedParams.releaseId
  const router = useRouter()

  // State
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showLabelSigningModal, setShowLabelSigningModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Edit/Delete entry state
  const [editingEntry, setEditingEntry] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  
  // Download state
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [fileToDownload, setFileToDownload] = useState(null)
  const [downloadFileType, setDownloadFileType] = useState(null)
  
  // Delete track state
  const [showDeleteTrackModal, setShowDeleteTrackModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load track data
  async function loadTrack() {
    try {
      setLoading(true)
      const data = await fetchRelease(trackId)
      const actualTrack = data.release || data
      setTrack(actualTrack)
      setError(null)
    } catch (err) {
      console.error('Error loading track:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrack()
  }, [trackId])

  // Handlers
  const handleModalSuccess = () => {
    setShowPlatformModal(false)
    setShowSubmissionModal(false)
    loadTrack()
  }

  const handleFileClick = (file, fileType) => {
    setFileToDownload(file)
    setDownloadFileType(fileType)
    setShowDownloadModal(true)
  }

  async function handlePlatformSubmit(formData) {
    setSubmitting(true)
    try {
      const entry = {
        platform: formData.platform,
        status: formData.status,
        timestamp: new Date().toISOString()
      }
      if (formData.url) entry.url = formData.url
      if (formData.notes) entry.notes = formData.notes
      await updateDistribution(trackId, 'release', entry)
      const updatedData = await fetchRelease(trackId)
      const updatedTrack = updatedData.release || updatedData
      setTrack(updatedTrack)
      setShowPlatformModal(false)
    } catch (err) {
      console.error('Error logging platform upload:', err)
      alert('Failed to log upload. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmissionSubmit(formData) {
    setSubmitting(true)
    try {
      const entry = {
        label: formData.label,
        platform: formData.platform,
        status: formData.status,
        timestamp: new Date().toISOString()
      }
      if (formData.notes) entry.notes = formData.notes
      await updateDistribution(trackId, 'submit', entry)
      const updatedData = await fetchRelease(trackId)
      const updatedTrack = updatedData.release || updatedData
      setTrack(updatedTrack)
      setShowSubmissionModal(false)
    } catch (err) {
      console.error('Error logging submission:', err)
      alert('Failed to log submission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsSigned = async (labelName) => {
    try {
      const response = await fetch(`http://localhost:3001/releases/${trackId}/sign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelName })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Backend error:', data)
        alert(`Failed to mark as signed: ${data.error || 'Unknown error'}`)
        return
      }

      console.log('✅ Successfully marked as signed:', data)

      const updatedTrack = await fetchRelease(trackId)
      setTrack(updatedTrack.release || updatedTrack)
      setShowLabelSigningModal(false)

    } catch (error) {
      console.error('Error marking as signed:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteEntry = async (pathType, timestamp) => {
    try {
      await deleteDistributionEntry(trackId, pathType, timestamp)
      console.log('✅ Entry deleted')
      await loadTrack()
      setShowDeleteConfirm(false)
      setEntryToDelete(null)
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const handleEditEntry = async (pathType, timestamp, updatedData) => {
    try {
      await updateDistributionEntry(trackId, pathType, timestamp, updatedData)
      console.log('✅ Entry updated')
      await loadTrack()
      setEditingEntry(null)
    } catch (error) {
      console.error('Error updating entry:', error)
      alert(`Failed to update: ${error.message}`)
    }
  }

  const confirmDelete = (pathType, timestamp, entryLabel) => {
    setEntryToDelete({ pathType, timestamp, label: entryLabel })
    setShowDeleteConfirm(true)
  }

  const handleDeleteTrack = async () => {
    setIsDeleting(true)
    try {
      await deleteRelease(trackId)
      console.log('✅ Track deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting track:', error)
      alert(`Failed to delete track: ${error.message}`)
      setIsDeleting(false)
      setShowDeleteTrackModal(false)
    }
  }

  // Derived state
  const metadata = track
  const artworkUrl = `http://localhost:3001/releases/${trackId}/artwork/`
  
  const signedSubmission = track?.distribution?.submit?.find(s => s.status === 'signed')
  const isSigned = !!signedSubmission
  const signedLabel = signedSubmission?.label || null
  
  const hasSubmissions = track?.distribution?.submit?.length > 0
  const submittedLabel = hasSubmissions ? track.distribution.submit.find(s => s.status !== 'signed')?.label || track.distribution.submit[0].label : null
  
  const showBadge = isSigned || hasSubmissions
  const displayLabel = signedLabel || submittedLabel

  // Loading state
  if (!metadata) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-300">Loading track...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">{metadata.title}</h1>
              <p className="text-3xl text-gray-300">{metadata.artist}</p>
            </div>

            <div className="flex items-center gap-4">
              {showBadge && (
                 <div className={`px-4 py-2 rounded-lg ring-1 ${isSigned ? 'bg-green-500/20 border border-green-500/50 text-green-300 ring-green-500/20' : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 ring-yellow-500/20'}`}>
      <p className="text-sm font-semibold">{isSigned ? '✓ Signed' : '📤 Submitted'}</p>
      <p className="text-xs">{displayLabel}</p>
    </div>
  )}
  <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap">
    ← Back to Catalogue
  </Link>
</div>

         
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6 sticky top-24">
              {/* Artwork */}
              <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden mb-6">
                {(track.files?.artwork?.length > 0 || track.versions?.primary?.files?.artwork?.length > 0) ? (
                  <img src={artworkUrl} alt={`${metadata.title} artwork`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-6xl">🎵</div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Genre</p>
                  <p className="text-sm font-medium text-gray-200">{metadata.genre || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Track Type</p>
                  <p className="text-sm font-medium text-gray-200">{metadata.trackType || metadata.releaseType || 'Original'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Production Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {metadata.trackDate || metadata.releaseDate ? new Date(metadata.trackDate || metadata.releaseDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Track ID</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{metadata.releaseId || 'Not set'}</p>
                </div>
              </div>

              {/* Files */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-semibold text-gray-100 mb-3">Files</h3>
                
                {/* Audio Files */}
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Audio Files:</span> {track.versions?.primary?.files?.audio?.length || track.metadata?.files?.audio?.length || 0}
                  </p>
                  {(track.versions?.primary?.files?.audio || track.metadata?.files?.audio || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-400 ml-4 mb-1">
                      🎵{' '}
                      <button
                        onClick={() => handleFileClick(file, 'audio')}
                        className="text-purple-400 hover:text-purple-300 underline cursor-pointer transition-colors"
                      >
                        {file.filename}
                      </button>
                      <span className="text-gray-500 ml-2">
                        ({Math.round(file.size / 1024 / 1024)}MB{file.duration ? `, ${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}` : ''})
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Artwork Files */}
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Artwork:</span> {track.versions?.primary?.files?.artwork?.length || track.metadata?.files?.artwork?.length || 0}
                  </p>
                  {(track.versions?.primary?.files?.artwork || track.metadata?.files?.artwork || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-400 ml-4 mb-1">
                      🖼️{' '}
                      <button
                        onClick={() => handleFileClick(file, 'artwork')}
                        className="text-purple-400 hover:text-purple-300 underline cursor-pointer transition-colors"
                      >
                        {file.filename}
                      </button>
                      <span className="text-gray-500 ml-2">
                        ({Math.round(file.size / 1024 / 1024)}MB)
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Video Files */}
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Video Files:</span> {track.versions?.primary?.files?.video?.length || track.metadata?.files?.video?.length || 0}
                  </p>
                  {(track.versions?.primary?.files?.video || track.metadata?.files?.video || []).length > 0 ? (
                    (track.versions?.primary?.files?.video || track.metadata?.files?.video || []).map((file, idx) => (
                      <div key={idx} className="text-xs text-gray-400 ml-4 mb-1">
                        🎬{' '}
                        <button
                          onClick={() => handleFileClick(file, 'video')}
                          className="text-purple-400 hover:text-purple-300 underline cursor-pointer transition-colors"
                        >
                          {file.filename}
                        </button>
                        <span className="text-gray-500 ml-2">
                          ({Math.round(file.size / 1024 / 1024)}MB{file.duration ? `, ${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}` : ''})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 ml-4">No video files</div>
                  )}
                </div>
              </div>

              {/* Label Deal Info */}
              {isSigned && metadata.labelInfo && (
  <div className="mt-6 pt-6 border-t border-gray-700">
    <h3 className="font-semibold text-gray-100 mb-3">Label Deal</h3>
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">Label</p>
        <p className="text-sm font-medium text-gray-200">{signedLabel || 'Not set'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">Format</p>
        <p className="text-sm font-medium text-gray-200">{metadata.releaseFormat || metadata.releaseType || 'Single'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">Signed Date</p>
        <p className="text-sm text-gray-300">
          {metadata.labelInfo.signedDate ? new Date(metadata.labelInfo.signedDate).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}) : 'Not set'}
        </p>
      </div>
      <Link
        href={`/releases/${trackId}/label-deal`}
        className="block mt-4 text-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-4 py-2 rounded-lg transition-all font-medium text-sm"
      >
        Label Deal Details →
      </Link>
    </div>
  </div>
)}

            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Label Submissions */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Label Submissions</h2>
                <p className="text-sm text-gray-400 mt-1">Track where you've submitted this track to labels</p>
              </div>
              <div className="p-6">
                {track.distribution?.submit?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.submit.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-lg text-gray-100">{entry.label}</p>
                            <p className="text-sm text-gray-400 mt-1">via {entry.platform} • <span className="font-medium text-gray-300">{entry.status}</span></p>
                            {entry.notes && <p className="text-sm text-gray-500 mt-2 italic">"{entry.notes}"</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'No date'}
                            </span>
                            <button
                              onClick={() => setEditingEntry({ ...entry, pathType: 'submit', index })}
                              className="text-blue-400 hover:text-blue-300 text-sm transition-colors p-1"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete('submit', entry.timestamp, entry.label)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors p-1"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No label submissions logged yet</p>
                )}
                <button 
                  onClick={() => setShowSubmissionModal(true)} 
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium"
                >
                  + Log Label Submission
                </button>
                {!isSigned && track.distribution?.submit?.filter(s => s.status !== 'signed').length > 0 && (
                  <button 
                    onClick={() => setShowLabelSigningModal(true)} 
                    className="mt-3 w-full bg-green-600 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium"
                  >
                    ✓ Mark as Signed by Label
                  </button>
                )}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Platform Distribution</h2>
                <p className="text-sm text-gray-400 mt-1">Track where this track has been uploaded/released</p>
              </div>
              <div className="p-6">
                {track.distribution?.release?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.release.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-100">{entry.platform}</p>
                            <p className="text-sm text-gray-400 mt-1">Status: <span className="text-gray-300">{entry.status}</span></p>
                            {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 mt-1 inline-block transition-colors">View on platform →</a>}
                            {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : entry.generatedAt ? new Date(entry.generatedAt).toLocaleDateString() : 'No date'}
                            </span>
                            <button
                              onClick={() => setEditingEntry({ ...entry, pathType: 'release', index })}
                              className="text-blue-400 hover:text-blue-300 text-sm transition-colors p-1"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete('release', entry.timestamp, entry.platform)}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors p-1"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform uploads logged yet</p>
                )}
                <button 
                  onClick={() => setShowPlatformModal(true)} 
                  className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
                >
                  + Log Platform Release
                </button>
              </div>
            </div>

            {/* Marketing Content */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Marketing Content</h2>
                <p className="text-sm text-gray-400 mt-1">Social media captions and promotional materials</p>
              </div>
              <div className="p-6">
                {track.distribution?.promote?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.promote.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <p className="font-medium text-gray-100">{entry.platform}</p>
                        <p className="text-sm text-gray-300 mt-1">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No promotional content yet</p>
                )}
                <button disabled className="mt-4 w-full bg-gray-700 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
                  Generate Captions (Coming Soon)
                </button>
              </div>
            </div>

            {/* Delete Track Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteTrackModal(true)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium text-sm"
                title="Delete Track"
              >
                🗑️ Delete Track Permanently
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Platform Modal - Add or Edit */}
      <Modal 
        isOpen={showPlatformModal || (editingEntry?.pathType === 'release')} 
        onClose={() => {
          setShowPlatformModal(false)
          setEditingEntry(null)
        }} 
        title={editingEntry?.pathType === 'release' ? "Edit Platform Release" : "Log Platform Release"}
      >
        <LogPlatformForm 
          releaseId={trackId} 
          onSuccess={() => {
            setShowPlatformModal(false)
            setEditingEntry(null)
            loadTrack()
          }} 
          onCancel={() => {
            setShowPlatformModal(false)
            setEditingEntry(null)
          }}
          editMode={editingEntry?.pathType === 'release'}
          existingEntry={editingEntry}
        />
      </Modal>

      {/* Submission Modal - Add or Edit */}
      <Modal 
        isOpen={showSubmissionModal || (editingEntry?.pathType === 'submit')} 
        onClose={() => {
          setShowSubmissionModal(false)
          setEditingEntry(null)
        }} 
        title={editingEntry?.pathType === 'submit' ? "Edit Label Submission" : "Log Label Submission"}
      >
        <LogSubmissionForm 
          releaseId={trackId} 
          onSuccess={() => {
            setShowSubmissionModal(false)
            setEditingEntry(null)
            loadTrack()
          }} 
          onCancel={() => {
            setShowSubmissionModal(false)
            setEditingEntry(null)
          }}
          editMode={editingEntry?.pathType === 'submit'}
          existingEntry={editingEntry}
        />
      </Modal>

      {/* Mark as Signed Modal */}
      <Modal
        isOpen={showLabelSigningModal}
        onClose={() => setShowLabelSigningModal(false)}
        title="Mark Track as Signed"
      >
        <div className="p-4">
          <p className="text-gray-300 mb-4">Select which label signed this track:</p>
          {track.distribution?.submit?.length > 0 ? (
            <div className="space-y-2">
              {track.distribution.submit.map((submission, index) => (
                <button
                  key={index}
                  onClick={() => handleMarkAsSigned(submission.label)}
                  disabled={submitting}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <p className="font-medium text-gray-100">{submission.label}</p>
                  <p className="text-sm text-gray-400">Submitted via {submission.platform}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">No label submissions found. Add a submission first.</p>
          )}
          <button
            onClick={() => setShowLabelSigningModal(false)}
            className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-all"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Entry Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Entry?"
      >
        <div className="p-4">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete this entry?
          </p>
          {entryToDelete && (
            <p className="text-gray-400 text-sm mb-6 bg-gray-800 p-3 rounded">
              <strong className="text-gray-200">{entryToDelete.label}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => handleDeleteEntry(entryToDelete.pathType, entryToDelete.timestamp)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        file={fileToDownload}
        releaseId={trackId}
        fileType={downloadFileType}
      />

      {/* Delete Track Modal */}
      <DeleteTrackModal
        isOpen={showDeleteTrackModal}
        onClose={() => setShowDeleteTrackModal(false)}
        onConfirm={handleDeleteTrack}
        trackTitle={metadata.title}
        trackArtist={metadata.artist}
      />
    </div>
  )
}
