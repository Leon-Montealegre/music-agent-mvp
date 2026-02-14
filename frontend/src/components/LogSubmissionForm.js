'use client'

import { useState, useEffect } from 'react'
import { updateDistribution, updateDistributionEntry } from '@/lib/api'

export default function LogSubmissionForm({ releaseId, onSuccess, onCancel, editMode = false, existingEntry = null }) {
  const [formData, setFormData] = useState({
    label: '',
    platform: '',
    status: '',
    notes: ''
  })

  // Pre-fill form if editing
  useEffect(() => {
    if (editMode && existingEntry) {
      setFormData({
        label: existingEntry.label || '',
        platform: existingEntry.platform || '',
        status: existingEntry.status || '',
        notes: existingEntry.notes || ''
      })
    }
  }, [editMode, existingEntry])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.label || !formData.platform || !formData.status) {
      alert('Label, platform, and status are required')
      return
    }

    try {
      if (editMode && existingEntry) {
        // Update existing entry
        await updateDistributionEntry(releaseId, 'submit', existingEntry.timestamp, formData)
      } else {
        // Create new entry
        const entry = {
          label: formData.label,
          platform: formData.platform,
          status: formData.status,
          timestamp: new Date().toISOString()
        }
        if (formData.notes) entry.notes = formData.notes
        await updateDistribution(releaseId, 'submit', entry)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving submission entry:', error)
      alert('Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Label Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Label Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Anjunadeep"
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
        />
      </div>

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
    <option value="LabelRadar">LabelRadar</option>
    <option value="Email">Email</option>
    <option value="Website">Website</option>
    <option value="SubmitHub">SubmitHub</option>
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
    <option value="Submitted">Submitted</option>
    <option value="Rejected">Rejected</option>
    <option value="No Response">No Response</option>
  </select>
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
