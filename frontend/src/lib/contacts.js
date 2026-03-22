/**
 * CRM aggregation utilities — fetches and aggregates contacts and files
 * from releases and collections using existing APIs. No new backend endpoints.
 */

import { apiFetch, API_BASE_URL } from '@/lib/api'

/**
 * Extract contacts from a release or collection object.
 * Handles both API response shapes (release has distribution/notes; collection has full metadata).
 */
function extractContactsFromItem(item, sourceId, sourceType) {
  const contacts = []
  const sourceName = item.title || item.metadata?.title || 'Untitled'
  const sourceHref = sourceType === 'release' ? `/releases/${sourceId}` : `/collections/${sourceId}`

  // Use metadata for nested structures (releases may have metadata.metadata)
  const meta = item.metadata || item

  // 1. metadata.metadata.labelInfo.contacts[] → role: 'Label'
  const labelContacts = meta.labelInfo?.contacts || []
  for (const c of labelContacts) {
    contacts.push({
      ...c,
      role: c.role || 'Label',
      sourceId,
      sourceName,
      sourceType,
      sourceHref
    })
  }

  // 2. metadata.metadata.promoInfo.contacts[] → role: 'Promo'
  const promoContacts = meta.promoInfo?.contacts || []
  for (const c of promoContacts) {
    contacts.push({
      ...c,
      role: c.role || 'Promo',
      sourceId,
      sourceName,
      sourceType,
      sourceHref
    })
  }

  // 3. metadata.metadata.distribution.submit[].contacts[] → role: 'Label'
  const submitEntries = (item.distribution?.submit || meta.distribution?.submit || [])
  for (const entry of submitEntries) {
    const entryContacts = entry.contacts || []
    for (const c of entryContacts) {
      contacts.push({
        ...c,
        role: c.role || 'Label',
        sourceId,
        sourceName,
        sourceType,
        sourceHref
      })
    }
  }

  // 4. metadata.metadata.distribution.promote[].contacts[] → role: 'Promo'
  const promoteEntries = (item.distribution?.promote || meta.distribution?.promote || [])
  for (const entry of promoteEntries) {
    const entryContacts = entry.contacts || []
    for (const c of entryContacts) {
      contacts.push({
        ...c,
        role: c.role || 'Promo',
        sourceId,
        sourceName,
        sourceType,
        sourceHref
      })
    }
  }

  return contacts
}

/**
 * Fetches all contacts from the dedicated /contacts endpoint.
 * Each contact includes a `sources` array of linked entries (from the backend).
 * @returns {Promise<Array>} Contacts sorted alphabetically by name
 */
export async function fetchAllContacts() {
  const res = await apiFetch('/contacts')
  const data = await res.json()
  return data.contacts || []
}

/**
 * Fetch a single contact by ID, including its linked entries.
 * @param {string} contactId
 */
export async function fetchContact(contactId) {
  const res = await apiFetch(`/contacts/${contactId}`)
  if (!res.ok) throw new Error('Contact not found')
  const data = await res.json()
  return data.contact
}

/**
 * Create a standalone contact (not yet linked to any entry).
 * @param {{ name, email, role, phone, location, label, notes }} fields
 * @returns {Promise<Object>} The created contact
 */
export async function createContact(fields) {
  const res = await apiFetch('/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create contact')
  return data.contact
}

/**
 * Update an existing contact's details.
 * Because contacts are shared, this update propagates to every linked entry.
 * @param {string} contactId
 * @param {{ name, email, role, phone, location, label, notes }} fields
 * @returns {Promise<Object>} The updated contact
 */
export async function updateContact(contactId, fields) {
  const res = await apiFetch(`/contacts/${contactId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update contact')
  return data.contact
}

/**
 * Permanently delete a contact. All links to entries are removed automatically.
 * @param {string} contactId
 */
export async function deleteContact(contactId) {
  const res = await apiFetch(`/contacts/${contactId}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to delete contact')
}

/**
 * Extract files from a release or collection object.
 * Sources: Audio, Video (releases only), Label, Promo, General.
 * No label-deal or promo-deal — those pages no longer exist.
 */
function extractFilesFromItem(item, sourceId, sourceType) {
  const files = []
  const sourceName = item.title || item.metadata?.title || 'Untitled'
  const sourceHref = sourceType === 'release' ? `/releases/${sourceId}` : `/collections/${sourceId}`
  const meta = item.metadata || item
  const base = `${API_BASE_URL}/${sourceType === 'release' ? 'releases' : 'collections'}/${sourceId}`

  // 1. versions.primary.files.audio[] → category: 'Audio' (releases only)
  if (sourceType === 'release') {
    const audioFiles = (item.versions || meta.versions)?.primary?.files?.audio || []
    for (const a of audioFiles) {
      const filename = a.filename || a.name
      if (!filename) continue
      files.push({
        ...a,
        filename,
        category: 'Audio',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: `${API_BASE_URL}/releases/${sourceId}/files/audio/${encodeURIComponent(filename)}`
      })
    }
  }

  // 2. versions.primary.files.video[] → category: 'Video' (releases only)
  if (sourceType === 'release') {
    const videoFiles = (item.versions || meta.versions)?.primary?.files?.video || []
    for (const v of videoFiles) {
      const filename = v.filename || v.name
      if (!filename) continue
      files.push({
        ...v,
        filename,
        category: 'Video',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: `${API_BASE_URL}/releases/${sourceId}/video/${encodeURIComponent(filename)}`
      })
    }
  }

  // 3. metadata.metadata.distribution.submit[].documents[] → category: 'Label'
  const submitEntries = (item.distribution?.submit || meta.distribution?.submit || [])
  for (const entry of submitEntries) {
    const entryDocs = entry.documents || []
    for (const d of entryDocs) {
      const filename = d.filename || d.name
      if (!filename) continue
      files.push({
        ...d,
        filename,
        category: 'Label',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: `${base}/label/${entry.id}/files/${encodeURIComponent(filename)}`
      })
    }
  }

  // 4. metadata.metadata.distribution.promote[].documents[] → category: 'Promo'
  const promoteEntries = (item.distribution?.promote || meta.distribution?.promote || [])
  for (const entry of promoteEntries) {
    const entryDocs = entry.documents || []
    for (const d of entryDocs) {
      const filename = d.filename || d.name
      if (!filename) continue
      files.push({
        ...d,
        filename,
        category: 'Promo',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: `${base}/promo/${entry.id}/files/${encodeURIComponent(filename)}`
      })
    }
  }

  // 5. metadata.notes.documents[] → category: 'General'
  const notes = item.notes || meta.notes || {}
  const noteDocs = notes.documents || []
  for (const d of noteDocs) {
    const filename = d.filename || d.name
    if (!filename) continue
    files.push({
      ...d,
      filename,
      category: 'General',
      sourceId,
      sourceName,
      sourceType,
      sourceHref,
      downloadUrl: `${base}/notes/files/${encodeURIComponent(filename)}`
    })
  }

  return files
}

/**
 * Fetches all files from the dedicated /files endpoint.
 * Returns files sorted by uploadedAt descending (newest first).
 * @returns {Promise<Array>} All files
 */
export async function fetchAllFiles() {
  const res = await apiFetch('/files')
  const data = await res.json()
  return data.files || []
}
