'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { fetchAllContacts, createContact, updateContact, deleteContact } from '@/lib/contacts'
import Modal from '@/components/Modal'

// ── Constants ─────────────────────────────────────────────────────────────────

const LABEL_ROLES = ['A&R', 'Label Owner', 'Label Manager', 'Marketing', 'Label']
const PROMO_ROLES = ['Blog Owner', 'Playlist Curator', 'Channel Owner', 'PR Manager', 'Promo']
const ROLE_OPTIONS = [
  ...LABEL_ROLES,
  ...PROMO_ROLES,
  'Artist', 'Booking Agent', 'Other',
]

function getContactRoleType(contact) {
  const role = (contact.role || '').trim()
  if (LABEL_ROLES.some(r => role.toLowerCase() === r.toLowerCase())) return 'label'
  if (PROMO_ROLES.some(r => role.toLowerCase() === r.toLowerCase())) return 'promo'
  return 'other'
}

function getInitials(name) {
  if (!name || !name.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  return name.trim().slice(0, 2).toUpperCase()
}

const AVATAR_STYLES = {
  label: 'bg-purple-600/80 text-white',
  promo: 'bg-pink-600/80 text-white',
  other: 'bg-gray-600/80 text-gray-200',
}

const BADGE_STYLES = {
  label: 'bg-purple-600/40 text-purple-300 border-purple-500/50',
  promo: 'bg-pink-600/40 text-pink-300 border-pink-500/50',
  other: 'bg-gray-600/40 text-gray-400 border-gray-500/50',
}

// ── Empty form helper ─────────────────────────────────────────────────────────

const emptyForm = () => ({ name: '', email: '', role: '', label: '', phone: '', location: '', notes: '' })

// ── Contact form modal ────────────────────────────────────────────────────────
// Shared between "create new" and "edit existing".

function ContactFormModal({ isOpen, onClose, onSaved, editingContact }) {
  const isEdit = !!editingContact?.id
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editingContact) {
      setForm({
        name:     editingContact.name     || '',
        email:    editingContact.email    || '',
        role:     editingContact.role     || '',
        label:    editingContact.label    || '',
        phone:    editingContact.phone    || '',
        location: editingContact.location || '',
        notes:    editingContact.notes    || '',
      })
    } else {
      setForm(emptyForm())
    }
    setError(null)
  }, [editingContact, isOpen])

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      let saved
      if (isEdit) {
        saved = await updateContact(editingContact.id, form)
      } else {
        saved = await createContact(form)
      }
      onSaved(saved, isEdit)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Contact' : 'New Contact'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 rounded-lg px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            {...field('name')}
            required
            placeholder="Sophie Müller"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Label / Company</label>
          <input
            type="text"
            {...field('label')}
            placeholder="Anjunadeep"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <select
              {...field('role')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">— choose —</option>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              {...field('email')}
              placeholder="sophie@label.com"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              {...field('phone')}
              placeholder="+49 …"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input
              type="text"
              {...field('location')}
              placeholder="Berlin"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            {...field('notes')}
            rows={3}
            placeholder="Met at ADE 2025. Prefers demos over email…"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={!form.name.trim() || saving}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create contact'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function ContactDetailModal({ contact, isOpen, onClose, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (isOpen) setConfirmingDelete(false) }, [isOpen])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteContact(contact.id)
      onDelete(contact.id)
      onClose()
    } catch {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  if (!contact) return null
  const roleType = getContactRoleType(contact)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact.name || 'Contact'}>
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${AVATAR_STYLES[roleType]}`}>
            {getInitials(contact.name)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{contact.name}</h3>
            {contact.label && <p className="text-gray-400 text-sm">{contact.label}</p>}
            {contact.role && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLES[roleType]}`}>
                {contact.role}
              </span>
            )}
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          {contact.email && (
            <div className="flex gap-3">
              <dt className="w-20 text-gray-500 flex-shrink-0">Email</dt>
              <dd><a href={`mailto:${contact.email}`} className="text-purple-400 hover:underline">{contact.email}</a></dd>
            </div>
          )}
          {contact.phone && (
            <div className="flex gap-3">
              <dt className="w-20 text-gray-500 flex-shrink-0">Phone</dt>
              <dd><a href={`tel:${contact.phone}`} className="text-purple-400 hover:underline">{contact.phone}</a></dd>
            </div>
          )}
          {contact.location && (
            <div className="flex gap-3">
              <dt className="w-20 text-gray-500 flex-shrink-0">Location</dt>
              <dd className="text-gray-200">{contact.location}</dd>
            </div>
          )}
          {contact.notes && (
            <div className="flex gap-3">
              <dt className="w-20 text-gray-500 flex-shrink-0">Notes</dt>
              <dd className="text-gray-200 whitespace-pre-wrap">{contact.notes}</dd>
            </div>
          )}
        </dl>

        {(contact.sources || []).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">
              Linked to {contact.sources.length} submission{contact.sources.length !== 1 ? 's' : ''}
            </h4>
            <ul className="space-y-1">
              {contact.sources.map((s, i) => (
                <li key={s.entryId || i}>
                  <Link
                    href={s.sourceHref}
                    onClick={onClose}
                    className="text-purple-400 hover:underline text-sm"
                  >
                    {s.sourceName}
                  </Link>
                  <span className="text-gray-600 text-xs ml-2">({s.sourceType})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => onEdit(contact)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Edit
          </button>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-sm rounded-lg border border-red-700/50 transition-colors"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Modal state
  const [selectedContact, setSelectedContact] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (!session?.token) return
    async function load() {
      try {
        setLoading(true)
        const data = await fetchAllContacts()
        setContacts(data)
        setError(null)
      } catch (err) {
        console.error('Error loading contacts:', err)
        setError(err.message)
        setContacts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  const filteredContacts = useMemo(() => {
    let list = contacts
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(c => {
        const name    = (c.name  || '').toLowerCase()
        const company = (c.label || c.company || '').toLowerCase()
        return name.includes(q) || company.includes(q)
      })
    }
    if (roleFilter !== 'all') {
      list = list.filter(c => getContactRoleType(c) === roleFilter)
    }
    return list
  }, [contacts, searchQuery, roleFilter])

  function openCreate() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function openEdit(contact) {
    setSelectedContact(null)
    setEditingContact(contact)
    setFormOpen(true)
  }

  function handleSaved(savedContact, isEdit) {
    if (isEdit) {
      setContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c))
    } else {
      setContacts(prev =>
        [...prev, savedContact].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      )
    }
  }

  function handleDeleted(contactId) {
    setContacts(prev => prev.filter(c => c.id !== contactId))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-lg font-medium mb-2">Could not load contacts</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Contacts</h1>
              <p className="text-gray-400">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your CRM
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors shadow"
            >
              <span className="text-lg leading-none">+</span> New Contact
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or company/label…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500 text-sm font-medium">Filter:</span>
              {[
                { value: 'all',   label: 'All' },
                { value: 'label', label: 'Label' },
                { value: 'promo', label: 'Promo' },
                { value: 'other', label: 'Other' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRoleFilter(value)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                    roleFilter === value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-lg bg-gray-700/60 animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📇</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No contacts yet</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Add contacts to your submissions, or create one directly here.
            </p>
            <button
              onClick={openCreate}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              + New Contact
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No contacts match your search</h2>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg overflow-hidden">
            {filteredContacts.map((contact, idx) => {
              const roleType = getContactRoleType(contact)
              const company  = contact.label || contact.company || ''
              return (
                <div
                  key={contact.id || contact.name + idx}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-700/80 last:border-b-0 hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    onClick={() => setSelectedContact(contact)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer ${AVATAR_STYLES[roleType]}`}
                  >
                    {getInitials(contact.name)}
                  </div>

                  {/* Name + company */}
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {contact.name}
                    </p>
                    {company && <p className="text-sm text-gray-500 truncate">{company}</p>}
                  </button>

                  {/* Role badge */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLES[roleType]}`}>
                      {contact.role || 'Other'}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="hidden md:block flex-shrink-0 w-40">
                    <p className="text-sm text-gray-500 truncate" title={contact.email}>
                      {contact.email || '—'}
                    </p>
                  </div>

                  {/* Source links (capped at 3) */}
                  <div className="flex-shrink-0 hidden lg:flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                    {(contact.sources || []).slice(0, 3).map((s, i) => (
                      <Link
                        key={s.entryId || i}
                        href={s.sourceHref}
                        onClick={e => e.stopPropagation()}
                        className="px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 truncate max-w-[80px]"
                        title={s.sourceName}
                      >
                        {s.sourceName}
                      </Link>
                    ))}
                    {(contact.sources || []).length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{contact.sources.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Edit button (appears on hover) */}
                  <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(contact) }}
                      className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs transition-colors"
                      title="Edit contact"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <ContactDetailModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={openEdit}
        onDelete={handleDeleted}
      />

      {/* Create / Edit form modal */}
      <ContactFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        editingContact={editingContact}
      />
    </div>
  )
}
