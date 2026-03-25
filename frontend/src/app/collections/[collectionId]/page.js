'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import LogSubmissionForm from '@/components/LogSubmissionForm'
import TrackNotes from '@/components/TrackNotes'
import EditMetadataModal from '@/components/EditMetadataModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import { apiFetch, API_BASE_URL } from '@/lib/api'

const BADGE_STYLES = {
  EP:    'bg-indigo-600/90 border-indigo-400/50 text-white',
  Album: 'bg-purple-600/90 border-purple-400/50 text-white',
}

function TrackThumb({ releaseId }) {
  const [error, setError] = useState(false)
  if (error) return (
    <div className="w-10 h-10 rounded bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0">
      <svg width="24" height="24" viewBox="0 0 120 120" className="opacity-30">
        <circle cx="60" cy="60" r="55" fill="#2a2a2a" stroke="#6b7280" strokeWidth="2"/>
        <circle cx="60" cy="60" r="25" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="2"/>
        <circle cx="60" cy="60" r="8" fill="#000" stroke="#9ca3af" strokeWidth="2"/>
      </svg>
    </div>
  )
  return (
    <img
      src={`${API_BASE_URL}/releases/${releaseId}/artwork/?t=${Date.now()}`}
      alt=""
      className="w-10 h-10 rounded object-cover border border-gray-600 flex-shrink-0"
      onError={() => setError(true)}
    />
  )
}

