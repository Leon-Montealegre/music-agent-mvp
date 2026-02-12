'use client'

import { useState, useEffect } from 'react'
import { updateDistribution, updateDistributionEntry } from '@/lib/api'

export default function LogPlatformForm({ releaseId, onSuccess, onCancel, editMode = false, existingEntry = null }) {
  const [formData, setFormData] = useState({
    platform: '',
    status: '',
    url: '',
    notes: ''
  })

  // Pre-fill form if editing
  useEffect(() => {
    if (editMode && existingEntry) {
      setFormData({
        platform: existingEntry.platform || '',
        status: existingEntry.status || '',
        url: existingEntry.url || '',
        notes: existingEntry.notes || ''
      })
    }
  }, [editMode, existingEntry])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.platform || !formData.status) {
      alert('Platform and status are required')
      return
    }

    try {
      if (editMode && existingEntry) {
        // Update existing entry
        await updateDistributionEntry(releaseId, 'release', existingEntry.timestamp, formData)
      } else {
        // Create new entry - MAKE SURE THIS MATCHES
        const entry = {
          platform: formData.platform,
          status: formData.status,
          timestamp: new Date().toISOString()
        }
        if (formData.url) entry.url = formData.url
        if (formData.notes) entry.notes = formData.notes
        
        // This should be calling with 3 arguments: releaseId, 'release', entry
        await updateDistribution(releaseId, 'release', entry)
      }
    
      onSuccess()
    } catch (error) {
      console.error('Error saving platform entry:', error)
      alert('Failed to save. Please try again.')
    }
    
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
{/* Platform */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Platform <span className="text-red-400">*</span>
  </label>
  <select
    value={formData.platform}
    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    required
  >
    {!editMode && <option value="">Select platform</option>}
    <option value="SoundCloud">SoundCloud</option>
    <option value="Spotify">Spotify</option>
    <option value="YouTube">YouTube</option>
    <option value="Beatport">Beatport</option>
    <option value="Bandcamp">Bandcamp</option>
    <option value="Apple Music">Apple Music</option>
    <option value="DistroKid">DistroKid</option>
    <option value="Other">Other</option>
  </select>
</div>


      {/* Status */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Status <span className="text-red-400">*</span>
  </label>
  <select
    value={formData.status}
    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    required
  >
    {!editMode && <option value="">Select status</option>}
    <option value="Not Started">Not Started</option>
    <option value="In Progress">In Progress</option>
    <option value="Uploaded">Uploaded</option>
    <option value="Live">Live</option>
    <option value="Scheduled">Scheduled</option>
  </select>
</div>


      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL (optional)
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          placeholder="Add any notes..."
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
        >
          {editMode ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
