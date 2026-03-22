'use client'

/**
 * ContactPicker
 *
 * A two-mode component for attaching a contact to a distribution entry:
 *
 * MODE 1 — Search & pick:  Shows a search box.  As you type it filters your
 *   existing contacts.  Clicking one calls onSelect({ contactId }).
 *   At the bottom there's a "Create new contact" button that switches to Mode 2.
 *
 * MODE 2 — Create form:  A compact form for name / email / role / label / notes.
 *   On submit it calls onSelect({ name, email, role, ... }) so the parent
 *   can POST to the entry endpoint which will create the contact and link it.
 *
 * Props:
 *   contacts   {Array}    Full list of the user's contacts (pre-fetched by parent)
 *   onSelect   {Function} Called with { contactId } OR { name, email, ... }
 *   onCancel   {Function} Called when the user clicks "Cancel"
 *   labelName  {string}   Optional — pre-fills the label/company field
 */

import { useState, useMemo, useRef, useEffect } from 'react'

const ROLE_OPTIONS = [
  'A&R', 'Label Owner', 'Label Manager', 'Marketing', 'Label',
  'Blog Owner', 'Playlist Curator', 'Channel Owner', 'PR Manager', 'Promo',
  'Artist', 'Booking Agent', 'Other',
]

function getInitials(name) {
  if (!name?.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

export default function ContactPicker({ contacts = [], onSelect, onCancel, labelName = '' }) {
  const [mode, setMode] = useState('search') // 'search' | 'create'
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', role: '', label: labelName, phone: '', location: '', notes: '',
  })
  const searchRef = useRef(null)

  // Auto-focus the search box when the picker opens
  useEffect(() => {
    if (mode === 'search') searchRef.current?.focus()
  }, [mode])

  // Filter contacts by the search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return contacts.slice(0, 8) // show first 8 when no query
    return contacts.filter(c => {
      const name    = (c.name  || '').toLowerCase()
      const email   = (c.email || '').toLowerCase()
      const company = (c.label || '').toLowerCase()
      return name.includes(q) || email.includes(q) || company.includes(q)
    }).slice(0, 8)
  }, [contacts, query])

  // Handle picking an existing contact
  function handlePick(contact) {
    onSelect({ contactId: contact.id })
  }

  // Handle creating a new contact
  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      // Pass the form fields directly — the parent will POST them to the entry endpoint
      // which will create the contact row + entry_contacts link in one step.
      onSelect({ ...form, name: form.name.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  // ── SEARCH MODE ─────────────────────────────────────────────────────────────
  if (mode === 'search') {
    return (
      <div className="p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts by name, email, or label…"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Contact list */}
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No contacts yet — create one below.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No contacts match "{query}"
          </p>
        ) : (
          <ul className="divide-y divide-gray-700/60 rounded-lg border border-gray-700 overflow-hidden max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handlePick(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/70 flex items-center justify-center text-xs font-semibold text-white">
                    {getInitials(c.name)}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    {(c.label || c.email) && (
                      <p className="text-xs text-gray-400 truncate">
                        {c.label ? `${c.label}` : ''}{c.label && c.email ? ' · ' : ''}{c.email || ''}
                      </p>
                    )}
                  </div>
                  {/* Role badge */}
                  {c.role && (
                    <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-700/60 px-2 py-0.5 rounded-full">
                      {c.role}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="text-sm text-purple-400 hover:text-purple-300 font-medium"
          >
            + Create new contact
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── CREATE MODE ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleCreate} className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-200">New contact</h3>
        <button
          type="button"
          onClick={() => setMode('search')}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          ← Back to search
        </button>
      </div>

      {/* Name (required) */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Sophie Müller"
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Label / Company */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Label / Company</label>
        <input
          type="text"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          placeholder="Anjunadeep"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Role + Email (side by side) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
          <select
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">— pick —</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="sophie@label.com"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Met at ADE 2025…"
          rows={2}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!form.name.trim() || submitting}
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {submitting ? 'Saving…' : 'Create & attach'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
