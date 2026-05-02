'use client'
import Breadcrumb from '@/components/Breadcrumb'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { fetchLabelEntry, fetchRelease, apiFetch, API_BASE_URL } from '@/lib/api'
import { fetchAllContacts } from '@/lib/contacts'
import Modal from '@/components/Modal'
import ContactPicker from '@/components/ContactPicker'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'
import FileAttachments from '@/components/FileAttachments'

// helper: today as YYYY-MM-DD
function todayStr() { return new Date().toISOString().split('T')[0] }
// helper: date N days from today as YYYY-MM-DD
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]
}

export default function LabelEntryPage({ params }) {
  const { data: session } = useSession()
  const unwrappedParams = use(params)
  const releaseId = unwrappedParams.releaseId
  const labelId = unwrappedParams.labelId
  const router = useRouter()

  const [track, setTrack] = useState(null)
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allContacts, setAllContacts] = useState([])

  const [detailsForm, setDetailsForm] = useState({
    label: '',
    platform: '',
    status: 'Submitted',
    signedDate: '',
    notes: '',
    followUpDate: '',
  })
  const [followUpPromptDismissed, setFollowUpPromptDismissed] = useState(false)
  const [snoozing, setSnoozing] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  // Edit-modal follow-up helpers
  const [editFollowUpDays, setEditFollowUpDays] = useState(10)
  const [editFollowUpEnabled, setEditFollowUpEnabled] = useState(false)

  // Sidebar follow-up date editing
  const [sidebarFollowUpInput, setSidebarFollowUpInput] = useState('')
  const [sidebarReminderEnabled, setSidebarReminderEnabled] = useState(false)

  const [showContactPicker, setShowContactPicker] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [editContactForm, setEditContactForm] = useState({})
  const [savingContact, setSavingContact] = useState(false)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false)

  const [pageNotes, setPageNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false)

  const apiBase = `${API_BASE_URL}/releases/${releaseId}`

  async function loadData() {
    try {
      setLoading(true)
      const [releaseRes, labelRes] = await Promise.all([
        fetchRelease(releaseId),
        fetchLabelEntry(releaseId, labelId),
      ])
      const release = releaseRes.release || releaseRes
      const fetchedEntry = labelRes.entry

      setTrack(release)
      const normalizedEntry = {
        ...fetchedEntry,
        followUpDate: fetchedEntry.followUpDate ? fetchedEntry.followUpDate.slice(0, 10) : null,
        signedDate: fetchedEntry.signedDate ? fetchedEntry.signedDate.slice(0, 10) : null,
      }
      setEntry(normalizedEntry)
      setDetailsForm({
        label: normalizedEntry.label || normalizedEntry.labelName || '',
        platform: normalizedEntry.platform || '',
        status: normalizedEntry.status || 'Submitted',
        signedDate: normalizedEntry.signedDate || '',
        notes: normalizedEntry.notes || '',
        followUpDate: normalizedEntry.followUpDate || '',
      })
      setPageNotes(fetchedEntry.pageNotes || '')
    } catch (err) {
      console.error('Error loading label entry page:', err)
    } finally {
      setLoading(false)
    }
    // Load contacts separately so a contacts failure never blocks the page from rendering
    try {
      const contactsData = await fetchAllContacts()
      setAllContacts(Array.isArray(contactsData) ? contactsData : [])
    } catch (err) {
      console.error('Could not load contacts list (search will be empty):', err)
    }
  }

  useEffect(() => {
    if (session?.token) loadData()
  }, [releaseId, labelId, session])

  // Keep sidebar date input and checkbox in sync with entry
  useEffect(() => {
    setSidebarFollowUpInput(entry?.followUpDate || '')
    setSidebarReminderEnabled(!!entry?.followUpDate)
  }, [entry?.followUpDate])

  const handleSaveDetails = async () => {
    if (!detailsForm.label.trim()) {
      alert('Label name is required')
      return
    }
    setSavingDetails(true)
    try {
      const payload = {
        label: detailsForm.label.trim(),
        platform: detailsForm.platform,
        status: detailsForm.status,
        notes: detailsForm.notes,
        followUpDate: detailsForm.followUpDate || null,
      }
      if (detailsForm.status === 'Signed' && detailsForm.signedDate) {
        payload.signedDate = detailsForm.signedDate
      } else {
        payload.signedDate = null
      }

      const res = await apiFetch(`${apiBase}/label/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save label details')

      // Normalize dates to YYYY-MM-DD to prevent "Invalid Date" in the sidebar
      const savedEntry = {
        ...data.entry,
        followUpDate: data.entry.followUpDate ? data.entry.followUpDate.slice(0, 10) : null,
        signedDate: data.entry.signedDate ? data.entry.signedDate.slice(0, 10) : null,
      }
      setEntry(savedEntry)
      setDetailsForm({
        label: savedEntry.label || savedEntry.labelName || '',
        platform: savedEntry.platform || '',
        status: savedEntry.status || 'Submitted',
        signedDate: savedEntry.signedDate || '',
        notes: savedEntry.notes || '',
        followUpDate: savedEntry.followUpDate || '',
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Error saving label details:', err)
      alert(`Failed to save label details: ${err.message}`)
    } finally {
      setSavingDetails(false)
    }
  }

  // Set follow-up date N days from today (used for both the initial prompt and snooze)
  const handleSetFollowUp = async (days = 10) => {
    setSnoozing(true)
    try {
      const newDate = daysFromNow(days)
      const res = await apiFetch(`${apiBase}/label/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: newDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to set follow-up')
      setEntry(prev => ({ ...prev, followUpDate: newDate }))
      setDetailsForm(prev => ({ ...prev, followUpDate: newDate }))
      setFollowUpPromptDismissed(false)
    } catch (err) {
      console.error(err)
      alert(`Could not set follow-up: ${err.message}`)
    } finally {
      setSnoozing(false)
    }
  }

  // Directly save a new follow-up date chosen from the sidebar date picker
  const handleSidebarSaveFollowUp = async (newDate) => {
    if (!newDate) return
    setSnoozing(true)
    try {
      const res = await apiFetch(`${apiBase}/label/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: newDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update follow-up date')
      setEntry(prev => ({ ...prev, followUpDate: newDate }))
      setDetailsForm(prev => ({ ...prev, followUpDate: newDate }))
    } catch (err) {
      console.error(err)
      alert(`Could not update follow-up date: ${err.message}`)
    } finally {
      setSnoozing(false)
    }
  }

  // Clear the follow-up date entirely (called when unchecking the sidebar checkbox)
  const handleSidebarClearFollowUp = async () => {
    setSnoozing(true)
    try {
      const res = await apiFetch(`${apiBase}/label/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to clear follow-up date')
      setEntry(prev => ({ ...prev, followUpDate: null }))
      setDetailsForm(prev => ({ ...prev, followUpDate: '' }))
      setSidebarFollowUpInput('')
      setSidebarReminderEnabled(false)
    } catch (err) {
      console.error(err)
      alert(`Could not clear follow-up date: ${err.message}`)
      setSidebarReminderEnabled(true) // revert checkbox on failure
    } finally {
      setSnoozing(false)
    }
  }

  const handleSavePageNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await apiFetch(`${apiBase}/label/${labelId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: pageNotes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save notes')
      setEntry(prev => prev ? { ...prev, pageNotes: data.notes } : prev)
    } catch (err) {
      console.error('Error saving label notes:', err)
      alert(`Failed to save notes: ${err.message}`)
    } finally {
      setSavingNotes(false)
    }
  }

  // ContactPicker calls this when the user picks or creates a contact.
  // It receives either { contactId } or { name, email, role, ... }
  const handlePickContact = async (selection) => {
    try {
      const res = await apiFetch(`${apiBase}/label/${labelId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add contact')
      // Refresh entry contacts and the global contact list
      await loadData()
      setShowContactPicker(false)
    } catch (err) {
      console.error('Error adding contact:', err)
      alert(`Failed to add contact: ${err.message}`)
    }
  }

  // Edit an existing linked contact (updates the shared contact row everywhere)
  const handleSaveEditContact = async () => {
    if (!editContactForm.name?.trim()) return
    setSavingContact(true)
    try {
      const res = await apiFetch(`${API_BASE_URL}/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContactForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update contact')
      // Refresh to pick up the updated contact data
      await loadData()
      setEditingContact(null)
    } catch (err) {
      console.error('Error updating contact:', err)
      alert(`Failed to update contact: ${err.message}`)
    } finally {
      setSavingContact(false)
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    try {
      const res = await apiFetch(
        `${apiBase}/label/${labelId}/contacts/${contactToDelete.id}`,
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
      const res = await apiFetch(`${apiBase}/label/${labelId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete entry')
      router.push(`/releases/${releaseId}`)
    } catch (err) {
      console.error('Error deleting label entry:', err)
      alert(`Failed to delete entry: ${err.message}`)
    }
  }

  if (loading || !track || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-300">Loading label entry...</p>
        </div>
      </div>
    )
  }

  const metadata = track.metadata || track
  const status = (entry.status || 'Submitted').toLowerCase()
  let statusClasses = 'bg-gray-700/60 border border-gray-500/60 text-gray-200'
  if (status === 'signed') statusClasses = 'bg-green-500/20 border border-green-400/60 text-green-200'
  else if (status === 'completed') statusClasses = 'bg-gray-600/40 border border-gray-400/60 text-gray-100'
  else if (status === 'pending' || status === 'submitted') statusClasses = 'bg-yellow-500/20 border border-yellow-400/60 text-yellow-200'

  const isOverdue = entry.followUpDate && new Date(entry.followUpDate.slice(0, 10) + 'T23:59:59') < new Date()
  const showFollowUpPrompt = (entry.status || '').toLowerCase() === 'submitted'
    && !entry.followUpDate
    && !followUpPromptDismissed
  const labelTitle = entry.label || entry.labelName || 'Label Deal'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 -mx-4 px-4 pt-4 pb-5 mb-6">
        <Breadcrumb crumbs={[
          { label: 'Catalogue', href: '/' },
          { label: metadata.title, href: `/releases/${releaseId}` },
          { label: labelTitle },
        ]} />
        <h2 className="text-2xl font-bold text-gray-100">
          {labelTitle} Label Details
        </h2>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Label Details (read-only) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Label Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Label Name</p>
                  <p className="text-sm font-medium text-gray-200">{entry.label || entry.labelName || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Deal Status</p>
                  <span className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${statusClasses}`}>
                    {entry.status || 'Submitted'}
                  </span>
                </div>

                {/* Follow-up reminder — unified block, always shown when Submitted */}
                {entry.status?.toLowerCase() === 'submitted' && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
                    {/* Header row: label + checkbox */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-purple-300 font-medium">📅 Follow-up Reminder</p>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sidebarReminderEnabled}
                          disabled={snoozing}
                          onChange={e => {
                            if (e.target.checked) {
                              setSidebarReminderEnabled(true)
                              if (!sidebarFollowUpInput) setSidebarFollowUpInput(daysFromNow(10))
                            } else {
                              handleSidebarClearFollowUp()
                            }
                          }}
                          className="accent-purple-500 w-4 h-4"
                        />
                        <span className="text-xs text-gray-400">Set reminder</span>
                      </label>
                    </div>

                    {sidebarReminderEnabled ? (
                      <>
                        {/* Current saved date */}
                        {entry.followUpDate && (
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-gray-200'}`}>
                            {isOverdue ? '⚠️ Overdue · ' : ''}
                            {new Date(entry.followUpDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}

                        {/* Inline date picker */}
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={sidebarFollowUpInput}
                            onChange={e => setSidebarFollowUpInput(e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 text-gray-100 rounded text-xs focus:ring-1 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleSidebarSaveFollowUp(sidebarFollowUpInput)}
                            disabled={snoozing || !sidebarFollowUpInput || sidebarFollowUpInput === (entry.followUpDate || '').slice(0, 10)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs rounded transition-colors whitespace-nowrap"
                          >
                            {snoozing ? '…' : entry.followUpDate ? 'Update' : 'Set'}
                          </button>
                        </div>

                        {/* Snooze shortcut — only when overdue */}
                        {isOverdue && (
                          <button
                            onClick={() => handleSetFollowUp(10)}
                            disabled={snoozing}
                            className="w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-xs rounded-md transition-colors"
                          >
                            {snoozing ? 'Snoozing…' : '💤 Snooze 10 days'}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No reminder set</p>
                    )}
                  </div>
                )}

                {entry.signedDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Signature Date</p>
                    <p className="text-sm font-medium text-gray-200">
                      {new Date(entry.signedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {entry.platform && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Submitted via</p>
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
                  <h2 className="text-xl font-semibold text-gray-100">Label Contacts</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Key people involved in this label discussion
                  </p>
                </div>
                <button
                  onClick={() => setShowContactPicker(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium text-sm"
                >
                  + Add Contact
                </button>
              </div>

              {/* Inline ContactPicker — visible when Add Contact is clicked */}
              {showContactPicker && (
                <div className="border-b border-gray-700 bg-gray-900/40">
                  <ContactPicker
                    contacts={allContacts}
                    onSelect={handlePickContact}
                    onCancel={() => setShowContactPicker(false)}
                    labelName={detailsForm.label}
                    entryType="label"
                  />
                </div>
              )}

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
                              setEditContactForm({
                                name: contact.name || '',
                                email: contact.email || '',
                                role: contact.role || '',
                                label: contact.label || '',
                                phone: contact.phone || '',
                                location: contact.location || '',
                                notes: contact.notes || '',
                              })
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
                ) : !showContactPicker ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No contacts added yet</p>
                    <button
                      onClick={() => setShowContactPicker(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-all font-medium"
                    >
                      + Add First Contact
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Page notes */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">Notes</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Track any important context here — what was discussed, timeline expectations, key contacts reached out to, next steps.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  value={pageNotes}
                  onChange={e => setPageNotes(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Track any important context here — what was discussed, timeline expectations, key contacts reached out to, next steps."
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
              filesUrl={`${apiBase}/label/${labelId}/files`}
              files={entry.documents || []}
              onFilesChange={docs => setEntry(prev => prev ? { ...prev, documents: docs } : prev)}
              title="Files"
              description="Contracts, riders, and other deal documents"
            />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setEditFollowUpEnabled(false)
              setShowEditModal(true)
            }}
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

      {/* Edit contact modal */}
      {editingContact && (
        <Modal
          isOpen={!!editingContact}
          onClose={() => setEditingContact(null)}
          title="Edit Contact"
        >
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-400">
              Editing this contact updates it everywhere it appears in your submissions.
            </p>
            {[
              { key: 'name', label: 'Name', required: true, placeholder: 'Sophie Joe' },
              { key: 'email', label: 'Email', placeholder: 'sophie@label.com', type: 'email' },
              { key: 'label', label: 'Label / Company', placeholder: 'e.g. Sojoe Studios' },
              { key: 'phone', label: 'Phone', placeholder: '+44 7700 900000' },
              { key: 'location', label: 'Location', placeholder: 'Amsterdam' },
            ].map(({ key, label, required, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input
                  type={type || 'text'}
                  value={editContactForm[key] || ''}
                  onChange={e => setEditContactForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
              <select
                value={editContactForm.role || ''}
                onChange={e => setEditContactForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">— pick —</option>
                {['A&R','Label Owner','Label Manager','Marketing','Label','Blog Owner','Playlist Curator','Channel Owner','PR Manager','Promo','Artist','Booking Agent','Other'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
              <textarea
                value={editContactForm.notes || ''}
                onChange={e => setEditContactForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Met at ADE 2025…"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveEditContact}
                disabled={!editContactForm.name?.trim() || savingContact}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {savingContact ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingContact(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

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
        title="Edit Label Entry"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Label Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={detailsForm.label}
              onChange={e => setDetailsForm({ ...detailsForm, label: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Submitted via</label>
            <select
              value={detailsForm.platform}
              onChange={e => setDetailsForm({ ...detailsForm, platform: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select platform</option>
              <option value="LabelRadar">LabelRadar</option>
              <option value="Email">Email</option>
              <option value="Website">Website</option>
              <option value="SubmitHub">SubmitHub</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Deal Status</label>
            <select
              value={detailsForm.status}
              onChange={e => setDetailsForm({ ...detailsForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option>Submitted</option>
              <option>Signed</option>
              <option>Cancelled</option>
            </select>
          </div>
          {detailsForm.status === 'Signed' && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Signed Date</label>
              <input
                type="date"
                value={detailsForm.signedDate || new Date().toISOString().split('T')[0]}
                onChange={e => setDetailsForm({ ...detailsForm, signedDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Follow-up Date — only relevant when Submitted */}
          {detailsForm.status === 'Submitted' && (
            <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-300 font-medium">📅 Follow-up reminder</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editFollowUpEnabled}
                    onChange={e => {
                      setEditFollowUpEnabled(e.target.checked)
                      if (e.target.checked) {
                        // If there's already a date, keep it; otherwise set a default
                        if (!detailsForm.followUpDate) {
                          setDetailsForm(prev => ({ ...prev, followUpDate: daysFromNow(editFollowUpDays) }))
                        }
                      } else {
                        setDetailsForm(prev => ({ ...prev, followUpDate: '' }))
                      }
                    }}
                    className="accent-purple-500 w-4 h-4"
                  />
                  <span className="text-xs text-gray-400">Set reminder</span>
                </label>
              </div>
              {editFollowUpEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 whitespace-nowrap">Follow up in</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={editFollowUpDays}
                      onChange={e => {
                        const days = Math.max(1, Math.min(365, parseInt(e.target.value) || 1))
                        setEditFollowUpDays(days)
                        setDetailsForm(prev => ({ ...prev, followUpDate: daysFromNow(days) }))
                      }}
                      className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 text-gray-100 rounded text-sm text-center focus:ring-1 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">days</span>
                    <span className="text-xs text-gray-400">
                      ({new Date((detailsForm.followUpDate || '').slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Or pick a specific date:</label>
                    <input
                      type="date"
                      value={detailsForm.followUpDate}
                      onChange={e => {
                        setDetailsForm(prev => ({ ...prev, followUpDate: e.target.value }))
                        if (e.target.value) {
                          const diff = Math.round((new Date(e.target.value + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
                          if (diff > 0) setEditFollowUpDays(diff)
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 text-gray-100 rounded text-sm focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notes</label>
            <textarea
              value={detailsForm.notes}
              onChange={e => setDetailsForm({ ...detailsForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500"
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
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
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
        message="Are you sure you want to delete this label entry? This action cannot be undone."
        itemName={labelTitle}
      />
    </div>
  )
}
