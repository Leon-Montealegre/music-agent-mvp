'use client'

import { useState, useEffect } from 'react'
import { updateDistribution, updateDistributionEntry } from '@/lib/api'

function calcDateStr(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LogSubmissionForm({ releaseId, onSuccess, onCancel, editMode = false, existingEntry = null, onSubmit = null }) {
  const [formData, setFormData] = useState({
    label: '',
    platform: '',
    status: 'Submitted',
    notes: ''
  })

  // Follow-up state — only used when status = Submitted
  const [followUpEnabled, setFollowUpEnabled] = useState(false)
  const [followUpDays, setFollowUpDays] = useState(10)
  const [followUpDate, setFollowUpDate] = useState(() => calcDateStr(10))

  // Pre-fill form if editing
  useEffect(() => {
    if (editMode && existingEntry) {
      setFormData({
        label: existingEntry.label || '',
        platform: existingEntry.platform || '',
        status: existingEntry.status || '',
        notes: existingEntry.notes || ''
      })
      // Always start with the checkbox OFF — user must explicitly enable it
      setFollowUpEnabled(false)
      if (existingEntry.followUpDate) {
        setFollowUpDate(existingEntry.followUpDate.slice(0, 10))
      }
    }
  }, [editMode, existingEntry])

  // Keep days input in sync when user edits the days number
  const handleDaysChange = (val) => {
    const days = Math.max(1, Math.min(365, parseInt(val) || 1))
    setFollowUpDays(days)
    setFollowUpDate(calcDateStr(days))
  }

  // Keep days in sync when user picks a date directly
  const handleDateChange = (val) => {
    setFollowUpDate(val)
    if (val) {
      const diff = Math.round((new Date(val + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
      if (diff > 0) setFollowUpDays(diff)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.label || !formData.platform || !formData.status) {
      alert('Label, platform, and status are required')
      return
    }

    const followUpDateValue = (formData.status === 'Submitted' && followUpEnabled && followUpDate)
      ? followUpDate
      : null

    try {
      if (onSubmit) {
        await onSubmit({ ...formData, followUpDate: followUpDateValue })
      } else if (editMode && existingEntry) {
        await updateDistributionEntry(releaseId, 'submit', existingEntry.timestamp, { ...formData, followUpDate: followUpDateValue })
      } else {
        const entry = {
          label: formData.label,
          platform: formData.platform,
          status: formData.status,
          timestamp: new Date().toISOString(),
          followUpDate: followUpDateValue,
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
          <option value="Submitted">Submitted</option>
          <option value="Signed">Signed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Follow-up reminder — only shown when Submitted */}
      {formData.status === 'Submitted' && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-300 font-medium">📅 Follow-up reminder</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={followUpEnabled}
                onChange={e => setFollowUpEnabled(e.target.checked)}
                className="accent-purple-500 w-4 h-4"
              />
              <span className="text-xs text-gray-400">Set reminder</span>
            </label>
          </div>

          {followUpEnabled && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 whitespace-nowrap">Follow up in</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={followUpDays}
                  onChange={e => handleDaysChange(e.target.value)}
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 text-gray-100 rounded text-sm text-center focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">days</span>
                <span className="text-xs text-gray-400">({formatDisplayDate(followUpDate)})</span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Or pick a specific date:</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 text-gray-100 rounded text-sm focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

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
