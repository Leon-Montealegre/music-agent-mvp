'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { fetchAllContacts } from '@/lib/contacts'
import Modal from '@/components/Modal'

const LABEL_ROLES = ['A&R', 'Label Owner', 'Label Manager', 'Marketing', 'Label']
const PROMO_ROLES = ['Blog Owner', 'Playlist Curator', 'Channel Owner', 'PR Manager', 'Promo']
const OTHER_ROLES = ['Artist', 'Booking Agent', 'Other']

function getContactRoleType(contact) {
  const role = (contact.role || '').trim()
  if (LABEL_ROLES.some(r => role.toLowerCase() === r.toLowerCase())) return 'label'
  if (PROMO_ROLES.some(r => role.toLowerCase() === r.toLowerCase())) return 'promo'
  return 'other'
}

function getInitials(name) {
  if (!name || !name.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  }
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)

  useEffect(() => {
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
  }, [])

  const filteredContacts = useMemo(() => {
    let list = contacts
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(c => {
        const name = (c.name || '').toLowerCase()
        const company = (c.label || c.company || '').toLowerCase()
        return name.includes(q) || company.includes(q)
      })
    }
    if (roleFilter !== 'all') {
      list = list.filter(c => getContactRoleType(c) === roleFilter)
    }
    return list
  }, [contacts, searchQuery, roleFilter])

  const totalCount = contacts.length

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
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Contacts</h1>
            <p className="text-gray-400">
              {totalCount} contact{totalCount !== 1 ? 's' : ''} across your catalogue
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or company/label..."
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
                { value: 'all', label: 'All' },
                { value: 'label', label: 'Label' },
                { value: 'promo', label: 'Promo' },
                { value: 'other', label: 'Other' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRoleFilter(value)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                    roleFilter === value ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              <div
                key={i}
                className="h-10 w-full rounded-lg bg-gray-700/60 animate-pulse"
              />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📇</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No contacts yet</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Add contacts to your label submissions and promo entries to see them here.
            </p>
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
              const company = contact.label || contact.company || ''
              return (
                <div
                  key={contact.name + idx}
                  onClick={() => setSelectedContact(contact)}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-700/80 last:border-b-0 cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${AVATAR_STYLES[roleType]}`}>
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{contact.name}</p>
                    {company && <p className="text-sm text-gray-500 truncate">{company}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLES[roleType]}`}>
                      {contact.role || 'Other'}
                    </span>
                  </div>
                  <div className="hidden md:block flex-shrink-0 w-40">
                    <p className="text-sm text-gray-500 truncate" title={contact.email}>
                      {contact.email || '—'}
                    </p>
                  </div>
                  <div className="hidden lg:block flex-shrink-0 w-28">
                    <p className="text-sm text-gray-500 truncate">{contact.phone || '—'}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                    {(contact.sources || []).slice(0, 3).map((s, i) => (
                      <Link
                        key={i}
                        href={s.sourceHref}
                        onClick={e => e.stopPropagation()}
                        className="px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 truncate max-w-[80px]"
                      >
                        {s.sourceName}
                      </Link>
                    ))}
                    {(contact.sources || []).length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{(contact.sources || []).length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact?.name || 'Contact'}
      >
        {selectedContact && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">{selectedContact.name}</h3>
              <dl className="space-y-2 text-sm">
                {(selectedContact.label || selectedContact.company) && (
                  <div>
                    <dt className="text-gray-500">Company / Label</dt>
                    <dd className="text-gray-200">{selectedContact.label || selectedContact.company}</dd>
                  </div>
                )}
                {selectedContact.email && (
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd>
                      <a href={`mailto:${selectedContact.email}`} className="text-purple-400 hover:underline">
                        {selectedContact.email}
                      </a>
                    </dd>
                  </div>
                )}
                {selectedContact.phone && (
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd>
                      <a href={`tel:${selectedContact.phone}`} className="text-purple-400 hover:underline">
                        {selectedContact.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {selectedContact.location && (
                  <div>
                    <dt className="text-gray-500">Location</dt>
                    <dd className="text-gray-200">{selectedContact.location}</dd>
                  </div>
                )}
                {selectedContact.role && (
                  <div>
                    <dt className="text-gray-500">Role</dt>
                    <dd className="text-gray-200">{selectedContact.role}</dd>
                  </div>
                )}
                {selectedContact.notes && (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="text-gray-200">{selectedContact.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {(selectedContact.sources || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Linked to</h4>
                <ul className="space-y-1">
                  {selectedContact.sources.map((s, i) => (
                    <li key={i}>
                      <Link
                        href={s.sourceHref}
                        className="text-purple-400 hover:underline"
                      >
                        {s.sourceName} ({s.sourceType})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
