'use client'

import { useState } from 'react'

export default function LogPlatformForm({ releaseId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    platform: '',
    status: '',
    url: '',
    notes: ''
  })

  const platforms = [
    'SoundCloud',
    'DistroKid',
    'Bandcamp',
    'YouTube',
    'Beatport',
    'Spotify',
    'Apple Music',
    'Other'
  ]

  const statuses = [
    'Not Started',
    'Package Generated',
    'Uploaded',
    'Live'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.platform || !formData.status) {
      alert('Please select a platform and status')
      return
    }

    try {
      const entry = {
        platform: formData.platform,
        status: formData.status,
        url: formData.url,
        notes: formData.notes,
        timestamp: new Date().toISOString()
      }

      // Call API directly
      const response = await fetch(`http://localhost:3001/releases/${releaseId}/distribution`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: 'release',
          entry: entry
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update distribution')
      }

      // Success - call parent's success handler
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error) {
      console.error('Platform release error:', error)
      alert('Failed to log platform release. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Platform */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Platform *
        </label>
        <select
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          required
        >
          <option value="">Select a platform...</option>
          {platforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          required
        >
          <option value="">Select status...</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL (optional)
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://soundcloud.com/..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional details..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Log Platform Release
        </button>
      </div>
    </form>
  )
}
