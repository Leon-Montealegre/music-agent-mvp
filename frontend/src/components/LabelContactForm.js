'use client'

import { useState, useEffect } from 'react'
import { apiFetch, API_BASE_URL } from '@/lib/api'

export default function LabelContactForm({
  releaseId,
  labelName,
  existingContact,
  onSuccess,
  onCancel,
  baseUrl, // optional — if not provided, falls back to release endpoint
  contactPath = 'label-deal/contacts'
}) {
  const [formData, setFormData] = useState({
    name: '',
    label: labelName || '',
    email: '',
    phone: '',
    location: '',
    role: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const apiBase = baseUrl || `${API_BASE_URL}/releases/${releaseId}`

  useEffect(() => {
    if (existingContact) {
      setFormData({
        name:     existingContact.name     || '',
        label:    existingContact.label    || labelName || '',
        email:    existingContact.email    || '',
        phone:    existingContact.phone    || '',
        location: existingContact.location || '',
        role:     existingContact.role     || '',
        notes:    existingContact.notes    || ''
      })
    }
  }, [existingContact, labelName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) { alert('Name is required'); return }

    setSubmitting(true)
    try {
      const url = existingContact?.id
        ? `${apiBase}/${contactPath}/${existingContact.id}`
        : `${apiBase}/${contactPath}`

      const response = await apiFetch(url, {
        method: existingContact?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save contact')
      }

      const data = await response.json()
      onSuccess(data.contact)
    } catch (error) {
      console.error('Error saving contact:', error)
      alert(`Failed to save contact: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Contact Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Guy J"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Company or Label Name
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Early Morning"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="guyj@earlymorning.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Phone <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="+44 20 0420 0420"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location <span className="text-gray-500">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Malta"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Role <span className="text-gray-500">(Optional)</span>
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Choose role</option>
          <option value="A&R">A&R</option>
          <option value="Label Owner">Label Owner</option>
          <option value="Label Manager">Label Manager</option>
          <option value="Marketing">Marketing</option>
          <option value="Blog Owner">Blog Owner</option>
          <option value="Playlist Curator">Playlist Curator</option>
          <option value="Channel Owner">Channel Owner</option>
          <option value="PR Manager">PR Manager</option>
          <option value="Booking Agent">Booking Agent</option>
          <option value="Artist">Artist</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Accept calls mon-fri between 9h-17h CET on his cell. Birthday is on June 15."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : existingContact ? 'Update Contact' : 'Add Contact'}
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
