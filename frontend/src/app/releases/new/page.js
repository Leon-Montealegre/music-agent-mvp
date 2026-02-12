'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTrackPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form fields
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('House')
  const [trackDate, setTrackDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [releaseFormat, setReleaseFormat] = useState('Single')
  
  // Files
  const [audioFile, setAudioFile] = useState(null)
  const [artworkFile, setArtworkFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  const genres = [
    'Ambient',
    'Deep House',
    'House',
    'Indie Dance',
    'Melodic House and Techno',
    'Progressive House',
    'Tech House',
    'Techno',
    'Trance',
    'Other'
  ]

  const releaseFormats = [
    'Single',
    'EP',
    'Album',
    'Remix'
  ]

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
      if (!artist || !title) {
        throw new Error('Artist and Title are required')
      }
      if (!audioFile) {
        throw new Error('Audio file is required')
      }
      if (!artworkFile) {
        throw new Error('Artwork is required')
      }

      const trackId = generateTrackId(trackDate, artist, title)

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('artwork', artworkFile)
      if (videoFile) {
        formData.append('video', videoFile)
      }

      const uploadUrl = `http://localhost:3001/upload?releaseId=${encodeURIComponent(trackId)}&artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}&genre=${encodeURIComponent(genre)}`

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()

      const metadataPayload = {
        releaseId: trackId,
        metadata: {
          releaseId: trackId,
          artist,
          title,
          genre,
          releaseFormat,
          releaseType: releaseFormat,  // Add this for backward compatibility
          trackDate,
          releaseDate: trackDate,  // Add this for backward compatibility
          createdAt: new Date().toISOString(),
          files: uploadData.files,
          distribution: {
            release: [],
            submit: [],
            promote: []
          },
          labelInfo: {
            isSigned: false,
            label: null,
            signedDate: null,
            contractDocuments: []
          }
        }
      }

      const metadataResponse = await fetch('http://localhost:3001/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadataPayload)
      })

      if (!metadataResponse.ok) {
        throw new Error('Failed to save metadata')
      }

      router.push(`/releases/${trackId}`)

    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Add New Track
          </h1>
          <p className="text-gray-600 mt-2">
            Upload your track and add it to your catalogue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artist Name *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Sophie & Joe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Track Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Tell Me"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre *
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Production Date *
              <span className="text-xs text-gray-500 ml-2">
                (when you finished this track)
              </span>
            </label>
            <input
              type="date"
              value={trackDate}
              onChange={(e) => setTrackDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Format *
            </label>
            <select
              value={releaseFormat}
              onChange={(e) => setReleaseFormat(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {releaseFormats.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio File * (.wav, .mp3, .flac)
            </label>
            <input
              type="file"
              accept=".wav,.mp3,.flac,.aiff,.m4a,.ogg"
              onChange={(e) => setAudioFile(e.target.files[0])}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {audioFile && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artwork * (.jpg, .png)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setArtworkFile(e.target.files[0])}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {artworkFile && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {artworkFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video (Optional) (.mp4, .mov)
            </label>
            <input
              type="file"
              accept=".mp4,.mov,.avi,.mkv,.webm"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            {videoFile && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Adding Track...' : 'Add Track to Catalogue'}
          </button>
        </form>
      </div>
    </div>
  )
}