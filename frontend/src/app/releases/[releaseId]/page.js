'use client'

import { use, useEffect, useState } from 'react'
import { fetchRelease, updateDistribution } from '@/lib/api'
import Link from 'next/link'
import Modal from '@/components/Modal'
import LogPlatformForm from '@/components/LogPlatformForm'
import LogSubmissionForm from '@/components/LogSubmissionForm'

export default function ReleaseDetailPage({ params }) {
  const unwrappedParams = use(params)
  const releaseId = unwrappedParams.releaseId

  const [release, setRelease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)  // Fixed: was duplicate showPlatformModal
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadRelease() {
      try {
        const data = await fetchRelease(releaseId)
        console.log('Full API response:', data)
        
        const actualRelease = data.release || data
        console.log('Actual release:', actualRelease)
        
        setRelease(actualRelease)
      } catch (err) {
        console.error('Error loading release:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  
    loadRelease()
  }, [releaseId])

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
      
      await updateDistribution(releaseId, 'release', entry)
      
      const updatedData = await fetchRelease(releaseId)
      const updatedRelease = updatedData.release || updatedData
      console.log('Updated release:', updatedRelease)
      
      setRelease(updatedRelease)
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
      
      await updateDistribution(releaseId, 'submit', entry)
      
      const updatedData = await fetchRelease(releaseId)
      const updatedRelease = updatedData.release || updatedData
      
      setRelease(updatedRelease)
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
          <p className="text-gray-600">Loading release...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Release</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const metadata = release
  const artworkUrl = `http://localhost:3001/releases/${releaseId}/artwork/`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{metadata.title}</h1>
          <p className="text-gray-600">{metadata.artist}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Artwork & Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              {/* Artwork */}
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-6">
                {metadata.files?.artwork?.length > 0 ? (
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

              {/* Basic Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Genre</p>
                  <p className="text-sm font-medium">{metadata.genre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Release Type</p>
                  <p className="text-sm font-medium">{metadata.releaseType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Release Date</p>
                  <p className="text-sm font-medium">
                    {new Date(metadata.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Release ID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{metadata.releaseId}</p>
                </div>
              </div>

              {/* Files */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Files</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Audio:</span>
                    <span className="font-medium">{metadata.files?.audio?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Artwork:</span>
                    <span className="font-medium">{metadata.files?.artwork?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Video:</span>
                    <span className="font-medium">{metadata.files?.video?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Versions */}
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

          {/* Right Column - Distribution Tracking */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section A: Release Path - Platform Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Platform Status</h2>
                <p className="text-sm text-gray-600 mt-1">Track where you've uploaded this release</p>
              </div>
              <div className="p-6">
                {release.distribution?.release?.length > 0 ? (
                  <div className="space-y-3">
                    {release.distribution.release.map((entry, index) => (
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
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Log Platform Upload
                </button>
              </div>
            </div>

            {/* Section B: Submit Path - Label Submissions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Label Submissions</h2>
                <p className="text-sm text-gray-600 mt-1">Track where you've submitted this release</p>
              </div>
              <div className="p-6">
                {release.distribution?.submit?.length > 0 ? (
                  <div className="space-y-3">
                    {release.distribution.submit.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.label}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              via {entry.platform} • {entry.status}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
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
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Log Label Submission
                </button>
              </div>
            </div>

            {/* Section C: Promote Path - Marketing Content */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Marketing Content</h2>
                <p className="text-sm text-gray-600 mt-1">Social media captions and promotional materials</p>
              </div>
              <div className="p-6">
                {release.distribution?.promote?.length > 0 ? (
                  <div className="space-y-3">
                    {release.distribution.promote.map((entry, index) => (
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
                  Generate Captions (Coming in Mini-MVP 5)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Platform Upload Modal */}
      <Modal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        title="Log Platform Upload"
      >
        <LogPlatformForm
          onSubmit={handlePlatformSubmit}
          onCancel={() => setShowPlatformModal(false)}
        />
      </Modal>

      {/* Label Submission Modal */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        title="Log Label Submission"
      >
        <LogSubmissionForm
          onSubmit={handleSubmissionSubmit}
          onCancel={() => setShowSubmissionModal(false)}
        />
      </Modal>
    </div>
  )
}