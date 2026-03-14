'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchCollectionPromoEntry } from '@/lib/api'
import Modal from '@/components/Modal'
import LabelContactForm from '@/components/LabelContactForm'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

export default function CollectionPromoEntryPage({ params }) {
  const unwrappedParams = use(params)
  const collectionId = unwrappedParams.collectionId
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

  // Documents
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Page notes
  const [pageNotes, setPageNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Bottom action bar
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false)

  const apiBase = `http://localhost:3001/collections/${collectionId}`

  async function loadData() {
    try {
      setLoading(true)
      const [colData, promoRes] = await Promise.all([
        fetch(apiBase).then(r => r.json()),
        fetchCollectionPromoEntry(collectionId, promoId)
      ])
      const collection = colData.collection || colData
      const fetchedEntry = promoRes.entry

      setTrack(collection)
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
  }, [collectionId, promoId])

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

      const res = await fetch(`${apiBase}/promo/${promoId}`, {
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
    } catch (err) {
      console.error('Error saving promo details:', err)
      alert(`Failed to save promo details: ${err.message}`)
    } finally {
      setSavingDetails(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${apiBase}/promo/${promoId}/files`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload file')
      setEntry(prev => prev ? { ...prev, documents: data.documents || [] } : prev)
    } catch (err) {
      console.error('Error uploading promo document:', err)
      alert(`Failed to upload: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFileUpload(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleDeleteFile = async (filename) => {
    try {
      const res = await fetch(
        `${apiBase}/promo/${promoId}/files/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete file')
      setEntry(prev => prev ? { ...prev, documents: data.documents || [] } : prev)
    } catch (err) {
      console.error('Error deleting promo document:', err)
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const handleDownloadFile = (filename) => {
    const url = `${apiBase}/promo/${promoId}/files/${encodeURIComponent(filename)}`
    window.open(url, '_blank')
  }

  const handleSavePageNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`${apiBase}/promo/${promoId}/notes`, {
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
      const res = await fetch(
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
      const res = await fetch(`${apiBase}/promo/${promoId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete entry')
      router.push(`/collections/${collectionId}`)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div />
          <button
            onClick={() => router.push(`/collections/${collectionId}`)}
            className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-100">
                  {entry.promoName || entry.platform || 'Promo Entry'}
                </h1>
                <span className={`px-3 py-1 rounded-md text-sm font-semibold ${statusClasses}`}>
                  {entry.status || 'Pending'}
                </span>
              </div>
              <p className="text-gray-300">
                {metadata.title} • {metadata.artist}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">
          {(metadata.collectionType || '')} Promotion Details
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

            {/* Documents */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Upload Files</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Contracts, confirmations, and other files related to this promo
                </p>
              </div>
              <div className="p-6">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    id="promo-file-input"
                    type="file"
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  />
                  {uploading ? (
                    <div>
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2" />
                      <p className="text-gray-400">Uploading...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📎</div>
                      <p className="text-gray-300 mb-2">Drag and drop files here</p>
                      <p className="text-gray-500 text-sm mb-4">or</p>
                      <label
                        htmlFor="promo-file-input"
                        className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        Browse Files
                      </label>
                      <p className="text-xs text-gray-500 mt-3">
                        Supports: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP
                      </p>
                    </div>
                  )}
                </div>

                {(entry.documents || []).length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="font-medium text-gray-300 mb-3">
                      Uploaded Files ({entry.documents.length})
                    </h3>
                    {entry.documents.map(doc => (
                      <div
                        key={doc.filename}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 font-medium truncate">{doc.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB •{' '}
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleDownloadFile(doc.filename)}
                            className="text-purple-400 hover:text-purple-300 px-3 py-1 text-sm transition-colors"
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => handleDeleteFile(doc.filename)}
                            className="text-red-400 hover:text-red-300 px-3 py-1 text-sm transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
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
          baseUrl={apiBase}
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
