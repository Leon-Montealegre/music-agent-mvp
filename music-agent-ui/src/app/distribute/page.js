'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DistributePage() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [generating, setGenerating] = useState(false);
  const [packageUrl, setPackageUrl] = useState('');

  // Fetch all releases when page loads
  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch('http://localhost:3001/releases');
      if (!response.ok) throw new Error('Failed to fetch releases');
      const data = await response.json();
      setReleases(data.releases || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (!selectedRelease) return;

    setGenerating(true);
    setError('');
    setPackageUrl('');

    try {
      const response = await fetch(
        `http://localhost:3001/distribute/soundcloud/package?releaseId=${selectedRelease.releaseId}&versionId=primary&privacy=${privacy}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Package generation failed');
      }

      const data = await response.json();
      console.log('Backend returned packagePath:', data.packagePath);
      const cleanPath = data.packagePath.startsWith('/') ? data.packagePath.slice(1) : data.packagePath;
      const finalUrl = `http://localhost:3001/releases/${data.packagePath}`;
      console.log('Final download URL:', finalUrl);
      setPackageUrl(finalUrl);
      setGenerating(false);
      
      // Refresh releases to show updated distribution status
      fetchReleases();
      
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading releases...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Distribute to SoundCloud</h1>
            <p className="text-gray-300">Select a release and generate your upload package</p>
          </div>
          <Link 
            href="/"
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            ← Back to Upload
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            ❌ {error}
          </div>
        )}

        {/* Releases Grid */}
        {releases.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <p className="text-gray-300 text-lg mb-4">No releases found</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700"
            >
              Upload Your First Release
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {releases.map((release) => (
              <div 
                key={release.releaseId}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  {release.title}
                </h3>
                <p className="text-gray-300 mb-1">by {release.artist}</p>
                <p className="text-gray-400 text-sm mb-4">
                  {release.genre} • {release.releaseDate}
                </p>

                {/* Distribution Status */}
                {release.distribution?.release?.find(d => d.platform === 'SoundCloud') ? (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-200 text-sm">
                      ✅ Package generated: {new Date(release.distribution.release.find(d => d.platform === 'SoundCloud').generatedAt).toLocaleString()}
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={() => setSelectedRelease(release)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Distribute to SoundCloud
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Distribution Modal */}
        {selectedRelease && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full border border-purple-500/50">
              <h2 className="text-2xl font-bold text-white mb-4">
                Configure SoundCloud Upload
              </h2>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  <strong className="text-white">{selectedRelease.title}</strong>
                </p>
                <p className="text-gray-400 text-sm">by {selectedRelease.artist}</p>
              </div>

              {/* Privacy Setting */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Privacy Setting
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/20 cursor-pointer hover:bg-white/10">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="text-white font-medium">Public</div>
                      <div className="text-gray-400 text-sm">Anyone can listen</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/20 cursor-pointer hover:bg-white/10">
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="text-white font-medium">Private</div>
                      <div className="text-gray-400 text-sm">Only you can access</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Success Message with Download Link */}
              {packageUrl && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-200 mb-3">✅ Package generated successfully!</p>
                  <a
                    href={packageUrl}
                    download
                    className="block w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-center"
                  >
                    Download ZIP Package
                  </a>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRelease(null);
                    setPrivacy('public');
                    setPackageUrl('');
                    setError('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDistribute}
                  disabled={generating || packageUrl}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : packageUrl ? 'Generated ✓' : 'Generate Package'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
