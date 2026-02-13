'use client'

import { useState, useEffect } from 'react'

export default function LabelContactForm({ releaseId, labelName, existingContact, onSuccess, onCancel }) {
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

  // Pre-fill if editing
  useEffect(() => {
    if (existingContact) {
      setFormData({
        name: existingContact.name || '',
        label: existingContact.label || labelName || '',
        email: existingContact.email || '',
        phone: existingContact.phone || '',
        location: existingContact.location || '',
        role: existingContact.role || '',
        notes: existingContact.notes || ''
      })
    }
  }, [existingContact, labelName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:3001/releases/${releaseId}/label-deal/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save contact')
      }

      const data = await response.json()
      console.log('✅ Contact saved:', data)
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
      {/* Name */}
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

      {/* Label (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Label
        </label>
        <input
          type="text"
          value={formData.label}
          readOnly
          className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed"
          placeholder="Early Morning"
        />
      </div>

      {/* Email */}
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

      {/* Phone */}
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

      {/* Location */}
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

      {/* Role */}
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
          <option value="Label Manager">Label Manager</option>
          <option value="Marketing">Marketing</option>
          <option value="Booking Agent">Booking Agent</option>
          <option value="Manager">Manager</option>
          <option value="Artist">Artist</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Met in London in a pub, was interested in collabing with me and Hernan Cattaneo"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : existingContact ? 'Update Contact' : 'Save Contact'}
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
