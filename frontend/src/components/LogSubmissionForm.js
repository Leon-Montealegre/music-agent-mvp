'use client'

import { useState } from 'react'

export default function LogSubmissionForm({ releaseId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    label: '',
    platform: '',
    status: '',
    notes: ''
  })

  const platforms = [
    'LabelRadar',
    'Email',
    'Private SoundCloud Link',
    'SubmitHub',
    'Direct Message',
    'Other'
  ]

  const statuses = [
    'Submitted',
    'Listened',
    'Rejected',
    'Signed',
    'No Response'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.label || !formData.platform || !formData.status) {
      alert('Please fill in label name, platform, and status')
      return
    }

    try {
      const entry = {
        label: formData.label,
        platform: formData.platform,
        status: formData.status,
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
          path: 'submit',
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
      console.error('Label submission error:', error)
      alert('Failed to log submission. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Label Name *
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Anjunadeep, Cercle Records..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          required
        />
      </div>

      {/* Platform */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Submission Platform *
        </label>
        <select
          value={formData.platform}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          required
        >
          <option value="">Select platform...</option>
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any feedback, response details, or reminders..."
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
          Log Submission
        </button>
      </div>
    </form>
  )
}
