'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/Modal'
import BackButton from '@/components/BackButton'
import LabelContactForm from '@/components/LabelContactForm'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

export default function CollectionLabelDealPage({ params }) {
  const { collectionId } = use(params)
  const router = useRouter()

  const [collection, setCollection]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [showContactModal, setShowContactModal] = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [dragActive, setDragActive]   = useState(false)

  const [showDeleteModal, setShowDeleteModal]   = useState(false)
  const [fileToDelete, setFileToDelete]         = useState(null)
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false)
  const [editingContact, setEditingContact]     = useState(null)
  const [contactToDelete, setContactToDelete]   = useState(null)

  const apiBase = `http://localhost:3001/collections/${collectionId}`

  async function loadCollection() {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}`)
      if (!res.ok) throw new Error('Collection not found')
      const data = await res.json()
      setCollection(data.collection || data)
    } catch (err) {
      console.error('Error loading collection:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCollection() }, [collectionId])

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${apiBase}/label-deal/files`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      await loadCollection()
    } catch (err) {
      alert(`Failed to upload: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDeleteFile = (filename) => {
    setFileToDelete(filename)
    setShowDeleteModal(true)
  }

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    try {
      const res = await fetch(`${apiBase}/label-deal/files/${encodeURIComponent(fileToDelete)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await loadCollection()
      setShowDeleteModal(false)
      setFileToDelete(null)
    } catch (err) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const handleDownloadFile = (filename) => {
    window.open(`${apiBase}/label-deal/files/${encodeURIComponent(filename)}`, '_blank')
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    try {
      const res = await fetch(`${apiBase}/label-deal/contacts/${contactToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete')
      await loadCollection()
      setShowDeleteContactModal(false)
      setContactToDelete(null)
    } catch (err) {
      alert(`Failed to delete contact: ${err.message}`)
    }
  }

  const handleContactSuccess = () => {
    setShowContactModal(false)
    setEditingContact(null)
    loadCollection()
  }

  if (loading || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  const labelInfo = collection.labelInfo || {}
  const contacts  = labelInfo.contacts || []
  const documents = labelInfo.contractDocuments || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                Label Deal — {labelInfo.label || 'Unknown Label'}
              </h1>
              <p className="text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                    collection.collectionType === 'Album'
                      ? 'bg-purple-600/90 border-purple-400/50 text-white'
                      : 'bg-indigo-600/90 border-indigo-400/50 text-white'
                  }`}>{collection.collectionType}</span>
                  {collection.title} • {collection.artist}
                </span>
              </p>
            </div>
            <BackButton href={`/collections/${collectionId}`} label="Back to Collection" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">

            {/* Collection Info */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Collection Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Artist</p>
                  <p className="text-gray-200">{collection.artist}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Title</p>
                  <p className="text-gray-200">{collection.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Type</p>
                  <p className="text-gray-200">{collection.collectionType}</p>
                </div>
                {collection.genre && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Genre</p>
                    <p className="text-gray-200">{collection.genre}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Label Info */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Label Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Label</p>
                  <p className="text-gray-200">{labelInfo.label || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Signed Date</p>
                  <p className="text-gray-200">
                    {labelInfo.signedDate
                      ? new Date(labelInfo.signedDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Label Contacts */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100">Label Contacts</h2>
                    <p className="text-sm text-gray-400 mt-1">Contacts for this label deal</p>
                  </div>
                  <button
                    onClick={() => { setEditingContact(null); setShowContactModal(true) }}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium text-sm"
                  >
                    + Add Contact
                  </button>
                </div>
              </div>
              <div className="p-6">
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact, idx) => (
                      <div key={contact.id || idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Name</p>
                            <p className="text-gray-200 font-medium">{contact.name}</p>
                          </div>
                          {contact.role && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Role</p>
                              <p className="text-gray-200">{contact.role}</p>
                            </div>
                          )}
                          {contact.email && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                              <a href={`mailto:${contact.email}`} className="text-purple-400 hover:text-purple-300 text-sm">
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
                            onClick={() => { setEditingContact(contact); setShowContactModal(true) }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-all font-medium text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => { setContactToDelete(contact); setShowDeleteContactModal(true) }}
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
                      onClick={() => { setEditingContact(null); setShowContactModal(true) }}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-all font-medium"
                    >
                      + Add First Contact
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Documents */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Contract Documents</h2>
                <p className="text-sm text-gray-400 mt-1">Upload contracts, riders, and other deal documents</p>
              </div>
              <div className="p-6">

                {/* Upload Zone */}
                <div
                  onDragEnter={handleDrag} onDragLeave={handleDrag}
                  onDragOver={handleDrag} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input type="file" id="fileInput" onChange={handleFileSelect} className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip" />
                  {uploading ? (
                    <div>
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                      <p className="text-gray-400">Uploading...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📎</div>
                      <p className="text-gray-300 mb-2">Drag and drop files here</p>
                      <p className="text-gray-500 text-sm mb-4">or</p>
                      <label htmlFor="fileInput"
                        className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-all">
                        Browse Files
                      </label>
                      <p className="text-xs text-gray-500 mt-3">Supports: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP</p>
                    </div>
                  )}
                </div>

                {/* File List */}
                {documents.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="font-medium text-gray-300 mb-3">Uploaded Documents ({documents.length})</h3>
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 font-medium truncate">{doc.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button onClick={() => handleDownloadFile(doc.filename)}
                            className="text-purple-400 hover:text-purple-300 px-3 py-1 text-sm transition-colors" title="Download">
                            ⬇️
                          </button>
                          <button onClick={() => handleDeleteFile(doc.filename)}
                            className="text-red-400 hover:text-red-300 px-3 py-1 text-sm transition-colors" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => { setShowContactModal(false); setEditingContact(null) }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <LabelContactForm
          baseUrl={apiBase}
          labelName={labelInfo.label}
          existingContact={editingContact}
          onSuccess={handleContactSuccess}
          onCancel={() => { setShowContactModal(false); setEditingContact(null) }}
        />
      </Modal>

      {/* Delete File Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setFileToDelete(null) }}
        onConfirm={confirmDeleteFile}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        itemName={fileToDelete}
      />

      {/* Delete Contact Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteContactModal}
        onClose={() => { setShowDeleteContactModal(false); setContactToDelete(null) }}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        itemName={contactToDelete?.name}
      />

    </div>
  )
}
