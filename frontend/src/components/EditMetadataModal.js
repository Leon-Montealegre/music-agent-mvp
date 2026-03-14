'use client'
import { useState, useEffect } from 'react'


export default function EditMetadataModal({ track, onClose, onSuccess }) {
  const metadata = track.metadata || track

  const [artist, setArtist] = useState(metadata.artist || '')
  const [title, setTitle] = useState(metadata.title || '')
  const [genre, setGenre] = useState(metadata.genre || '')
  const [bpm, setBpm] = useState(metadata.bpm || '')
  const [key, setKey] = useState(metadata.key || '')
  const [trackDate, setTrackDate] = useState(metadata.trackDate || metadata.releaseDate || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Artwork state
  const [artworkExists, setArtworkExists] = useState(false)
  const [artworkAction, setArtworkAction] = useState('keep')  // 'keep' | 'replace' | 'delete'
  const [newArtworkFile, setNewArtworkFile] = useState(null)
  const [newArtworkPreview, setNewArtworkPreview] = useState(null)

  // Collection state
  const [collections, setCollections] = useState([])
  const [grouping, setGrouping] = useState('standalone')
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [newCollectionType, setNewCollectionType] = useState('EP')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionArtist, setNewCollectionArtist] = useState(metadata.artist || '')
  const [newCollectionArtwork, setNewCollectionArtwork] = useState(null)
  const [collectionArtworkPreview, setCollectionArtworkPreview] = useState(null)

  const currentCollectionId = metadata.collectionId || null

  const genres = ['Ambient', 'Deep House', 'House', 'Indie Dance', 'Melodic House and Techno', 'Progressive House', 'Tech House', 'Techno', 'Trance', 'Other']
  const keys = [
    'A minor', 'A major', 'A# minor', 'A# major',
    'B minor', 'B major', 'C minor', 'C major',
    'C# minor', 'C# major', 'D minor', 'D major',
    'D# minor', 'D# major', 'E minor', 'E major',
    'F minor', 'F major', 'F# minor', 'F# major',
    'G minor', 'G major', 'G# minor', 'G# major'
  ]

  // Check if track currently has artwork on mount
  useEffect(() => {
    const img = new Image()
    img.onload  = () => setArtworkExists(true)
    img.onerror = () => setArtworkExists(false)
    img.src = `http://localhost:3001/releases/${metadata.releaseId}/artwork/?t=${Date.now()}`
  }, [])

  // Load collections
  useEffect(() => {
    fetch('http://localhost:3001/collections')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => {})
  }, [])

  const handleNewArtworkSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewArtworkFile(file)
    setNewArtworkPreview(URL.createObjectURL(file))
    setArtworkAction('replace')
  }

  const handleCollectionArtworkSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewCollectionArtwork(file)
    setCollectionArtworkPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!artist || !title) return setError('Artist and Title are required')
    if (!genre) return setError('Genre is required')
    if (grouping === 'existing' && !selectedCollectionId) return setError('Please select a collection')
    if (grouping === 'new' && !newCollectionName) return setError('Please enter a name for the new EP/Album')

    setSaving(true)
    setError('')

    try {
      // Step 1: Save core track metadata
      const res = await fetch(`http://localhost:3001/releases/${metadata.releaseId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          title,
          genre,
          trackDate,
          releaseDate: trackDate,
          ...(bpm ? { bpm: parseInt(bpm) } : { bpm: null }),
          ...(key ? { key } : { key: null }),
        })
      })
      if (!res.ok) throw new Error('Failed to save track metadata')

      // Step 2: Handle track artwork changes
      if (artworkAction === 'replace' && newArtworkFile) {
        const fd = new FormData()
        fd.append('artwork', newArtworkFile)
        const artRes = await fetch(`http://localhost:3001/releases/${metadata.releaseId}/artwork`, {
          method: 'POST',
          body: fd
        })
        if (!artRes.ok) throw new Error('Failed to upload artwork')
      } else if (artworkAction === 'delete') {
        const delRes = await fetch(`http://localhost:3001/releases/${metadata.releaseId}/artwork`, {
          method: 'DELETE'
        })
        if (!delRes.ok) throw new Error('Failed to delete artwork')
      }

      // Step 3: Handle collection grouping
      if (grouping === 'new') {
        const createRes = await fetch('http://localhost:3001/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newCollectionName,
            artist: newCollectionArtist,
            collectionType: newCollectionType,
            genre,
            releaseDate: trackDate,
          })
        })
        if (!createRes.ok) throw new Error('Failed to create collection')
        const { collection } = await createRes.json()

        if (newCollectionArtwork) {
          const fd = new FormData()
          fd.append('artwork', newCollectionArtwork)
          await fetch(`http://localhost:3001/collections/${collection.releaseId}/artwork`, { method: 'POST', body: fd })
        }

        if (currentCollectionId) {
          await fetch(`http://localhost:3001/collections/${currentCollectionId}/tracks/${metadata.releaseId}`, { method: 'DELETE' })
        }

        await addTrackToCollection(collection.releaseId)
        await patchTrackCollectionId(collection.releaseId, newCollectionType)

      } else if (grouping === 'existing') {
        if (selectedCollectionId !== currentCollectionId) {
          if (currentCollectionId) {
            await fetch(`http://localhost:3001/collections/${currentCollectionId}/tracks/${metadata.releaseId}`, { method: 'DELETE' })
          }
          await addTrackToCollection(selectedCollectionId)
          const col = collections.find(c => c.releaseId === selectedCollectionId)
          await patchTrackCollectionId(selectedCollectionId, col?.collectionType || 'EP')
        }

      } else if (grouping === 'standalone') {
        if (currentCollectionId) {
          await fetch(`http://localhost:3001/collections/${currentCollectionId}/tracks/${metadata.releaseId}`, { method: 'DELETE' })
        }
        await patchTrackCollectionId(null, 'Single')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function addTrackToCollection(collectionId) {
    await fetch(`http://localhost:3001/collections/${collectionId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackReleaseId: metadata.releaseId, title: title || metadata.title })
    })
  }

  async function patchTrackCollectionId(collectionId, releaseFormat) {
    await fetch(`http://localhost:3001/releases/${metadata.releaseId}/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collectionId: collectionId || null,
        releaseFormat: collectionId ? releaseFormat : 'Single',
        releaseType: collectionId ? releaseFormat : 'Single',
      })
    })
  }

  const inputClass = "w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
  const radioBase = "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm"

  // What to show in the artwork thumbnail
  const artworkThumb = () => {
    if (artworkAction === 'replace' && newArtworkPreview) {
      return <img src={newArtworkPreview} alt="New artwork" className="w-20 h-20 rounded-lg object-cover border-2 border-purple-500 flex-shrink-0" />
    }
    if (artworkAction === 'delete') {
      return (
        <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-red-500/60 flex items-center justify-center text-red-400 text-xs text-center px-1 flex-shrink-0">
          Will be removed
        </div>
      )
    }
    if (artworkExists) {
      return <img src={`http://localhost:3001/releases/${metadata.releaseId}/artwork/`} alt="Current artwork" className="w-20 h-20 rounded-lg object-cover border border-gray-600 flex-shrink-0" />
    }
    return (
      <div className="w-20 h-20 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
        No artwork
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">

      {/* Artist */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Artist Name <span className="text-red-400">*</span></label>
        <input type="text" value={artist} onChange={e => setArtist(e.target.value)} className={inputClass} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Track Title <span className="text-red-400">*</span></label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
      </div>

      {/* Genre */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Genre <span className="text-red-400">*</span></label>
        <select value={genre} onChange={e => setGenre(e.target.value)} className={inputClass}>
          <option value="">Choose Genre</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>


      {/* BPM + Key */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">BPM <span className="text-gray-500">(Optional)</span></label>
          <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="e.g. 126" min="60" max="200" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Key <span className="text-gray-500">(Optional)</span></label>
          <select value={key} onChange={e => setKey(e.target.value)} className={inputClass}>
            <option value="">Select key...</option>
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* ── Artwork ── */}
      <div className="pt-2 border-t border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">Artwork</label>

        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          {artworkThumb()}

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-1">

            {/* Upload / Change */}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleNewArtworkSelect} className="hidden" />
              <span className="block w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg text-center transition-colors cursor-pointer">
                {artworkAction === 'replace' ? '↻ Change Image' : artworkExists ? '↻ Replace Artwork' : '+ Upload Artwork'}
              </span>
            </label>

            {/* Cancel pending change */}
            {artworkAction === 'replace' && (
              <button
                type="button"
                onClick={() => { setArtworkAction('keep'); setNewArtworkFile(null); setNewArtworkPreview(null) }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 text-sm rounded-lg text-center transition-colors"
              >
                Cancel Change
              </button>
            )}

            {/* Remove button — only show if artwork exists and not already being replaced/deleted */}
            {artworkExists && artworkAction === 'keep' && (
              <button
                type="button"
                onClick={() => setArtworkAction('delete')}
                className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 text-sm rounded-lg text-center transition-colors"
              >
                🗑 Remove Artwork
              </button>
            )}

            {/* Undo remove */}
            {artworkAction === 'delete' && (
              <button
                type="button"
                onClick={() => setArtworkAction('keep')}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-400 text-sm rounded-lg text-center transition-colors"
              >
                Undo Remove
              </button>
            )}

            {/* Status hint */}
            {artworkAction === 'replace' && newArtworkFile && (
              <p className="text-xs text-purple-400">New artwork will be saved when you click Save Changes</p>
            )}
            {artworkAction === 'delete' && (
              <p className="text-xs text-red-400">Artwork will be deleted when you click Save Changes</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Collection Grouping ── */}
      <div className="pt-2 border-t border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Collection
          {currentCollectionId && (
            <span className="ml-2 text-xs text-yellow-400 font-normal">
              Currently in: {collections.find(c => c.releaseId === currentCollectionId)?.title || currentCollectionId} — select below to change
            </span>
          )}
        </label>

        <div className="space-y-2">

          <label className={`${radioBase} ${grouping === 'standalone' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'}`}>
            <input type="radio" name="grouping" value="standalone" checked={grouping === 'standalone'} onChange={() => setGrouping('standalone')} className="accent-purple-500" />
            Standalone Single
          </label>

          <label className={`${radioBase} ${grouping === 'existing' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'}`}>
            <input type="radio" name="grouping" value="existing" checked={grouping === 'existing'} onChange={() => setGrouping('existing')} className="accent-purple-500" />
            Add to existing EP / Album
          </label>

          {grouping === 'existing' && (
            <div className="ml-6">
              {collections.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No collections yet — create one below</p>
              ) : (
                <select value={selectedCollectionId} onChange={e => setSelectedCollectionId(e.target.value)} className={inputClass}>
                  <option value="">Select a collection...</option>
                  {collections.map(c => (
                    <option key={c.releaseId} value={c.releaseId}>[{c.collectionType}] {c.title} — {c.artist}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <label className={`${radioBase} ${grouping === 'new' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'}`}>
            <input type="radio" name="grouping" value="new" checked={grouping === 'new'} onChange={() => setGrouping('new')} className="accent-purple-500" />
            Create new EP / Album
          </label>

          {grouping === 'new' && (
            <div className="ml-6 space-y-3 pt-1">

              <div className="flex gap-2">
                {['EP', 'Album'].map(type => (
                  <button key={type} type="button" onClick={() => setNewCollectionType(type)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      newCollectionType === type
                        ? type === 'EP' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                    }`}>
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">{newCollectionType} Name <span className="text-red-400">*</span></label>
                <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Artist</label>
                <input type="text" value={newCollectionArtist} onChange={e => setNewCollectionArtist(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Artwork <span className="text-gray-500 font-normal">(Optional)</span></label>
                <div className="flex items-center gap-3">
                  {collectionArtworkPreview ? (
                    <img src={collectionArtworkPreview} alt="Collection artwork preview" className="w-16 h-16 rounded-lg object-cover border border-gray-600 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-500 text-2xl flex-shrink-0">🖼</div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleCollectionArtworkSelect} className="hidden" />
                    <span className="block w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg text-center transition-colors cursor-pointer">
                      {collectionArtworkPreview ? 'Change Image' : '+ Choose Image'}
                    </span>
                  </label>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Track ID — read only */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Track ID (cannot be changed)</p>
        <p className="text-xs font-mono text-gray-400">{metadata.releaseId}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white py-3 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onClose} disabled={saving}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all font-medium">
          Cancel
        </button>
      </div>
    </div>
  )
}
