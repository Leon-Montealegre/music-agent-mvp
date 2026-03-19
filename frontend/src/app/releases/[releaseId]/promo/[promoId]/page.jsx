'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchPromoEntry, fetchRelease, apiFetch, API_BASE_URL } from '@/lib/api'
import Modal from '@/components/Modal'
import LabelContactForm from '@/components/LabelContactForm'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import FileAttachments from '@/components/FileAttachments'

export default function PromoEntryPage({ params }) {
  const unwrappedParams = use(params)
  const releaseId = unwrappedParams.releaseId
  const promoId = unwrappedParams.promoId
  const router = useRouter()

  const [track, setTrack] = useState(null)
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  // Details card state
  const [detailsForm, setDetailsForm] = useState({
    promoName: '',
    status: 'Pending',
    liveDate: '',
    platform: '',
    notes: ''
  })
  const [savingDetails, setSavingDetails] = useState(false)

  // Contacts
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false)

  // Page notes
  const [pageNotes, setPageNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Bottom action bar
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false)

  const apiBase = `${API_BASE_URL}/releases/${releaseId}`

  async function loadData() {
    try {
      setLoading(true)
      const [releaseRes, promoRes] = await Promise.all([
        fetchRelease(releaseId),
        fetchPromoEntry(releaseId, promoId)
      ])
      const release = releaseRes.release || releaseRes
      const fetchedEntry = promoRes.entry

      setTrack(release)
      setEntry(fetchedEntry)

      setDetailsForm({
        promoName: fetchedEntry.promoName || '',
        status: fetchedEntry.status || 'Pending',
        liveDate: fetchedEntry.liveDate ? fetchedEntry.liveDate.slice(0, 10) : '',
        platform: fetchedEntry.platform || '',
        notes: fetchedEntry.notes || ''
      })

      setPageNotes(fetchedEntry.pageNotes || '')
    } catch (err) {
      console.error('Error loading promo entry page:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [releaseId, promoId])

  const handleSaveDetails = async () => {
    if (!detailsForm.promoName.trim()) {
      alert('Promo Name is required')
      return
    }
    setSavingDetails(true)
    try {
      const payload = {
        promoName: detailsForm.promoName.trim(),
        status: detailsForm.status,
        platform: detailsForm.platform,
        notes: detailsForm.notes
      }
      if (detailsForm.status === 'Live' && detailsForm.liveDate) {
        payload.liveDate = detailsForm.liveDate
      } else {
        payload.liveDate = null
      }

      const res = await apiFetch(`${apiBase}/promo/${promoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save promo details')

      setEntry(data.entry)
      setDetailsForm({
        promoName: data.entry.promoName || '',
        status: data.entry.status || 'Pending',
        liveDate: data.entry.liveDate ? data.entry.liveDate.slice(0, 10) : '',
        platform: data.entry.platform || '',
        notes: data.entry.notes || ''
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Error saving promo details:', err)
      alert(`Failed to save promo details: ${err.message}`)
    } finally {
      setSavingDetails(false)
    }
  }

  const handleSavePageNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await apiFetch(`${apiBase}/promo/${promoId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: pageNotes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save notes')
      setEntry(prev => prev ? { ...prev, pageNotes: data.notes } : prev)
    } catch (err) {
      console.error('Error saving promo notes:', err)
      alert(`Failed to save notes: ${err.message}`)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleContactSuccess = () => {
    setShowContactModal(false)
    setEditingContact(null)
    loadData()
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    try {
      const res = await apiFetch(
        `${apiBase}/promo/${promoId}/contacts/${contactToDelete.id}`,
        { method: 'DELETE' }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete contact')
      setShowDeleteContactModal(false)
      setContactToDelete(null)
      loadData()
    } catch (err) {
      console.error('Error deleting contact:', err)
      alert(`Failed to delete contact: ${err.message}`)
    }
  }

  const handleDeleteEntry = async () => {
    try {
      const res = await apiFetch(`${apiBase}/promo/${promoId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete entry')
      router.push(`/releases/${releaseId}`)
    } catch (err) {
      console.error('Error deleting promo entry:', err)
      alert(`Failed to delete entry: ${err.message}`)
    }
  }

  if (loading || !track || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-300">Loading promo entry...</p>
        </div>
      </div>
    )
  }

  const metadata = track.metadata || track
  const status = (entry.status || 'Pending').toLowerCase()
  let statusClasses = 'bg-gray-700/60 border border-gray-500/60 text-gray-200'
  if (status === 'live') statusClasses = 'bg-green-500/20 border border-green-400/60 text-green-200'
  else if (status === 'completed') statusClasses = 'bg-gray-600/40 border border-gray-400/60 text-gray-100'
  else if (status === 'pending' || status === 'scheduled') statusClasses = 'bg-yellow-500/20 border border-yellow-400/60 text-yellow-200'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">
          {entry.promoName || entry.platform || ''} Promo Details
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Promo Details (read-only) */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Promo Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Promo Name</p>
                  <p className="text-sm font-medium text-gray-200">{entry.promoName || entry.platform || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${statusClasses}`}>
                    {entry.status || 'Pending'}
                  </span>
                </div>

                {entry.liveDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Live Date</p>
                    <p className="text-sm font-medium text-gray-200">
                      {new Date(entry.liveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {entry.platform && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Platform / Type</p>
                    <p className="text-sm font-medium text-gray-200">{entry.platform}</p>
                  </div>
                )}

                {entry.timestamp && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Logged</p>
                    <p className="text-sm text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Contacts, Files, Notes */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contacts */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">Contacts</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    People involved with this promo campaign
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingContact(null)
                    setShowContactModal(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium text-sm"
                >
                  + Add Contact
                </button>
              </div>
              <div className="p-6">
                {(entry.contacts || []).length > 0 ? (
                  <div className="space-y-4">
                    {entry.contacts.map(contact => (
                      <div key={contact.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Name</p>
                            <p className="text-gray-200 font-medium">{contact.name}</p>
                          </div>
                          {contact.role && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Role</p>
                              <p className="text-gray-200 text-sm">{contact.role}</p>
                            </div>
                          )}
                          {contact.email && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-purple-400 hover:text-purple-300 text-sm"
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                              <p className="text-gray-200 text-sm">{contact.phone}</p>
                            </div>
                          )}
                          {contact.location && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</p>
                              <p className="text-gray-200 text-sm">{contact.location}</p>
                            </div>
                          )}
                          {contact.notes && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                              <p className="text-gray-300 text-sm italic">{contact.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                          <button
                            onClick={() => {
                              setEditingContact(contact)
                              setShowContactModal(true)
                            }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-all font-medium text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              setContactToDelete(contact)
                              setShowDeleteContactModal(true)
                            }}
                            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No contacts added yet</p>
                    <button
                      onClick={() => {
                        setEditingContact(null)
                        setShowContactModal(true)
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-all font-medium"
                    >
                      + Add First Contact
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Page notes */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Notes</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Use this space to track anything relevant — pricing agreed, next follow-up date, what was promised, special requirements.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  value={pageNotes}
                  onChange={e => setPageNotes(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Use this space to track anything relevant — pricing agreed, next follow-up date, what was promised, special requirements."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePageNotes}
                    disabled={savingNotes}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {savingNotes ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Files */}
            <FileAttachments
              filesUrl={`${apiBase}/promo/${promoId}/files`}
              files={entry.documents || []}
              onFilesChange={docs => setEntry(prev => prev ? { ...prev, documents: docs } : prev)}
              title="Files"
              description="Contracts, confirmations, and other files related to this promo"
            />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm"
          >
            ✏️ Edit Entry
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteEntryModal(true)}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-all font-medium text-sm"
          >
            🗑️ Delete Entry
          </button>
        </div>
      </div>

      {/* Contact modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setEditingContact(null)
        }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <LabelContactForm
          releaseId={releaseId}
          labelName=""
          existingContact={editingContact}
          onSuccess={handleContactSuccess}
          onCancel={() => {
            setShowContactModal(false)
            setEditingContact(null)
          }}
          contactPath={`promo/${promoId}/contacts`}
        />
      </Modal>

      {/* Delete contact confirmation */}
      <ConfirmDeleteModal
        isOpen={showDeleteContactModal}
        onClose={() => {
          setShowDeleteContactModal(false)
          setContactToDelete(null)
        }}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        itemName={contactToDelete?.name}
      />

      {/* Edit Entry modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Promo Entry"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Promo Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={detailsForm.promoName}
              onChange={e => setDetailsForm({ ...detailsForm, promoName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select
              value={detailsForm.status}
              onChange={e => setDetailsForm({ ...detailsForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option>Pending</option>
              <option>Scheduled</option>
              <option>Live</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Live Date</label>
            <input
              type="date"
              value={detailsForm.liveDate}
              onChange={e => setDetailsForm({ ...detailsForm, liveDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Platform / Type</label>
            <input
              type="text"
              value={detailsForm.platform}
              onChange={e => setDetailsForm({ ...detailsForm, platform: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <textarea
              value={detailsForm.notes}
              onChange={e => setDetailsForm({ ...detailsForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await handleSaveDetails()
                setShowEditModal(false)
              }}
              disabled={savingDetails}
              className="flex-1 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {savingDetails ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete entry confirmation */}
      <ConfirmDeleteModal
        isOpen={showDeleteEntryModal}
        onClose={() => setShowDeleteEntryModal(false)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry"
        message="Are you sure you want to delete this promo entry? This action cannot be undone."
        itemName={entry.promoName || entry.platform || promoId}
      />
    </div>
  )
}

