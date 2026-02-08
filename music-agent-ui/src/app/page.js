'use client';

import { useState } from 'react';

const GENRE_OPTIONS = [
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
];

export default function UploadForm() {
  const [formData, setFormData] = useState({
    artist: '',
    title: '',
    genre: 'Melodic House and Techno',
    releaseType: 'Single',
    versionName: 'Primary Version'
  });

  const [files, setFiles] = useState({
    audio: null,
    artwork: null,
    video: null
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const fileType = e.target.name;
    setFiles({
      ...files,
      [fileType]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess(false);
    setUploadProgress('Validating...');

    // Validation
    if (!formData.artist || !formData.title || !formData.genre) {
      setError('Artist, title, and genre are required');
      setUploading(false);
      return;
    }

    if (!files.audio) {
      setError('Audio file is required');
      setUploading(false);
      return;
    }

    try {
      // Generate releaseId (same format as backend: YYYY-MM-DD_Artist_Title)
      const today = new Date().toISOString().split('T')[0];
      const artistSlug = formData.artist.replace(/\s+/g, '');
      const titleSlug = formData.title.replace(/\s+/g, '');
      const releaseId = `${today}_${artistSlug}_${titleSlug}`;

      setUploadProgress('Uploading files...');

      // Step 1: Upload files
      const uploadFormData = new FormData();
      uploadFormData.append('audio', files.audio);
      if (files.artwork) uploadFormData.append('artwork', files.artwork);
      if (files.video) uploadFormData.append('video', files.video);

      const uploadResponse = await fetch(
        `http://localhost:3001/upload?releaseId=${releaseId}&artist=${encodeURIComponent(formData.artist)}&title=${encodeURIComponent(formData.title)}&genre=${encodeURIComponent(formData.genre)}&versionName=${encodeURIComponent(formData.versionName)}`,
        {
          method: 'POST',
          body: uploadFormData
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadProgress('Saving metadata...');

      // Step 2: Save metadata
      const metadataPayload = {
        releaseId,
        artist: formData.artist,
        title: formData.title,
        genre: formData.genre,
        releaseType: formData.releaseType,
        releaseDate: today
      };

      const metadataResponse = await fetch('http://localhost:3001/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadataPayload)
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Metadata save failed');
      }

      setUploadProgress('');
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          artist: '',
          title: '',
          genre: 'Melodic House and Techno',
          releaseType: 'Single',
          versionName: 'Primary Version'
        });
        setFiles({ audio: null, artwork: null, video: null });
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err.message);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-2">Music Agent</h1>
          <p className="text-gray-300 mb-8">Upload your release</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Artist */}
            <div>
              <label className="block text-white font-medium mb-2">
                Artist *
              </label>
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                Track Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-white font-medium mb-2">
                Genre *
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {GENRE_OPTIONS.map(genre => (
                  <option key={genre} value={genre} className="bg-gray-900">
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Version Name */}
            <div>
              <label className="block text-white font-medium mb-2">
                Version Name
              </label>
              <input
                type="text"
                name="versionName"
                value={formData.versionName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Primary Version, Extended Mix, etc."
              />
            </div>

            {/* Audio File */}
            <div>
              <label className="block text-white font-medium mb-2">
                Audio File * {files.audio && `(${files.audio.name})`}
              </label>
              <input
                type="file"
                name="audio"
                onChange={handleFileChange}
                accept=".wav,.mp3,.flac,.aiff,.m4a"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none"
                required
              />
            </div>

            {/* Artwork File */}
            <div>
              <label className="block text-white font-medium mb-2">
                Artwork {files.artwork && `(${files.artwork.name})`}
              </label>
              <input
                type="file"
                name="artwork"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none"
              />
            </div>

            {/* Video File */}
            <div>
              <label className="block text-white font-medium mb-2">
                Video (Optional) {files.video && `(${files.video.name})`}
              </label>
              <input
                type="file"
                name="video"
                onChange={handleFileChange}
                accept=".mp4,.mov,.avi,.mkv"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none"
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200">
                {uploadProgress}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                ❌ {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                ✅ Release uploaded successfully!
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {uploading ? 'Uploading...' : 'Upload Release'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
