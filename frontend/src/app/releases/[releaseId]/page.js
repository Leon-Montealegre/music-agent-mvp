'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchRelease, updateDistribution, deleteDistributionEntry, updateDistributionEntry, deleteRelease } from '@/lib/api'
import Modal from '@/components/Modal'
import BackButton from '@/components/BackButton'
import LogPlatformForm from '@/components/LogPlatformForm'
import LogSubmissionForm from '@/components/LogSubmissionForm'
import DownloadModal from '@/components/DownloadModal'
import DeleteTrackModal from '@/components/DeleteTrackModal'
import TrackNotes from '@/components/TrackNotes'
import EditMetadataModal from '@/components/EditMetadataModal'


function CollectionThumb({ collectionId }) {
  const [error, setError] = useState(false)
  if (error) return null
  return (
    <img
      src={`http://localhost:3001/collections/${collectionId}/artwork?t=${Date.now()}`}
      alt=""
      className="w-8 h-8 rounded object-cover border border-indigo-500/40 flex-shrink-0"
      onError={() => setError(true)}
    />
  )
}


export default function TrackDetailPage({ params }) {
  const unwrappedParams = use(params)
  const trackId = unwrappedParams.releaseId
  const router  = useRouter()

  const [track, setTrack]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const [showPlatformModal, setShowPlatformModal]         = useState(false)
  const [showSubmissionModal, setShowSubmissionModal]     = useState(false)
  const [showLabelSigningModal, setShowLabelSigningModal] = useState(false)
  const [submitting, setSubmitting]                       = useState(false)
  const [showEditModal, setShowEditModal]                 = useState(false)
  const [editingEntry, setEditingEntry]                   = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm]         = useState(false)
  const [entryToDelete, setEntryToDelete]                 = useState(null)
  const [showDownloadModal, setShowDownloadModal]         = useState(false)
  const [fileToDownload, setFileToDownload]               = useState(null)
  const [downloadFileType, setDownloadFileType]           = useState(null)
  const [showDeleteTrackModal, setShowDeleteTrackModal]   = useState(false)
  const [isDeleting, setIsDeleting]                       = useState(false)
  const [sidebarArtworkError, setSidebarArtworkError]     = useState(false)
  const [uploadingFile, setUploadingFile]                 = useState(null) // 'audio'|'artwork'|'video'|null

  // Links
  const [showAddLink, setShowAddLink]   = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl]     = useState('')

  // Hidden file inputs
  const audioInputRef   = useRef(null)
  const artworkInputRef = useRef(null)
  const videoInputRef   = useRef(null)


  // ── Data loading ──────────────────────────────────────────────────────────

  async function loadTrack() {
    try {
      setLoading(true)
      const data = await fetchRelease(trackId)
      setTrack(data.release || data)
      setError(null)
    } catch (err) {
      console.error('Error loading track:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrack() }, [trackId])


  // ── File handlers ─────────────────────────────────────────────────────────

  const handleFileClick = (file, fileType) => {
    setFileToDownload(file)
    setDownloadFileType(fileType)
    setShowDownloadModal(true)
  }

  const handleDeleteAudio = async (filename) => {
    if (!confirm(`Delete ${filename}? This cannot be undone.`)) return
    try {
      const res = await fetch(
        `http://localhost:3001/releases/${trackId}/versions/primary/audio/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete audio')
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDeleteArtwork = async () => {
    if (!confirm('Delete artwork? This cannot be undone.')) return
    try {
      const res = await fetch(`http://localhost:3001/releases/${trackId}/artwork`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete artwork')
      setSidebarArtworkError(true)
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDeleteVideo = async (filename) => {
    if (!confirm(`Delete ${filename}? This cannot be undone.`)) return
    try {
      const res = await fetch(
        `http://localhost:3001/releases/${trackId}/video/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete video')
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleUploadAudio = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile('audio')
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Use dedicated endpoint — no version-conflict check
      const res = await fetch(
        `http://localhost:3001/releases/${trackId}/versions/primary/audio`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUploadingFile(null)
      e.target.value = ''
    }
  }

  const handleUploadArtwork = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile('artwork')
    try {
      const formData = new FormData()
      formData.append('artwork', file)
      const res = await fetch(`http://localhost:3001/releases/${trackId}/artwork`, {
        method: 'POST', body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setSidebarArtworkError(false)
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUploadingFile(null)
      e.target.value = ''
    }
  }

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile('video')
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Use dedicated endpoint — bypasses versions entirely
      const res = await fetch(
        `http://localhost:3001/releases/${trackId}/video`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUploadingFile(null)
      e.target.value = ''
    }
  }


  // ── Link handlers ─────────────────────────────────────────────────────────

  // FIX: include id so the server can find and filter the correct link
  const handleAddLink = async () => {
    if (!newLinkUrl) return
    try {
      const res = await fetch(`http://localhost:3001/releases/${trackId}/song-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:    Date.now().toString(),
          label: newLinkLabel || newLinkUrl,
          url:   newLinkUrl
        })
      })
      if (!res.ok) throw new Error('Failed to add link')
      setNewLinkLabel('')
      setNewLinkUrl('')
      setShowAddLink(false)
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  // FIX: pass link.id (not array index) — server filters by link.id
  const handleDeleteLink = async (linkId) => {
    try {
      const res = await fetch(
        `http://localhost:3001/releases/${trackId}/song-links/${linkId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete link')
      await loadTrack()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }


  // ── Distribution handlers ─────────────────────────────────────────────────

  async function handlePlatformSubmit(formData) {
    setSubmitting(true)
    try {
      const entry = { platform: formData.platform, status: formData.status, timestamp: new Date().toISOString() }
      if (formData.url)   entry.url   = formData.url
      if (formData.notes) entry.notes = formData.notes
      await updateDistribution(trackId, 'release', entry)
      const updatedData = await fetchRelease(trackId)
      setTrack(updatedData.release || updatedData)
      setShowPlatformModal(false)
    } catch {
      alert('Failed to log upload. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmissionSubmit(formData) {
    setSubmitting(true)
    try {
      const entry = { label: formData.label, platform: formData.platform, status: formData.status, timestamp: new Date().toISOString() }
      if (formData.notes) entry.notes = formData.notes
      await updateDistribution(trackId, 'submit', entry)
      const updatedData = await fetchRelease(trackId)
      setTrack(updatedData.release || updatedData)
      setShowSubmissionModal(false)
    } catch {
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
      if (!response.ok) { alert(`Failed to mark as signed: ${data.error || 'Unknown error'}`); return }
      const updatedTrack = await fetchRelease(trackId)
      setTrack(updatedTrack.release || updatedTrack)
      setShowLabelSigningModal(false)
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDeleteEntry = async (pathType, timestamp) => {
    try {
      await deleteDistributionEntry(trackId, pathType, timestamp)
      await loadTrack()
      setShowDeleteConfirm(false)
      setEntryToDelete(null)
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const handleEditEntry = async (pathType, timestamp, updatedData) => {
    try {
      await updateDistributionEntry(trackId, pathType, timestamp, updatedData)
      await loadTrack()
      setEditingEntry(null)
    } catch (err) {
      alert(`Failed to update: ${err.message}`)
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
      router.push('/')
    } catch (err) {
      alert(`Failed to delete track: ${err.message}`)
      setIsDeleting(false)
      setShowDeleteTrackModal(false)
    }
  }


  // ── Loading / error states ────────────────────────────────────────────────

  if (loading || !track) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-300">Loading track...</p>
        </div>
      </div>
    )
  }

  const metadata   = track.metadata || track
  const artworkUrl = `http://localhost:3001/releases/${trackId}/artwork/?t=${Date.now()}`

  const signedSubmission = metadata.distribution?.submit?.find(s => s.status?.toLowerCase() === 'signed')
  const isSigned         = !!signedSubmission
  const signedLabel      = signedSubmission?.label || null
  const hasSubmissions   = metadata.distribution?.submit?.length > 0
  const submittedLabel   = hasSubmissions
    ? metadata.distribution.submit.find(s => s.status !== 'signed')?.label || metadata.distribution.submit[0].label
    : null
  const isReleased     = metadata.distribution?.release?.some(e => e.status?.toLowerCase() === 'live')
  const displayLabel   = signedLabel || submittedLabel
  const collectionType = metadata.releaseFormat || metadata.releaseType || 'Single'
  const collectionName = metadata.collectionId
    ? metadata.collectionId.replace(/^\d{4}-\d{2}-\d{2}_[^_]+_/, '').replace(/_/g, ' ')
    : null

  const audioFiles   = track.versions?.primary?.files?.audio  || []
  const artworkFiles = track.versions?.primary?.files?.artwork || []
  const videoFiles   = track.versions?.primary?.files?.video  || []
  const hasArtwork   = !sidebarArtworkError


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      {/* Hidden file inputs */}
      <input ref={audioInputRef}   type="file" accept=".wav,.mp3,.flac,.aiff,.m4a" className="hidden" onChange={handleUploadAudio}   />
      <input ref={artworkInputRef} type="file" accept=".jpg,.jpeg,.png,.webp"       className="hidden" onChange={handleUploadArtwork} />
      <input ref={videoInputRef}   type="file" accept=".mp4,.mov,.avi,.mkv,.webm"   className="hidden" onChange={handleUploadVideo}   />

      {/* ── Header ── */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex-1">

              {metadata.collectionId && (
                <Link href={`/collections/${metadata.collectionId}`} className="inline-flex items-center gap-2 mb-2 group">
                  <CollectionThumb collectionId={metadata.collectionId} />
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                    collectionType === 'Album'
                      ? 'bg-purple-600/90 border-purple-400/50 text-white'
                      : 'bg-indigo-600/90 border-indigo-400/50 text-white'
                  }`}>
                    {collectionType}
                  </span>
                  <span className="text-sm text-indigo-300 group-hover:text-indigo-200 transition-colors">{collectionName}</span>
                  <span className="text-indigo-400 text-xs">→</span>
                </Link>
              )}

              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-4xl font-bold text-gray-100">{metadata.title}</h1>
                {isSigned && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-green-500/20 border border-green-500/50 text-green-300">Signed</div>
                )}
                {!isSigned && hasSubmissions && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-yellow-500/20 border border-yellow-500/50 text-yellow-300">Submitted</div>
                )}
                {isReleased && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-600/30 border border-blue-500/50 text-blue-300">Released</div>
                )}
                {isSigned && displayLabel && (
                  <div className="px-3 py-1 rounded-md text-sm font-medium bg-gray-700/50 border border-gray-600 text-gray-300">{displayLabel}</div>
                )}
              </div>
              <p className="text-xl text-gray-300">{metadata.artist}</p>
            </div>
            <BackButton />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6 sticky top-24">

              {/* Artwork */}
              <div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden mb-6 relative group">
                {!sidebarArtworkError ? (
                  <>
                    <img
                      src={artworkUrl}
                      alt={`${metadata.title} artwork`}
                      className="w-full h-full object-cover"
                      onError={() => setSidebarArtworkError(true)}
                    />
                    {/* Hover overlay with delete/replace */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => artworkInputRef.current?.click()}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors"
                        title="Replace artwork"
                      >
                        Replace
                      </button>
                      <button
                        onClick={handleDeleteArtwork}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors"
                        title="Delete artwork"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <svg width="80" height="80" viewBox="0 0 120 120" className="opacity-30">
                      <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="1.5"/>
                      <circle cx="60" cy="60" r="40" fill="none" stroke="#4b5563" strokeWidth="0.8"/>
                      <circle cx="60" cy="60" r="25" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
                      <circle cx="60" cy="60" r="8"  fill="#000" stroke="#9ca3af" strokeWidth="1.5"/>
                    </svg>
                    <button
                      onClick={() => artworkInputRef.current?.click()}
                      disabled={uploadingFile === 'artwork'}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {uploadingFile === 'artwork' ? 'Uploading…' : '+ Upload Artwork'}
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 mb-6">
                {metadata.genre && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Genre</p>
                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-sm font-medium">
                      {metadata.genre}
                    </span>
                  </div>
                )}
                {(metadata.bpm || metadata.key) && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {metadata.bpm && (
                        <div>
                          <p className="text-xs text-purple-300 uppercase tracking-wider">BPM</p>
                          <p className="text-sm font-medium text-gray-200">{metadata.bpm}</p>
                        </div>
                      )}
                      {metadata.key && (
                        <div>
                          <p className="text-xs text-purple-300 uppercase tracking-wider">Key</p>
                          <p className="text-sm font-medium text-gray-200">{metadata.key}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Production Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {metadata.trackDate || metadata.releaseDate
                      ? new Date(metadata.trackDate || metadata.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Track ID</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{metadata.releaseId}</p>
                </div>
              </div>

              {/* ── Links ── */}
              <div className="pt-6 border-t border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-100">Links</h3>
                  <button onClick={() => setShowAddLink(true)} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    + Add
                  </button>
                </div>
                {(track.songLinks || []).length === 0 ? (
                  <p className="text-xs text-gray-500">No links yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {(track.songLinks || []).map((link, idx) => (
                      <div key={link.id || idx} className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 underline truncate flex-1"
                        >
                          {link.label || link.url}
                        </a>
                        {/* FIX: pass link.id — server filters by id, not array index */}
                        <button
                          onClick={() => link.id
                            ? handleDeleteLink(link.id)
                            : alert('This link was saved without an ID. Please delete and re-add it.')
                          }
                          className="text-red-400 hover:text-red-300 text-xs flex-shrink-0"
                          title="Remove link"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Files ── */}
              <div className="pt-6 border-t border-gray-700">
                <h3 className="font-semibold text-gray-100 mb-3">Files</h3>

                {/* Audio */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Audio:</span> {audioFiles.length}
                    </p>
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      disabled={uploadingFile === 'audio'}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                    >
                      {uploadingFile === 'audio' ? 'Uploading…' : '+ Add'}
                    </button>
                  </div>
                  {audioFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 ml-4">No audio files — click Add to upload</p>
                  ) : (
                    audioFiles.map((file, idx) => (
                      <div key={idx} className="text-xs text-gray-400 ml-4 mb-1 flex items-center gap-2">
                        <button
                          onClick={() => handleFileClick(file, 'audio')}
                          className="text-purple-400 hover:text-purple-300 underline transition-colors truncate"
                        >
                          {file.filename}
                        </button>
                        <span className="text-gray-500 flex-shrink-0">
                          ({Math.round(file.size / 1024 / 1024)}MB
                          {file.duration ? `, ${Math.floor(file.duration / 60)}:${String(Math.round(file.duration % 60)).padStart(2, '0')}` : ''})
                        </span>
                        <button
                          onClick={() => handleDeleteAudio(file.filename)}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                          title="Delete audio file"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Artwork */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Artwork:</span> {hasArtwork ? 1 : 0}
                    </p>
                    {!hasArtwork && (
                      <button
                        onClick={() => artworkInputRef.current?.click()}
                        disabled={uploadingFile === 'artwork'}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                      >
                        {uploadingFile === 'artwork' ? 'Uploading…' : '+ Add'}
                      </button>
                    )}
                  </div>
                  {hasArtwork ? (
                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-xs text-gray-400">artwork file</span>
                      <button
                        onClick={() => artworkInputRef.current?.click()}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        title="Replace artwork"
                      >
                        ↺ Replace
                      </button>
                      <button
                        onClick={handleDeleteArtwork}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Delete artwork"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 ml-4">No artwork — click Add to upload</p>
                  )}
                </div>

                {/* Video */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Video:</span> {videoFiles.length}
                    </p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingFile === 'video'}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                    >
                      {uploadingFile === 'video' ? 'Uploading…' : '+ Add'}
                    </button>
                  </div>
                  {videoFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 ml-4">No video files — click Add to upload</p>
                  ) : (
                    videoFiles.map((file, idx) => (
                      <div key={idx} className="text-xs text-gray-400 ml-4 mb-1 flex items-center gap-2">
                        <button
                          onClick={() => handleFileClick(file, 'video')}
                          className="text-purple-400 hover:text-purple-300 underline transition-colors truncate"
                        >
                          {file.filename}
                        </button>
                        <span className="text-gray-500 flex-shrink-0">
                          ({Math.round(file.size / 1024 / 1024)}MB)
                        </span>
                        <button
                          onClick={() => handleDeleteVideo(file.filename)}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                          title="Delete video file"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Label Deal shortcut */}
              {isSigned && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="font-semibold text-gray-100 mb-3">Label Deal</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Label</p>
                      <p className="text-sm font-medium text-gray-200">{signedLabel || 'Not set'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/releases/${trackId}/label-deal`}
                    className="block text-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-4 py-2 rounded-lg transition-all font-medium text-sm"
                  >
                    Label Deal Details →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Label Submissions */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Label Submissions</h2>
                <p className="text-sm text-gray-400 mt-1">Track where you have submitted this track to labels</p>
              </div>
              <div className="p-6">
                {metadata.distribution?.submit?.length > 0 ? (
                  <div className="space-y-3">
                    {metadata.distribution.submit.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-lg text-gray-100">{entry.label}</p>
                            <p className="text-sm text-gray-400 mt-1">via {entry.platform} • <span className="font-medium text-gray-300">{entry.status}</span></p>
                            {entry.notes && <p className="text-sm text-gray-500 mt-2 italic">&quot;{entry.notes}&quot;</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''}</span>
                            <button onClick={() => setEditingEntry({ ...entry, pathType: 'submit', index })} className="text-blue-400 hover:text-blue-300 text-sm p-1" title="Edit">✏️</button>
                            <button onClick={() => confirmDelete('submit', entry.timestamp, entry.label)} className="text-red-400 hover:text-red-300 text-sm p-1" title="Delete">🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No label submissions logged yet</p>
                )}
                <button onClick={() => setShowSubmissionModal(true)} className="mt-4 w-full bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">
                  + Log Label Submission
                </button>
                {!isSigned && metadata.distribution?.submit?.filter(s => s.status !== 'signed').length > 0 && (
                  <button onClick={() => setShowLabelSigningModal(true)} className="mt-3 w-full bg-green-600 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">
                    Mark as Signed by Label
                  </button>
                )}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Platform Distribution</h2>
                <p className="text-sm text-gray-400 mt-1">Track where this track has been uploaded or released</p>
              </div>
              <div className="p-6">
                {metadata.distribution?.release?.length > 0 ? (
                  <div className="space-y-3">
                    {metadata.distribution.release.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-100">{entry.platform}</p>
                            <p className="text-sm text-gray-400 mt-1">Status: <span className="text-gray-300">{entry.status}</span></p>
                            {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 mt-1 inline-block">View on platform →</a>}
                            {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''}</span>
                            <button onClick={() => setEditingEntry({ ...entry, pathType: 'release', index })} className="text-blue-400 hover:text-blue-300 text-sm p-1" title="Edit">✏️</button>
                            <button onClick={() => confirmDelete('release', entry.timestamp, entry.platform)} className="text-red-400 hover:text-red-300 text-sm p-1" title="Delete">🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform uploads logged yet</p>
                )}
                <button onClick={() => setShowPlatformModal(true)} className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium">
                  + Add Platform
                </button>
              </div>
            </div>

            {/* Marketing */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Marketing Content</h2>
                <p className="text-sm text-gray-400 mt-1">Social media captions and promotional materials</p>
              </div>
              <div className="p-6">
                {metadata.distribution?.promote?.length > 0 ? (
                  <div className="space-y-3">
                    {metadata.distribution.promote.map((entry, index) => (
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

            <TrackNotes
              releaseId={trackId}
              initialNotes={track.notes?.text || ''}
              initialDocuments={track.notes?.documents || []}
              onUpdate={loadTrack}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-lg transition-all font-medium text-sm"
              >
                ✏️ Edit Track
              </button>
              <button
                onClick={() => setShowDeleteTrackModal(true)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium text-sm"
              >
                🗑️ Delete Track Permanently
              </button>
            </div>

          </div>
        </div>
      </div>


      {/* ── Modals ── */}

      <Modal isOpen={showPlatformModal || editingEntry?.pathType === 'release'} onClose={() => { setShowPlatformModal(false); setEditingEntry(null) }} title={editingEntry?.pathType === 'release' ? 'Edit Platform' : 'Add Platform'}>
        <LogPlatformForm
          releaseId={trackId}
          onSuccess={() => { setShowPlatformModal(false); setEditingEntry(null); loadTrack() }}
          onCancel={() => { setShowPlatformModal(false); setEditingEntry(null) }}
          editMode={editingEntry?.pathType === 'release'}
          existingEntry={editingEntry}
        />
      </Modal>

      <Modal isOpen={showSubmissionModal || editingEntry?.pathType === 'submit'} onClose={() => { setShowSubmissionModal(false); setEditingEntry(null) }} title={editingEntry?.pathType === 'submit' ? 'Edit Label Submission' : 'Log Label Submission'}>
        <LogSubmissionForm
          releaseId={trackId}
          onSuccess={() => { setShowSubmissionModal(false); setEditingEntry(null); loadTrack() }}
          onCancel={() => { setShowSubmissionModal(false); setEditingEntry(null) }}
          editMode={editingEntry?.pathType === 'submit'}
          existingEntry={editingEntry}
        />
      </Modal>

      <Modal isOpen={showLabelSigningModal} onClose={() => setShowLabelSigningModal(false)} title="Mark Track as Signed">
        <div className="p-4">
          <p className="text-gray-300 mb-4">Select which label signed this track:</p>
          {metadata.distribution?.submit?.length > 0 ? (
            <div className="space-y-2">
              {metadata.distribution.submit.map((submission, index) => (
                <button key={index} onClick={() => handleMarkAsSigned(submission.label)} disabled={submitting}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50">
                  <p className="font-medium text-gray-100">{submission.label}</p>
                  <p className="text-sm text-gray-400">Submitted via {submission.platform}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">No submissions found. Add a submission first.</p>
          )}
          <button onClick={() => setShowLabelSigningModal(false)} className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-all">
            Cancel
          </button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Entry?">
        <div className="p-4">
          <p className="text-gray-300 mb-4">Are you sure you want to delete this entry?</p>
          {entryToDelete && (
            <p className="text-gray-400 text-sm mb-6 bg-gray-800 p-3 rounded">
              <strong className="text-gray-200">{entryToDelete.label}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => handleDeleteEntry(entryToDelete.pathType, entryToDelete.timestamp)} className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all font-medium">Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium">Cancel</button>
          </div>
        </div>
      </Modal>

      <DownloadModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} file={fileToDownload} releaseId={trackId} fileType={downloadFileType} />

      <DeleteTrackModal isOpen={showDeleteTrackModal} onClose={() => setShowDeleteTrackModal(false)} onConfirm={handleDeleteTrack} trackTitle={metadata.title} trackArtist={metadata.artist} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Track Metadata">
        <EditMetadataModal
          track={track}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); loadTrack() }}
        />
      </Modal>

      {/* Add Link Modal */}
      <Modal isOpen={showAddLink} onClose={() => setShowAddLink(false)} title="Add Link">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Label <span className="text-gray-500">(e.g. Spotify, SoundCloud)</span></label>
            <input
              type="text"
              value={newLinkLabel}
              onChange={e => setNewLinkLabel(e.target.value)}
              placeholder="Spotify"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">URL <span className="text-red-400">*</span></label>
            <input
              type="url"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddLink} disabled={!newLinkUrl}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-all font-medium">
              Add Link
            </button>
            <button onClick={() => setShowAddLink(false)}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
