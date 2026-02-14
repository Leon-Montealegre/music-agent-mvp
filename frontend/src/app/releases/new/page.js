'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateTrackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [trackDate, setTrackDate] = useState(new Date().toISOString().split('T')[0])
  const [releaseFormat, setReleaseFormat] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [artworkFile, setArtworkFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  const genres = ['Ambient', 'Deep House', 'House', 'Indie Dance', 'Melodic House and Techno', 'Progressive House', 'Tech House', 'Techno', 'Trance', 'Other']
  const releaseFormats = ['Single', 'EP', 'Album', 'Remix']

  const generateTrackId = (date, artistName, trackTitle) => {
    const cleanArtist = artistName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanTitle = trackTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    return `${date}_${cleanArtist}_${cleanTitle}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!artist || !title) throw new Error('Artist and Title are required')
      if (!genre) throw new Error('Genre is required')
      if (!releaseFormat) throw new Error('Format is required')
      if (!audioFile) throw new Error('Audio file is required')

      const trackId = generateTrackId(trackDate, artist, title)
      const formData = new FormData()
      formData.append('audio', audioFile)
      if (artworkFile) formData.append('artwork', artworkFile)
      if (videoFile) formData.append('video', videoFile)

      const uploadUrl = `http://localhost:3001/upload?releaseId=${encodeURIComponent(trackId)}&artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&genre=${encodeURIComponent(genre)}`
      const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: formData })
      if (!uploadResponse.ok) throw new Error((await uploadResponse.json()).error || 'Upload failed')

      const uploadData = await uploadResponse.json()
      const metadataPayload = {
        releaseId: trackId,
        metadata: {
          releaseId: trackId, artist, title, genre, releaseFormat,
          releaseType: releaseFormat, trackDate, releaseDate: trackDate,
          createdAt: new Date().toISOString(), files: uploadData.files,
          distribution: { release: [], submit: [], promote: [] },
          labelInfo: { isSigned: false, label: null, signedDate: null, contractDocuments: [] }
        }
      }

      const metadataResponse = await fetch('http://localhost:3001/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadataPayload)
      })

      if (!metadataResponse.ok) throw new Error('Failed to save metadata')
      router.push(`/releases/${trackId}`)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const fileInputClasses = "w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"

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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Artist Name <span className="text-red-400">*</span></label>
            <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} required className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Track Title <span className="text-red-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Genre <span className="text-red-400">*</span></label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} required className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Choose Genre</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Production Date <span className="text-red-400">*</span> <span className="text-xs text-gray-500 ml-2">(when you finished this track)</span></label>
            <input type="date" value={trackDate} onChange={(e) => setTrackDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Format <span className="text-red-400">*</span></label>
            <select value={releaseFormat} onChange={(e) => setReleaseFormat(e.target.value)} required className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Pick format</option>
              {releaseFormats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Audio File <span className="text-red-400">*</span> <span className="text-xs text-gray-500 ml-2">(.wav, .mp3, .flac)</span></label>
            <input type="file" accept=".wav,.mp3,.flac,.aiff,.m4a,.ogg" onChange={(e) => setAudioFile(e.target.files[0])} required className={fileInputClasses} />
            {audioFile && (
              <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                <span>✓ Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button type="button" onClick={() => setAudioFile(null)} className="text-red-400 hover:text-red-300 ml-4">✕ Remove</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Artwork <span className="text-gray-500">(Optional)</span></label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setArtworkFile(e.target.files[0])} className={fileInputClasses} />
            {artworkFile && (
              <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                <span>✓ Selected: {artworkFile.name}</span>
                <button type="button" onClick={() => setArtworkFile(null)} className="text-red-400 hover:text-red-300 ml-4">✕ Remove</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video <span className="text-gray-500">(Optional)</span> <span className="text-xs text-gray-500 ml-2">(.mp4, .mov)</span></label>
            <input type="file" accept=".mp4,.mov,.avi,.mkv,.webm" onChange={(e) => setVideoFile(e.target.files[0])} className={fileInputClasses} />
            {videoFile && (
        <div className="flex items-center justify-between text-sm text-gray-400 mt-2 bg-gray-900/50 p-2 rounded">
                <span>✓ Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button type="button" onClick={() => setVideoFile(null)} className="text-red-400 hover:text-red-300 ml-4">✕ Remove</button>
              </div>
            )}
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">⚠️ {error}</div>}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 text-white py-3 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none transition-all font-medium">
              {isSubmitting ? '⏳ Adding Track...' : '✓ Add Track to Catalogue'}
            </button>
            <Link href="/" className="-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all font-medium text-center">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
