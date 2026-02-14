'use client';

import { useState } from 'react';

export default function SongLinks({ releaseId, initialLinks = [] }) {
  const [links, setLinks] = useState(initialLinks);
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({ url: '', title: '', note: '' }); // ← Changed
  const [copySuccess, setCopySuccess] = useState(null);

  // Add a new link
  const handleAddLink = async () => {
    // Basic validation
    if (!newLink.url || !newLink.title) { // ← Changed
      alert('URL and Title are required');
      return;
    }

    // Check if valid URL
    try {
      new URL(newLink.url);
    } catch {
      alert('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    const linkToAdd = {
      id: `link_${Date.now()}`,
      url: newLink.url,
      title: newLink.title, // ← Changed
      note: newLink.note,
      addedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`http://localhost:3001/releases/${releaseId}/song-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkToAdd)
      });

      if (!res.ok) throw new Error('Failed to add link');

      const updatedRelease = await res.json();
      setLinks(updatedRelease.songLinks || []);
      setNewLink({ url: '', title: '', note: '' }); // ← Changed
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Failed to add link');
    }
  };

  // Delete a link
  const handleDeleteLink = async (linkId) => {
    if (!confirm('Delete this link?')) return;

    try {
      const res = await fetch(`http://localhost:3001/releases/${releaseId}/song-links/${linkId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete link');

      const updatedRelease = await res.json();
      setLinks(updatedRelease.songLinks || []);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (url, linkId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(linkId);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      alert('Failed to copy URL');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        🔗 Song Links
      </h2>

      {/* Existing Links */}
      {links.length > 0 ? (
        <div className="space-y-3 mb-4">
          {links.map(link => (
            <div key={link.id} className="bg-gray-700 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-medium text-purple-400">{link.title}</div> {/* ← Changed */}
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-white break-all"
                  >
                    {link.url}
                  </a>
                  {link.note && (
                    <div className="text-sm text-gray-400 mt-1">{link.note}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleCopyUrl(link.url, link.id)}
                  className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  {copySuccess === link.id ? '✓ Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 mb-4">No links added yet</p>
      )}

      {/* Add New Link Button/Form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium"
        >
          + Add Link
        </button>
      ) : (
        <div className="bg-gray-700 rounded p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span> {/* ← Changed */}
              </label>
              <input
                type="text"
                value={newLink.title} // ← Changed
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })} // ← Changed
                placeholder="e.g., Private SoundCloud, Dropbox Folder"
                className="w-full px-3 py-2 bg-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                value={newLink.note}
                onChange={(e) => setNewLink({ ...newLink, note: e.target.value })}
                placeholder="e.g., For promo use only"
                className="w-full px-3 py-2 bg-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddLink}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Save Link
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewLink({ url: '', title: '', note: '' }); // ← Changed
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
