'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateTrackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [artist, setArtist]       = useState('')
  const [title, setTitle]         = useState('')
  const [genre, setGenre]         = useState('')
  const [trackDate, setTrackDate] = useState(new Date().toISOString().split('T')[0])
  const [bpm, setBpm]             = useState('')
  const [key, setKey]             = useState('')

  const [audioFile, setAudioFile]     = useState(null)
  const [artworkFile, setArtworkFile] = useState(null)
  const [videoFile, setVideoFile]     = useState(null)

  const [collections, setCollections]               = useState([])
  const [grouping, setGrouping]                     = useState('standalone')
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [newCollectionType, setNewCollectionType]   = useState('EP')
  const [newCollectionName, setNewCollectionName]   = useState('')
  const [newCollectionArtist, setNewCollectionArtist] = useState('')
  const [newCollectionArtwork, setNewCollectionArtwork] = useState(null)
  const [artworkPreview, setArtworkPreview]         = useState(null)

  const genres = ['Ambient', 'Deep House', 'House', 'Indie Dance', 'Melodic House and Techno', 'Progressive House', 'Tech House', 'Techno', 'Trance', 'Other']
  const keys = [
    'A minor', 'A major', 'A# minor', 'A# major',
    'B minor', 'B major', 'C minor', 'C major',
    'C# minor', 'C# major', 'D minor', 'D major',
    'D# minor', 'D# major', 'E minor', 'E major',
    'F minor', 'F major', 'F# minor', 'F# major',
    'G minor', 'G major', 'G# minor', 'G# major',
  ]

  useEffect(() => {
    async function loadDefaults() {
      try {
        const res = await fetch('http://localhost:3001/settings')
        const data = await res.json()
        if (data.settings?.defaultArtistName) setArtist(data.settings.defaultArtistName)
      } catch (err) {
        console.error('Could not load default artist name:', err)
      }
    }
    loadDefaults()
    fetch('http://localhost:3001/collections')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => {})
  }, [])

  const generateTrackId = (date, artistName, trackTitle) => {
    const cleanArtist = artistName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanTitle  = trackTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    return `${date}_${cleanArtist}_${cleanTitle}`
  }

  const handleArtworkSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewCollectionArtwork(file)
    setArtworkPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!artist || !title)                                throw new Error('Artist and Title are required')
      if (grouping === 'existing' && !selectedCollectionId) throw new Error('Please select a collection')
      if (grouping === 'new' && !newCollectionName)         throw new Error('Please enter a name for the new collection')

      const trackId = generateTrackId(trackDate, artist, title)

      // Step 1: Upload files — only if at least one file is selected
      let uploadData = { files: { audio: [], artwork: [], video: [] } }

      if (audioFile || artworkFile || videoFile) {
        const formData = new FormData()
        if (audioFile)   formData.append('audio', audioFile)
        if (artworkFile) formData.append('artwork', artworkFile)
        if (videoFile)   formData.append('video', videoFile)

        let uploadUrl = `http://localhost:3001/upload?releaseId=${encodeURIComponent(trackId)}&artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&genre=${encodeURIComponent(genre)}`
        if (bpm) uploadUrl += `&bpm=${encodeURIComponent(bpm)}`
        if (key) uploadUrl += `&key=${encodeURIComponent(key)}`

        const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: formData })
        if (!uploadResponse.ok) throw new Error((await uploadResponse.json()).error || 'Upload failed')
        uploadData = await uploadResponse.json()
      }

      // Step 2: Save metadata
      const metadataPayload = {
        releaseId: trackId,
        metadata: {
          releaseId: trackId,
          artist,
          title,
          genre,
          releaseFormat: 'Single',
          releaseType: 'Single',
          trackDate,
          releaseDate: trackDate,
          ...(bpm && { bpm: parseInt(bpm) }),
          ...(key && { key }),
          createdAt: new Date().toISOString(),
          files: uploadData.files,
          distribution: { release: [], submit: [], promote: [] },
          labelInfo: { isSigned: false, label: null, signedDate: null, contractDocuments: [] },
        }
      }
      const metadataResponse = await fetch('http://localhost:3001/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadataPayload)
      })
      if (!metadataResponse.ok) throw new Error('Failed to save metadata')

      // Step 3: Handle collection grouping
      if (grouping === 'new') {
        const createRes = await fetch('http://localhost:3001/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newCollectionName,
            artist: newCollectionArtist || artist,
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

        await fetch(`http://localhost:3001/collections/${collection.releaseId}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackReleaseId: trackId, title })
        })

        await fetch(`http://localhost:3001/releases/${trackId}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: collection.releaseId,
            releaseFormat: newCollectionType,
            releaseType: newCollectionType,
          })
        })

      } else if (grouping === 'existing') {
        const col = collections.find(c => c.releaseId === selectedCollectionId)

        await fetch(`http://localhost:3001/collections/${selectedCollectionId}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackReleaseId: trackId, title })
        })

        await fetch(`http://localhost:3001/releases/${trackId}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: selectedCollectionId,
            releaseFormat: col?.collectionType || 'EP',
            releaseType: col?.collectionType || 'EP',
          })
        })
      }

      router.push(`/releases/${trackId}`)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
  const fileInputClass = `${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-100">Add New Track</h1>
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">← Back to Catalogue</Link>
          </div>
          <p className="text-gray-300">Upload your track and add it to your catalogue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6 space-y-6">

          {/* ── Required Fields ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">Required Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name <span className="text-red-400">*</span></label>
              <input type="text" value={artist} onChange={e => setArtist(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Track Title <span className="text-red-400">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre <span className="text-gray-500 font-normal">(optional)</span></label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className={inputClass}>
                <option value="">Choose Genre</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Production Date <span className="text-gray-500 font-normal">(optional)</span>
                <span className="text-xs text-gray-500 ml-2">(when you finished this track)</span>
              </label>
              <input type="date" value={trackDate} onChange={e => setTrackDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* ── Optional Details ── */}
          <div className="space-y-5 pt-6 border-t border-gray-600">
            <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">Optional Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">BPM <span className="text-gray-500 font-normal">(Optional)</span></label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="e.g. 126" min="60" max="200" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Key <span className="text-gray-500 font-normal">(Optional)</span></label>
                <select value={key} onChange={e => setKey(e.target.value)} className={inputClass}>
                  <option value="">Select key...</option>
                  {keys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Collection Grouping ── */}
          <div className="space-y-4 pt-6 border-t border-gray-600">
            <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">Collection</h2>
            <p className="text-xs text-gray-500">Optionally group this track into an EP or Album release</p>

            <div className="space-y-2">

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                grouping === 'standalone' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'
              }`}>
                <input type="radio" name="grouping" value="standalone" checked={grouping === 'standalone'}
                  onChange={() => setGrouping('standalone')} className="accent-purple-500" />
                Standalone Single
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                grouping === 'existing' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'
              }`}>
                <input type="radio" name="grouping" value="existing" checked={grouping === 'existing'}
                  onChange={() => setGrouping('existing')} className="accent-purple-500" />
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

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                grouping === 'new' ? 'border-purple-500 bg-purple-500/10 text-gray-100' : 'border-gray-600 bg-gray-700/50 text-gray-400'
              }`}>
                <input type="radio" name="grouping" value="new" checked={grouping === 'new'}
                  onChange={() => setGrouping('new')} className="accent-purple-500" />
                Create new EP / Album
              </label>

              {grouping === 'new' && (
                <div className="ml-4 space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">

                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Type</label>
                    <div className="flex gap-2">
                      {['EP', 'Album'].map(type => (
                        <button key={type} type="button" onClick={() => setNewCollectionType(type)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                            newCollectionType === type
                              ? type === 'EP'
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                          }`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{newCollectionType} Name <span className="text-red-400">*</span></label>
                    <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Artist <span className="text-gray-500 font-normal">(defaults to track artist)</span></label>
                    <input type="text" value={newCollectionArtist} onChange={e => setNewCollectionArtist(e.target.value)}
                      placeholder={artist} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Artwork <span className="text-gray-500 font-normal">(Optional)</span></label>
                    <div className="flex items-center gap-3">
                      {artworkPreview ? (
                        <img src={artworkPreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-gray-600 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                          No img
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleArtworkSelect} className="hidden" />
                        <span className="block w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg text-center transition-colors cursor-pointer">
                          {artworkPreview ? 'Change Image' : '+ Choose Image'}
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* ── Files ── */}
          <div className="space-y-5 pt-6 border-t border-gray-600">
            <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">Files</h2>

            {/* Audio — now optional */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio File <span className="text-gray-500 font-normal">(Optional)</span>
                <span className="text-xs text-gray-500 ml-2">(.wav, .mp3, .flac)</span>
              </label>
              <input type="file" accept=".wav,.mp3,.flac,.aiff,.m4a,.ogg" onChange={e => setAudioFile(e.target.files[0])} className={fileInputClass} />
              {audioFile && (
                <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                  <span>Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setAudioFile(null)} className="text-red-400 hover:text-red-300 ml-4">Remove</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Artwork <span className="text-gray-500 font-normal">(Optional)</span></label>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setArtworkFile(e.target.files[0])} className={fileInputClass} />
              {artworkFile && (
                <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                  <span>Selected: {artworkFile.name}</span>
                  <button type="button" onClick={() => setArtworkFile(null)} className="text-red-400 hover:text-red-300 ml-4">Remove</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video <span className="text-gray-500 font-normal">(Optional)</span>
                <span className="text-xs text-gray-500 ml-2">(.mp4, .mov)</span>
              </label>
              <input type="file" accept=".mp4,.mov,.avi,.mkv,.webm" onChange={e => setVideoFile(e.target.files[0])} className={fileInputClass} />
              {videoFile && (
                <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                  <span>Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setVideoFile(null)} className="text-red-400 hover:text-red-300 ml-4">Remove</button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white py-3 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none transition-all font-medium">
              {isSubmitting ? 'Adding Track...' : 'Add Track to Catalogue'}
            </button>
            <Link href="/" className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all font-medium text-center">
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
