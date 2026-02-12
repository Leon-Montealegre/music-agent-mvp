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

  // Function to load track data
  async function loadTrack() {
    try {
      setLoading(true)
      const data = await fetchRelease(trackId)
      console.log('Full API response:', data)
      
      const actualTrack = data.release || data
      console.log('Actual track:', actualTrack)
      
      setTrack(actualTrack)
      setError(null)
    } catch (err) {
      console.error('Error loading track:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Function to handle successful form submissions
  const handleModalSuccess = () => {
    setShowPlatformModal(false)
    setShowSubmissionModal(false)
    loadTrack() // Reload track data to show new entries
  }

  // Load track on mount
  useEffect(() => {
    loadTrack()
  }, [trackId])

  // Legacy platform submit handler (keeping for backward compatibility)
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
      
      console.log('Submitting entry:', entry)
      
      await updateDistribution(trackId, 'release', entry)
      
      const updatedData = await fetchRelease(trackId)
      const updatedTrack = updatedData.release || updatedData
      console.log('Updated track:', updatedTrack)
      
      setTrack(updatedTrack)
      setShowPlatformModal(false)
      
      console.log('Platform upload logged successfully!')
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
      
      console.log('Submitting label submission:', entry)
      
      await updateDistribution(trackId, 'submit', entry)
      
      const updatedData = await fetchRelease(trackId)
      const updatedTrack = updatedData.release || updatedData
      
      setTrack(updatedTrack)
      setShowSubmissionModal(false)
      
      console.log('Label submission logged successfully!')
    } catch (err) {
      console.error('Error logging submission:', err)
      alert('Failed to log submission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading track...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Track</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
              ← Back to Catalogue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const metadata = track
  const artworkUrl = `http://localhost:3001/releases/${trackId}/artwork/`
  
  const isSigned = metadata.labelInfo?.isSigned || false
  const signedLabel = metadata.labelInfo?.label || null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Catalogue
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{metadata.title}</h1>
              <p className="text-gray-600">{metadata.artist}</p>
            </div>
            
            {isSigned && (
              <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">✓ Signed</p>
                <p className="text-xs">{signedLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-6">
                {(track.files?.artwork?.length > 0 || track.versions?.primary?.files?.artwork?.length > 0) ? (
                  <img
                    src={artworkUrl}
                    alt={`${metadata.title} artwork`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-6xl">
                    🎵
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Genre</p>
                  <p className="text-sm font-medium">{metadata.genre || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Track Type</p>
                  <p className="text-sm font-medium">{metadata.trackType || metadata.releaseType || 'Original'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Production Date</p>
                  <p className="text-sm font-medium">
                    {metadata.trackDate || metadata.releaseDate ? 
                      new Date(metadata.trackDate || metadata.releaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Track ID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{metadata.releaseId || 'Not set'}</p>
                </div>
              </div>

              {/* FILES SECTION - UPDATED WITH FIX 2 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Files</h3>
                
                {/* Audio Files */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Audio Files:</span> {
                      track.versions?.primary?.files?.audio?.length || 
                      track.metadata?.files?.audio?.length || 
                      0
                    }
                  </p>
                  {(track.versions?.primary?.files?.audio || track.metadata?.files?.audio || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-500 ml-4 mb-1">
                    🎵 {file.filename} 
                    <span className="text-gray-400 ml-2">
                      ({Math.round(file.size / 1024 / 1024)}MB
                      {file.duration ? `, ${Math.floor(file.duration / 60)}:${String(file.duration % 60).padStart(2, '0')}` : ''})
                    </span>
                  </div>
                  ))}
                </div>
                
                {/* Artwork Files */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Artwork:</span> {
                      track.versions?.primary?.files?.artwork?.length || 
                      track.metadata?.files?.artwork?.length || 
                      0
                    }
                  </p>
                  {(track.versions?.primary?.files?.artwork || track.metadata?.files?.artwork || []).map((file, idx) => (
                    <div key={idx} className="text-xs text-gray-500 ml-4 mb-1">
                      🖼️ {file.filename}
                      <span className="text-gray-400 ml-2">
                        ({Math.round(file.size / 1024 / 1024)}MB)
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Video Files (if any) */}
                {((track.versions?.primary?.files?.video || track.metadata?.files?.video || []).length > 0) && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Video:</span> {
                        track.versions?.primary?.files?.video?.length || 
                        track.metadata?.files?.video?.length || 
                        0
                      }
                    </p>
                    {(track.versions?.primary?.files?.video || track.metadata?.files?.video || []).map((file, idx) => (
                      <div key={idx} className="text-xs text-gray-500 ml-4 mb-1">
                        🎬 {file.filename}
                        <span className="text-gray-400 ml-2">
                          ({Math.round(file.size / 1024 / 1024)}MB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* END FILES SECTION */}

              {isSigned && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Label Deal</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                     <p className="text-xs text-gray-500 uppercase">Format</p>
                      <p className="text-sm font-medium">{metadata.releaseFormat || metadata.releaseType || 'Single'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Signed Date</p>
                      <p className="text-sm">
                        {metadata.labelInfo.signedDate ? 
                          new Date(metadata.labelInfo.signedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'Not set'
                        }
                      </p>
                    </div>
                    {metadata.labelInfo.contractDocuments?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Contract Documents</p>
                        {metadata.labelInfo.contractDocuments.map((doc, idx) => (
                          <p key={idx} className="text-xs text-gray-600">📄 {doc}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {metadata.versions && Object.keys(metadata.versions).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Versions</h3>
                  <div className="space-y-2 text-sm">
                    {Object.values(metadata.versions).map((version) => (
                      <div key={version.versionId} className="text-gray-700">
                        • {version.versionName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Label Submissions</h2>
                <p className="text-sm text-gray-600 mt-1">Track where you've submitted this track to labels</p>
              </div>
              <div className="p-6">
                {track.distribution?.submit?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.submit.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-lg">{entry.label}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              via {entry.platform} • <span className="font-medium">{entry.status}</span>
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">"{entry.notes}"</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No label submissions logged yet</p>
                )}
                
                <button 
                  onClick={() => setShowSubmissionModal(true)}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  + Log Label Submission
                </button>

                {!isSigned && track.distribution?.submit?.length > 0 && (
                  <button 
                    onClick={() => setShowLabelSigningModal(true)}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    ✓ Mark as Signed by Label
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Platform Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">Track where this track has been uploaded/released</p>
              </div>
              <div className="p-6">
                {track.distribution?.release?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.release.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.platform}</p>
                            <p className="text-sm text-gray-600 mt-1">Status: {entry.status}</p>
                            {entry.url && (
                              <a 
                                href={entry.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-700 mt-1 inline-block"
                              >
                                View on platform →
                              </a>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 
                             entry.generatedAt ? new Date(entry.generatedAt).toLocaleDateString() : 
                             'No date'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform uploads logged yet</p>
                )}
                
                <button
                  onClick={() => setShowPlatformModal(true)}
                  className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
                >
                  + Log Platform Release
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Marketing Content</h2>
                <p className="text-sm text-gray-600 mt-1">Social media captions and promotional materials</p>
              </div>
              <div className="p-6">
                {track.distribution?.promote?.length > 0 ? (
                  <div className="space-y-3">
                    {track.distribution.promote.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">{entry.platform}</p>
                        <p className="text-sm text-gray-600 mt-1">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No promotional content yet</p>
                )}
                
                <button 
                  disabled
                  className="mt-4 w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                >
                  Generate Captions (Coming Soon)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Modal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        title="Log Platform Upload"
      >
      <LogPlatformForm
        releaseId={trackId}
        onSuccess={handleModalSuccess}
        onCancel={() => setShowPlatformModal(false)}
      />
      </Modal>

      <Modal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        title="Log Label Submission"
      >
      <LogSubmissionForm
        releaseId={trackId}
        onSuccess={handleModalSuccess}
        onCancel={() => setShowSubmissionModal(false)}
      />
      </Modal>

      <Modal
        isOpen={showLabelSigningModal}
        onClose={() => setShowLabelSigningModal(false)}
        title="Mark Track as Signed"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">This feature will be implemented in the next update!</p>
          <p className="text-sm text-gray-500 mb-4">
            You'll be able to mark this track as signed by a label and upload contract documents.
          </p>
          <button
            onClick={() => setShowLabelSigningModal(false)}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  )
}
