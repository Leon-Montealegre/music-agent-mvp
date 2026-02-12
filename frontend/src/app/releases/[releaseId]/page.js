'use client'

import { use, useEffect, useState } from 'react'
import { fetchRelease, updateDistribution } from '@/lib/api'
import Link from 'next/link'
import Modal from '@/components/Modal'
import LogPlatformForm from '@/components/LogPlatformForm'
import LogSubmissionForm from '@/components/LogSubmissionForm'

export default function TrackDetailPage({ params }) {
  const unwrappedParams = use(params)
  const trackId = unwrappedParams.releaseId

  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showLabelSigningModal, setShowLabelSigningModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
  
  const handleModalSuccess = () => {
    setShowPlatformModal(false)
    setShowSubmissionModal(false)
    loadTrack()
  }

  useEffect(() => {
    loadTrack()
  }, [trackId])

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

  // ✅ FIXED: Changed releaseId → trackId, and setShowSignModal → setShowLabelSigningModal
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
  
      // Reload track data
      const updatedTrack = await fetchRelease(trackId)
      setTrack(updatedTrack.release || updatedTrack)
      setShowLabelSigningModal(false)
  
    } catch (error) {
      console.error('Error marking as signed:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const metadata = track
  const artworkUrl = `http://localhost:3001/releases/${trackId}/artwork/`
  
  // Safety check: Only access labelInfo if metadata exists
  const isSigned = metadata?.labelInfo?.isSigned || false
  const signedLabel = metadata?.labelInfo?.label || null
  const hasSubmissions = track?.distribution?.submit?.length > 0
  const displayLabel = signedLabel || (hasSubmissions ? track.distribution.submit[0].label : null)
  const showBadge = isSigned || hasSubmissions
  
  // Additional safety check - don't render if no track data
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
              <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap">← Back to Catalogue</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6 sticky top-24">
              <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden mb-6">
                {(track.files?.artwork?.length > 0 || track.versions?.primary?.files?.artwork?.length > 0) ? (
                  <img src={artworkUrl} alt={`${metadata.title} artwork`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-6xl">🎵</div>
                )}
              </div>

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

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-semibold text-gray-100 mb-3">Files</h3>
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Audio Files:</span> {track.versions?.primary?.files?.audio?.length || track.metadata?.files?.audio?.length || 0}
                  </p>
                  {(track.versions?.primary?.files?.audio || track.metadata?.files?.audio || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-400 ml-4 mb-1">
                      🎵 {file.filename} <span className="text-gray-500 ml-2">({Math.round(file.size / 1024 / 1024)}MB{file.duration ? `, ${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}` : ''})</span>
                    </div>
                  ))}
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-300 mb-1">
                    <span className="font-medium">Artwork:</span> {track.versions?.primary?.files?.artwork?.length || track.metadata?.files?.artwork?.length || 0}
                  </p>
                  {(track.versions?.primary?.files?.artwork || track.metadata?.files?.artwork || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-400 ml-4 mb-1">
                      🖼️ {file.filename} <span className="text-gray-500 ml-2">({Math.round(file.size / 1024 / 1024)}MB)</span>
                    </div>
                  ))}
                </div>
              </div>

              {isSigned && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="font-semibold text-gray-100 mb-3">Label Deal</h3>
                  <div className="space-y-2 text-sm">
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
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
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
                          <div>
                            <p className="font-medium text-lg text-gray-100">{entry.label}</p>
                            <p className="text-sm text-gray-400 mt-1">via {entry.platform} • <span className="font-medium text-gray-300">{entry.status}</span></p>
                            {entry.notes && <p className="text-sm text-gray-500 mt-2 italic">"{entry.notes}"</p>}
                          </div>
                          <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'No date'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No label submissions logged yet</p>
                )}
                <button onClick={() => setShowSubmissionModal(true)} className="mt-4 w-full bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">+ Log Label Submission</button>
                {!isSigned && track.distribution?.submit?.length > 0 && (
                  <button onClick={() => setShowLabelSigningModal(true)} className="mt-3 w-full bg-green-600 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">✓ Mark as Signed by Label</button>
                )}
              </div>
            </div>

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
                          <div>
                            <p className="font-medium text-gray-100">{entry.platform}</p>
                            <p className="text-sm text-gray-400 mt-1">Status: <span className="text-gray-300">{entry.status}</span></p>
                            {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 mt-1 inline-block transition-colors">View on platform →</a>}
                            {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                          </div>
                          <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : entry.generatedAt ? new Date(entry.generatedAt).toLocaleDateString() : 'No date'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform uploads logged yet</p>
                )}
                <button onClick={() => setShowPlatformModal(true)} className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium">+ Log Platform Release</button>
              </div>
            </div>

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
                <button disabled className="mt-4 w-full bg-gray-700 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">Generate Captions (Coming Soon)</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showPlatformModal} onClose={() => setShowPlatformModal(false)} title="Log Platform Upload">
        <LogPlatformForm releaseId={trackId} onSuccess={handleModalSuccess} onCancel={() => setShowPlatformModal(false)} />
      </Modal>

      <Modal isOpen={showSubmissionModal} onClose={() => setShowSubmissionModal(false)} title="Log Label Submission">
        <LogSubmissionForm releaseId={trackId} onSuccess={handleModalSuccess} onCancel={() => setShowSubmissionModal(false)} />
      </Modal>

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
    </div>
  )
}