export default function CollectionDetailPage({ params }) {
  const { collectionId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [collection, setCollection] = useState(null)
  const [tracks, setTracks]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [artworkError, setArtworkError] = useState(false)

  // Distribution modals
  const [showPlatformModal, setShowPlatformModal]       = useState(false)
  const [showSubmissionModal, setShowSubmissionModal]   = useState(false)
  const [showLabelSigningModal, setShowLabelSigningModal] = useState(false)
  const [signingDate, setSigningDate] = useState(new Date().toISOString().split('T')[0])
  const [editingEntry, setEditingEntry]                 = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm]       = useState(false)
  const [entryToDelete, setEntryToDelete]               = useState(null)
  const [submitting, setSubmitting]                     = useState(false)

  // Promo deals
  const todayStr = new Date().toISOString().split('T')[0]
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [promoForm, setPromoForm] = useState({
    promoName: '',
    status: 'Not Started',
    scheduledDate: todayStr,
    liveDate: todayStr,
    notes: ''
  })
  const [editingPromo, setEditingPromo] = useState(null)

  // Platform form state
  const [pPlatform, setPPlatform] = useState('')
  const [pStatus, setPStatus]     = useState('Uploaded')
  const [pUrl, setPUrl]           = useState('')
  const [pNotes, setPNotes]       = useState('')
  const [pReleaseDate, setPReleaseDate] = useState(new Date().toISOString().split('T')[0])

  // Links
  const [showAddLink, setShowAddLink]   = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl]     = useState('')

  // Edit collection
  const [showEditModal, setShowEditModal]   = useState(false)
  const [editTitle, setEditTitle]           = useState('')
  const [editArtist, setEditArtist]         = useState('')
  const [editGenre, setEditGenre]           = useState('')
  const [editSaving, setEditSaving]         = useState(false)
  const [editError, setEditError]           = useState('')
  const [artworkAction, setArtworkAction]   = useState('keep')
  const [newArtworkFile, setNewArtworkFile] = useState(null)
  const [newArtworkPreview, setNewArtworkPreview] = useState(null)
  const [collectionHasArtwork, setCollectionHasArtwork] = useState(false)

  // Delete collection
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting]           = useState(false)
  const artworkInputRef  = useRef(null)
  const [uploadingArtwork, setUploadingArtwork] = useState(false)

  const genres = ['Ambient', 'Deep House', 'House', 'Indie Dance', 'Melodic House and Techno', 'Progressive House', 'Tech House', 'Techno', 'Trance', 'Other']
  const platformOptions  = ['Beatport', 'Spotify', 'SoundCloud', 'Bandcamp', 'Apple Music', 'YouTube', 'DistroKid', 'Other']
  const platformStatuses = ['Uploaded', 'Live', 'Scheduled', 'Removed']
  const inputClass = "w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"

  async function loadCollection() {
    try {
      const [colRes, tracksRes] = await Promise.all([
        apiFetch(`/collections/${collectionId}`),
        apiFetch(`/collections/${collectionId}/tracks`)
      ])
      if (!colRes.ok) throw new Error(`Collection not found (${colRes.status})`)
      const colData    = await colRes.json()
      setCollection(colData.collection || colData)
      if (tracksRes.ok) {
        const trackData = await tracksRes.json()
        setTracks(trackData.tracks || [])
      }
    } catch (err) {
      console.error('Error loading collection:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (session?.token) loadCollection() }, [collectionId, session])

  // Check artwork exists
  useEffect(() => {
    if (!collectionId) return
    const img = new Image()
    img.onload  = () => { setCollectionHasArtwork(true); setArtworkError(false) }
    img.onerror = () => { setCollectionHasArtwork(false); setArtworkError(true) }
    img.src = `${API_BASE_URL}/collections/${collectionId}/artwork?t=${Date.now()}`
  }, [collectionId])

  // Pre-fill edit form
  useEffect(() => {
    if (showEditModal && collection) {
      setEditTitle(collection.title || '')
      setEditArtist(collection.artist || '')
      setEditGenre(collection.genre || '')
      setEditError('')
      setArtworkAction('keep')
      setNewArtworkFile(null)
      setNewArtworkPreview(null)
    }
  }, [showEditModal])

  // Pre-fill edit entry form
  useEffect(() => {
    if (!editingEntry) return
    if (editingEntry.pathType === 'release') {
      setPPlatform(editingEntry.platform || '')
      setPStatus(editingEntry.status || 'Uploaded')
      setPUrl(editingEntry.url || '')
      setPNotes(editingEntry.notes || '')
      setPReleaseDate(editingEntry.releaseDate || new Date().toISOString().split('T')[0])
    }
  }, [editingEntry])

  // Reset platform form when modal closes
  useEffect(() => {
    if (!showPlatformModal && !editingEntry) {
      setPPlatform(''); setPStatus('Uploaded'); setPUrl(''); setPNotes(''); setPReleaseDate(new Date().toISOString().split('T')[0])
    }
  }, [showPlatformModal])

  const handlePlatformSubmit = async () => {
    if (!pPlatform) return
    setSubmitting(true)
    try {
      if (editingEntry?.pathType === 'release') {
        const editPayload = { platform: pPlatform, status: pStatus, url: pUrl, notes: pNotes }
        if ((pStatus === 'Live' || pStatus === 'Scheduled') && pReleaseDate) {
          editPayload.releaseDate = pReleaseDate
        }
        await apiFetch(`/collections/${collectionId}/distribution/release/${editingEntry.timestamp}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editPayload)
        })
        setEditingEntry(null)
      } else {
        const releaseEntry = { platform: pPlatform, status: pStatus, ...(pUrl && { url: pUrl }), ...(pNotes && { notes: pNotes }) }
        if ((pStatus === 'Live' || pStatus === 'Scheduled') && pReleaseDate) {
          releaseEntry.releaseDate = pReleaseDate
        }
        await apiFetch(`/collections/${collectionId}/distribution`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'release', entry: releaseEntry })
        })
        setShowPlatformModal(false)
      }
      await loadCollection()
      setPPlatform(''); setPStatus('Uploaded'); setPUrl(''); setPNotes(''); setPReleaseDate(new Date().toISOString().split('T')[0])
    } catch (err) {
      alert(`Failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsSigned = async (labelName, submissionId) => {
    try {
      const response = await apiFetch(`/collections/${collectionId}/sign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelName, signedDate: signingDate })
      })
      const data = await response.json()
      if (!response.ok) { alert(`Failed to mark as signed: ${data.error || 'Unknown error'}`); return }

      // Also update the distribution entry status to "Signed" using the entry UUID.
      if (submissionId) {
        const entRes = await apiFetch(
          `/collections/${collectionId}/label/${submissionId}`,
          { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Signed', signedDate: signingDate }) }
        )
        if (!entRes.ok) {
          const d = await entRes.json().catch(() => ({}))
          console.error('Failed to update entry status:', d.error)
        }
      }

      await loadCollection()
      setShowLabelSigningModal(false)
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return
    try {
      await apiFetch(`/collections/${collectionId}/distribution/${entryToDelete.pathType}/${entryToDelete.timestamp}`, {
        method: 'DELETE'
      })
      await loadCollection()
      setShowDeleteConfirm(false)
      setEntryToDelete(null)
    } catch (err) {
      alert(`Failed: ${err.message}`)
    }
  }

  const confirmDelete = (pathType, timestamp, label) => {
    setEntryToDelete({ pathType, timestamp, label })
    setShowDeleteConfirm(true)
  }

  const handleAddLink = async () => {
    if (!newLinkUrl) return
    try {
      const res = await apiFetch(`/collections/${collectionId}/song-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLinkLabel || newLinkUrl, url: newLinkUrl })
      })
      if (!res.ok) throw new Error('Failed to add link')
      setNewLinkLabel(''); setNewLinkUrl(''); setShowAddLink(false)
      await loadCollection()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDeleteLink = async (linkId) => {
    try {
      const res = await apiFetch(`/collections/${collectionId}/song-links/${linkId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete link')
      await loadCollection()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleEditSave = async () => {
    if (!editTitle) return setEditError('Title is required')
    setEditSaving(true)
    setEditError('')
    try {
      const res = await apiFetch(`/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, artist: editArtist, genre: editGenre })
      })
      if (!res.ok) throw new Error('Failed to save')

      if (artworkAction === 'replace' && newArtworkFile) {
        const fd = new FormData()
        fd.append('artwork', newArtworkFile)
        await apiFetch(`/collections/${collectionId}/artwork`, { method: 'POST', body: fd })
        setCollectionHasArtwork(true); setArtworkError(false)
      } else if (artworkAction === 'delete') {
        await apiFetch(`/collections/${collectionId}/artwork`, { method: 'DELETE' })
        setCollectionHasArtwork(false); setArtworkError(true)
      }
      await loadCollection()
      setShowEditModal(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteCollection = async () => {
    setIsDeleting(true)
    try {
      await apiFetch(`/collections/${collectionId}`, { method: 'DELETE' })
      router.push('/')
    } catch (err) {
      alert(`Failed: ${err.message}`)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleArtworkSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewArtworkFile(file)
    setNewArtworkPreview(URL.createObjectURL(file))
    setArtworkAction('replace')
  }
  const handleQuickArtworkUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingArtwork(true)
    try {
      const fd = new FormData()
      fd.append('artwork', file)
      const res = await apiFetch(`/collections/${collectionId}/artwork`, {
        method: 'POST', body: fd
      })
      if (!res.ok) throw new Error('Upload failed')
      setCollectionHasArtwork(true)
      setArtworkError(false)
      await loadCollection()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUploadingArtwork(false)
      e.target.value = ''
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-300">Loading collection...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📂</div>
          <h2 className="text-xl font-semibold text-white mb-2">Collection not found</h2>
          <p className="text-gray-400 mb-6">This collection may have been deleted or the link is incorrect.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
            ← Back to Catalogue
          </Link>
        </div>
      </div>
    )
  }

  const badgeStyle       = BADGE_STYLES[collection.collectionType] || BADGE_STYLES['EP']
  const artworkUrl       = `${API_BASE_URL}/collections/${collectionId}/artwork?t=${Date.now()}`
  const dist             = collection.distribution || {}
  const signedSubmission = dist.submit?.find(s => s.status?.toLowerCase() === 'signed')
  const isSigned         = !!signedSubmission
  const signedLabel      = signedSubmission?.label || collection.signedLabel || null
  const hasPromoDeals    = dist.promote?.length > 0
  const isSubmittedOnly  = !isSigned && dist.submit?.some(s => s.status?.toLowerCase() === 'submitted')
  const isReleased       = dist.release?.some(s => s.status?.toLowerCase() === 'live')
  const isPromoted       = dist.promote?.some(s => s.status?.toLowerCase() === 'live')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      {/* ── Header ── */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badgeStyle}`}>
                  {collection.collectionType}
                </span>
                <h1 className="text-4xl font-bold text-gray-100">{collection.title}</h1>
                {isSigned && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-green-500/20 border border-green-500/50 text-green-300">Signed</div>
                )}
                {isSubmittedOnly && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-yellow-500/20 border border-yellow-400/60 text-yellow-200">Submitted</div>
                )}
                {isReleased && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-orange-500/20 border border-orange-400/60 text-orange-200">Released</div>
                )}
                {isPromoted && (
                  <div className="px-3 py-1 rounded-md text-sm font-semibold bg-pink-500/20 border border-pink-400/60 text-pink-200">Promoted</div>
                )}
              </div>
              <p className="text-xl text-gray-300">{collection.artist}</p>
              {isSigned && signedLabel && (
                <p className="text-sm text-slate-400 mt-1">{signedLabel}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">

              {/* Artwork */}
{/* Hidden input for quick upload */}
<input
  ref={artworkInputRef}
  type="file"
  accept=".jpg,.jpeg,.png,.webp"
  className="hidden"
  onChange={handleQuickArtworkUpload}
/>

<div className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden mb-6 relative group">
  {!artworkError ? (
    <>
      <img
        src={artworkUrl}
        alt={collection.title}
        className="w-full h-full object-cover"
        onError={() => setArtworkError(true)}
      />
      {/* Hover overlay — replace or delete */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button
          onClick={() => artworkInputRef.current?.click()}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Replace
        </button>
        <button
          onClick={async () => {
            if (!confirm('Delete artwork? This cannot be undone.')) return
            await apiFetch(`/collections/${collectionId}/artwork`, { method: 'DELETE' })
            setCollectionHasArtwork(false)
            setArtworkError(true)
          }}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <svg width="80" height="80" viewBox="0 0 120 120" className="opacity-30">
        <circle cx="60" cy="60" r="55" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
        <circle cx="60" cy="60" r="40" fill="none" stroke="#4338ca" strokeWidth="0.8"/>
        <circle cx="60" cy="60" r="10" fill="#0f0e2a" stroke="#6366f1" strokeWidth="2"/>
      </svg>
      <button
        onClick={() => artworkInputRef.current?.click()}
        disabled={uploadingArtwork}
        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      >
        {uploadingArtwork ? 'Uploading…' : '+ Upload Artwork'}
      </button>
    </div>
  )}
</div>


              {/* Collection Metadata */}
              <div className="space-y-3 mb-6">
                {collection.genre && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Genre</p>
                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-sm font-medium">
                      {collection.genre}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Tracks</p>
                  <p className="text-sm font-medium text-gray-200">{tracks.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Collection ID</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{collectionId}</p>
                </div>
              </div>

              {/* ── Links ── */}
              <div className="pt-6 border-t border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-100">Links</h3>
                  <button onClick={() => setShowAddLink(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    + Add
                  </button>
                </div>
                {(collection.songLinks || []).length === 0 ? (
                  <p className="text-xs text-gray-500">No links yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {(collection.songLinks || []).map((link, idx) => (
                      <div key={link.id || idx} className="flex items-center gap-2">
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 underline truncate flex-1">
                          {link.label || link.url}
                        </a>
                        <button onClick={() => handleDeleteLink(link.id || idx)}
                          className="text-red-400 hover:text-red-300 text-xs flex-shrink-0" title="Remove link">
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Track List ── */}
              <div className="pt-6 border-t border-gray-700">
                <h3 className="font-semibold text-gray-100 mb-3">Tracks</h3>
                {tracks.length === 0 ? (
                  <p className="text-xs text-gray-500">No tracks yet</p>
                ) : (
                  <div className="space-y-2">
                    {tracks.map((track, idx) => (
                      <Link key={track.releaseId || idx} href={`/releases/${track.releaseId}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/40 transition-colors group">
                        <span className="text-xs text-gray-600 w-4 text-right flex-shrink-0">{idx + 1}</span>
                        <TrackThumb releaseId={track.releaseId} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                            {track.title}
                          </p>
                          {track.artist && (
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          )}
                        </div>
                        <span className="text-gray-600 text-xs group-hover:text-purple-400 transition-colors">→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Label Submissions */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Label Submissions</h2>
                <p className="text-sm text-gray-400 mt-1">Track where you have submitted this {collection.collectionType} to labels</p>
              </div>
              <div className="p-6">
                {dist.submit?.length > 0 ? (
                  <div className="space-y-3">
                    {dist.submit.map((entry, index) => (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (entry.id) {
                            router.push(`/collections/${collectionId}/label/${entry.id}`)
                          } else {
                            alert('This entry was created before per-entry pages were added. Please delete and re-log it.')
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (entry.id) {
                              router.push(`/collections/${collectionId}/label/${entry.id}`)
                            } else {
                              alert('This entry was created before per-entry pages were added. Please delete and re-log it.')
                            }
                          }
                        }}
                        className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-purple-500 cursor-pointer hover:bg-gray-900/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-lg text-gray-100">{entry.label}</p>
                          <p className="text-sm text-gray-400 mt-1">via {entry.platform} • <span className="font-medium text-gray-300">{entry.status}</span></p>
                          {entry.status === 'Signed' && entry.signedDate && (
                            <p className="text-xs text-green-400 mt-1">
                              Signed on {new Date(entry.signedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                          {entry.status === 'Submitted' && entry.followUpDate && (
                            <p className={`text-xs mt-1 ${new Date(entry.followUpDate + 'T23:59:59') < new Date() ? 'text-red-400' : 'text-purple-400'}`}>
                              📅 Follow-up: {new Date(entry.followUpDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {new Date(entry.followUpDate + 'T23:59:59') < new Date() ? ' · Overdue' : ''}
                            </p>
                          )}
                          {entry.notes && <p className="text-sm text-gray-500 mt-2 italic">&quot;{entry.notes}&quot;</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                          {!entry.id ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmDelete('submit', entry.timestamp, entry.label) }}
                              className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded text-xs font-medium"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-xl text-gray-400">›</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No label submissions logged yet</p>
                )}
                <button onClick={() => setShowSubmissionModal(true)}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">
                  + Log Label Submission
                </button>
                {!isSigned && dist.submit?.filter(s => s.status?.toLowerCase() !== 'signed').length > 0 && (
                  <button onClick={() => setShowLabelSigningModal(true)}
                    className="mt-3 w-full bg-green-600 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/50 text-white px-4 py-2 rounded-lg transition-all font-medium">
                    Mark as Signed by Label
                  </button>
                )}
              </div>
            </div>

            {/* Promo Deals */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Promo Deals</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Track promotional campaigns and deals for this collection
                </p>
              </div>
              <div className="p-6">
                {dist.promote?.length > 0 ? (
                  <div className="space-y-3">
                    {dist.promote.map((entry, index) => (
                      <div
                        key={entry.timestamp || index}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (entry.id) {
                            router.push(`/collections/${collectionId}/promo/${entry.id}`)
                          } else {
                            alert('This entry was created before per-entry pages were added. Please delete and re-log it.')
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (entry.id) {
                              router.push(`/collections/${collectionId}/promo/${entry.id}`)
                            } else {
                              alert('This entry was created before per-entry pages were added. Please delete and re-log it.')
                            }
                          }
                        }}
                        className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-pink-500 cursor-pointer hover:bg-gray-900/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-lg text-gray-100">
                            {entry.promoName || entry.platform || 'Promo Deal'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Status:{' '}
                            <span className="font-medium text-gray-300">
                              {entry.status || 'Not Started'}
                            </span>
                          </p>
                          {entry.scheduledDate && (
                            <p className="text-xs text-gray-400 mt-1">
                              Scheduled:{' '}
                              {new Date(entry.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                          {entry.liveDate && (
                            <p className="text-xs text-green-400 mt-1">
                              Live:{' '}
                              {new Date(entry.liveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {entry.timestamp
                              ? new Date(entry.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : ''}
                          </span>
                          {!entry.id ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmDelete('promote', entry.timestamp, entry.promoName || entry.platform || 'Promo Deal') }}
                              className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded text-xs font-medium"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-xl text-gray-400">›</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No promo deals logged yet
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-gray-700">
                  {showPromoForm ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const name = promoForm.promoName.trim()
                        if (!name) {
                          alert('Promo name is required.')
                          return
                        }

                        const basePayload = {
                          promoName: name,
                          status: promoForm.status,
                          notes: promoForm.notes?.trim() || ''
                        }

                        if (promoForm.status === 'Scheduled' && promoForm.scheduledDate) {
                          basePayload.scheduledDate = promoForm.scheduledDate
                        }
                        if (promoForm.status === 'Live' && promoForm.liveDate) {
                          basePayload.liveDate = promoForm.liveDate
                        }

                        try {
                          if (editingPromo && editingPromo.timestamp) {
                            const updatedData = {
                              ...editingPromo,
                              ...basePayload
                            }
                            const res = await apiFetch(
                              `/collections/${collectionId}/distribution/promote/${editingPromo.timestamp}`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedData)
                              }
                            )
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              throw new Error(data.error || 'Failed to update promo deal')
                            }
                          } else {
                            const entry = {
                              ...basePayload,
                              timestamp: new Date().toISOString()
                            }
                            const res = await apiFetch(
                              `/collections/${collectionId}/distribution`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: 'promote', entry })
                              }
                            )
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              throw new Error(data.error || 'Failed to add promo deal')
                            }
                          }
                          await loadCollection()
                          setShowPromoForm(false)
                          setEditingPromo(null)
                          setPromoForm({
                            promoName: '',
                            status: 'Not Started',
                            scheduledDate: new Date().toISOString().split('T')[0],
                            liveDate: new Date().toISOString().split('T')[0],
                            notes: ''
                          })
                        } catch (err) {
                          alert(`Failed to save promo deal: ${err.message}`)
                        }
                      }}
                      className="space-y-4 bg-gray-900/60 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-semibold text-gray-100">
                          {editingPromo ? 'Edit Promo Deal' : 'Add Promo Deal'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPromoForm(false)
                            setEditingPromo(null)
                            setPromoForm({
                              promoName: '',
                              status: 'Not Started',
                              scheduledDate: new Date().toISOString().split('T')[0],
                              liveDate: new Date().toISOString().split('T')[0],
                              notes: ''
                            })
                          }}
                          className="text-xs text-gray-400 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Promo name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={promoForm.promoName}
                          onChange={e =>
                            setPromoForm(prev => ({ ...prev, promoName: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="Deep House Sessions"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={promoForm.status}
                          onChange={e =>
                            setPromoForm(prev => ({
                              ...prev,
                              status: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
                        >
                          <option>Not Started</option>
                          <option>Scheduled</option>
                          <option>Live</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>
                      </div>

                      {promoForm.status === 'Scheduled' && (
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Scheduled date
                          </label>
                          <input
                            type="date"
                            value={promoForm.scheduledDate}
                            onChange={e =>
                              setPromoForm(prev => ({
                                ...prev,
                                scheduledDate: e.target.value
                              }))
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      )}

                      {promoForm.status === 'Live' && (
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">
                            Live date
                          </label>
                          <input
                            type="date"
                            value={promoForm.liveDate}
                            onChange={e =>
                              setPromoForm(prev => ({
                                ...prev,
                                liveDate: e.target.value
                              }))
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-300 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={promoForm.notes}
                          onChange={e =>
                            setPromoForm(prev => ({ ...prev, notes: e.target.value }))
                          }
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="Optional notes about this promo deal"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
                      >
                        {editingPromo ? 'Save Changes' : 'Add Promo Deal'}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPromo(null)
                        setPromoForm({
                          promoName: '',
                          status: 'Not Started',
                          scheduledDate: new Date().toISOString().split('T')[0],
                          liveDate: new Date().toISOString().split('T')[0],
                          notes: ''
                        })
                        setShowPromoForm(true)
                      }}
                      className="w-full bg-pink-600 hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/40 text-white px-4 py-2 rounded-lg transition-all font-medium"
                    >
                      + Add Promo Deal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Platform Distribution</h2>
                <p className="text-sm text-gray-400 mt-1">Track where this {collection.collectionType} has been uploaded or released</p>
              </div>
              <div className="p-6">
                {dist.release?.length > 0 ? (
                  <div className="space-y-3">
                    {dist.release.map((entry, index) => (
                      <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-100">{entry.platform}</p>
                            <p className="text-sm text-gray-400 mt-1">Status: <span className="text-gray-300">{entry.status}</span></p>
                            {entry.status?.toLowerCase() === 'live' && entry.releaseDate && (
                              <p className="text-xs text-green-400 mt-1">Released on {new Date(entry.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            )}
                            {entry.status?.toLowerCase() === 'scheduled' && entry.releaseDate && (
                              <p className="text-xs text-yellow-400 mt-1">To be released on {new Date(entry.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            )}
                            {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-purple-400 hover:text-purple-300 mt-1 inline-block">View on platform →</a>}
                            {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                            <button onClick={() => setEditingEntry({ ...entry, pathType: 'release', index })}
                              className="text-blue-400 hover:text-blue-300 text-sm p-1" title="Edit">✏️</button>
                            <button onClick={() => confirmDelete('release', entry.timestamp, entry.platform)}
                              className="text-red-400 hover:text-red-300 text-sm p-1" title="Delete">🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No platform uploads logged yet</p>
                )}
                <button onClick={() => setShowPlatformModal(true)}
                  className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium">
                  + Add Platform
                </button>
              </div>
            </div>

            {/* Notes */}
            <TrackNotes
              releaseId={collectionId}
              baseUrl={`${API_BASE_URL}/collections/${collectionId}`}
              initialNotes={collection.notes?.text || ''}
              initialDocuments={collection.notes?.documents || []}
              onUpdate={loadCollection}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-lg transition-all font-medium text-sm">
                ✏️ Edit Collection
              </button>
              <button onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium text-sm">
                🗑️ Delete Collection
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Add Platform Modal */}
      <Modal
        isOpen={showPlatformModal || editingEntry?.pathType === 'release'}
        onClose={() => { setShowPlatformModal(false); setEditingEntry(null) }}
        title={editingEntry?.pathType === 'release' ? 'Edit Platform' : 'Add Platform'}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Platform <span className="text-red-400">*</span></label>
            <select value={pPlatform} onChange={e => setPPlatform(e.target.value)} className={inputClass}>
              <option value="">Select platform...</option>
              {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select value={pStatus} onChange={e => setPStatus(e.target.value)} className={inputClass}>
              {platformStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(pStatus === 'Live' || pStatus === 'Scheduled') && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Release Date</label>
              <input type="date" value={pReleaseDate} onChange={e => setPReleaseDate(e.target.value)} className={inputClass} />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-300 mb-1">URL <span className="text-gray-500">(Optional)</span></label>
            <input type="url" value={pUrl} onChange={e => setPUrl(e.target.value)} placeholder="https://" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes <span className="text-gray-500">(Optional)</span></label>
            <input type="text" value={pNotes} onChange={e => setPNotes(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handlePlatformSubmit} disabled={!pPlatform || submitting}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-all font-medium">
              {submitting ? 'Saving...' : editingEntry?.pathType === 'release' ? 'Save Changes' : 'Add Platform'}
            </button>
            <button onClick={() => { setShowPlatformModal(false); setEditingEntry(null) }}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Log Submission Modal */}
      <Modal
        isOpen={showSubmissionModal || editingEntry?.pathType === 'submit'}
        onClose={() => { setShowSubmissionModal(false); setEditingEntry(null) }}
        title={editingEntry?.pathType === 'submit' ? 'Edit Label Submission' : 'Log Label Submission'}
      >
        <LogSubmissionForm
          releaseId={collectionId}
          onSuccess={() => { setShowSubmissionModal(false); setEditingEntry(null); loadCollection() }}
          onCancel={() => { setShowSubmissionModal(false); setEditingEntry(null) }}
          editMode={editingEntry?.pathType === 'submit'}
          existingEntry={editingEntry}
          onSubmit={async (formData) => {
            if (editingEntry?.pathType === 'submit') {
              const res = await apiFetch(`/collections/${collectionId}/distribution/submit/${editingEntry.timestamp}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              })
              if (!res.ok) throw new Error('Failed to save')
            } else {
              const entry = { ...formData, timestamp: new Date().toISOString() }
              if (!entry.notes) delete entry.notes
              const res = await apiFetch(`/collections/${collectionId}/distribution`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: 'submit', entry })
              })
              if (!res.ok) throw new Error('Failed to save')
            }
          }}
        />
      </Modal>

      {/* Mark as Signed Modal */}
      <Modal isOpen={showLabelSigningModal} onClose={() => setShowLabelSigningModal(false)} title="Mark as Signed">
        <div className="p-4">
          <p className="text-gray-300 mb-4">Select which label signed this {collection.collectionType}:</p>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Signature Date</label>
            <input
              type="date"
              value={signingDate}
              onChange={e => setSigningDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            {dist.submit?.map((submission, index) => (
              <button key={index} onClick={() => handleMarkAsSigned(submission.label, submission.id)}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <p className="font-medium text-gray-100">{submission.label}</p>
                <p className="text-sm text-gray-400">Submitted via {submission.platform}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setShowLabelSigningModal(false)}
            className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-all">
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Entry Confirm */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Entry?">
        <div className="p-4">
          <p className="text-gray-300 mb-4">Are you sure you want to delete this entry?</p>
          {entryToDelete && (
            <p className="text-gray-400 text-sm mb-6 bg-gray-800 p-3 rounded">
              <strong className="text-gray-200">{entryToDelete.label}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={handleDeleteEntry}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-all font-medium">Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Add Link Modal */}
      <Modal isOpen={showAddLink} onClose={() => setShowAddLink(false)} title="Add Link">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Label <span className="text-gray-500">(e.g. Spotify, Beatport)</span></label>
            <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)}
              placeholder="Spotify" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">URL <span className="text-red-400">*</span></label>
            <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://" className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddLink} disabled={!newLinkUrl}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-all font-medium">
              Add Link
            </button>
            <button onClick={() => setShowAddLink(false)}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Collection">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title <span className="text-red-400">*</span></label>
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Artist</label>
            <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
            <select value={editGenre} onChange={e => setEditGenre(e.target.value)} className={inputClass}>
              <option value="">Choose Genre</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Artwork */}
          <div className="pt-2 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">Artwork</label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 border border-gray-600 flex-shrink-0 flex items-center justify-center">
                {artworkAction === 'replace' && newArtworkPreview ? (
                  <img src={newArtworkPreview} alt="" className="w-full h-full object-cover" />
                ) : artworkAction === 'delete' ? (
                  <span className="text-red-400 text-xs text-center px-1">Will be removed</span>
                ) : collectionHasArtwork ? (
                  <img src={`${API_BASE_URL}/collections/${collectionId}/artwork?t=${Date.now()}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 text-2xl">🖼</span>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleArtworkSelect} className="hidden" />
                  <span className="block w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg text-center transition-colors cursor-pointer">
                    {artworkAction === 'replace' ? '↻ Change Image' : collectionHasArtwork ? '↻ Replace Artwork' : '+ Upload Artwork'}
                  </span>
                </label>
                {artworkAction === 'replace' && (
                  <button type="button" onClick={() => { setArtworkAction('keep'); setNewArtworkFile(null); setNewArtworkPreview(null) }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 text-sm rounded-lg text-center transition-colors">
                    Cancel Change
                  </button>
                )}
                {collectionHasArtwork && artworkAction === 'keep' && (
                  <button type="button" onClick={() => setArtworkAction('delete')}
                    className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 text-sm rounded-lg text-center transition-colors">
                    🗑 Remove Artwork
                  </button>
                )}
                {artworkAction === 'delete' && (
                  <button type="button" onClick={() => setArtworkAction('keep')}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 text-sm rounded-lg text-center transition-colors">
                    Undo Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {editError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">{editError}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleEditSave} disabled={editSaving}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setShowEditModal(false)} disabled={editSaving}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all font-medium">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Collection Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection?"
        message={`This removes the collection only. The ${tracks.length} individual track${tracks.length !== 1 ? 's' : ''} will remain in your catalogue as standalone singles.`}
        itemName={collection.title}
      />

    </div>
  )
}
