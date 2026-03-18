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
 * Fetches all contacts from releases and collections, deduplicated by name.
 * @returns {Promise<Array>} Deduplicated contacts sorted alphabetically by name
 */
export async function fetchAllContacts() {
  const [releasesRes, collectionsRes] = await Promise.all([
    apiFetch('/releases').then(r => r.json()),
    apiFetch('/collections').then(r => r.json())
  ])

  const releases = releasesRes.releases || []
  const collections = collectionsRes.collections || []

  const allContacts = []

  for (const r of releases) {
    const releaseId = r.releaseId
    const fullRes = await apiFetch(`/releases/${releaseId}`).then(x => x.json())
    const release = fullRes.release || fullRes
    const extracted = extractContactsFromItem(release, releaseId, 'release')
    allContacts.push(...extracted)
  }

  for (const c of collections) {
    const collectionId = c.releaseId || c.collectionId
    const fullRes = await apiFetch(`/collections/${collectionId}`).then(x => x.json())
    const collection = fullRes.collection || fullRes
    const extracted = extractContactsFromItem(collection, collectionId, 'collection')
    allContacts.push(...extracted)
  }

  // Deduplicate by name (case-insensitive trim)
  const byName = new Map()
  for (const contact of allContacts) {
    const key = (contact.name || '').trim().toLowerCase()
    if (!key) continue
    if (!byName.has(key)) {
      byName.set(key, {
        ...contact,
        sources: [{ sourceId: contact.sourceId, sourceName: contact.sourceName, sourceType: contact.sourceType, sourceHref: contact.sourceHref }]
      })
    } else {
      const existing = byName.get(key)
      existing.sources.push({ sourceId: contact.sourceId, sourceName: contact.sourceName, sourceType: contact.sourceType, sourceHref: contact.sourceHref })
    }
  }

  const deduped = Array.from(byName.values())
  return deduped.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
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
 * Fetches all files from releases and collections.
 * @returns {Promise<Array>} All files sorted by uploadedAt descending
 */
export async function fetchAllFiles() {
  const [releasesRes, collectionsRes] = await Promise.all([
    apiFetch('/releases').then(r => r.json()),
    apiFetch('/collections').then(r => r.json())
  ])

  const releases = releasesRes.releases || []
  const collections = collectionsRes.collections || []

  const allFiles = []

  for (const r of releases) {
    const releaseId = r.releaseId
    const fullRes = await apiFetch(`/releases/${releaseId}`).then(x => x.json())
    const release = fullRes.release || fullRes
    const extracted = extractFilesFromItem(release, releaseId, 'release')
    allFiles.push(...extracted)
  }

  for (const c of collections) {
    const collectionId = c.releaseId || c.collectionId
    const fullRes = await apiFetch(`/collections/${collectionId}`).then(x => x.json())
    const collection = fullRes.collection || fullRes
    const extracted = extractFilesFromItem(collection, collectionId, 'collection')
    allFiles.push(...extracted)
  }

  return allFiles.sort((a, b) => {
    const dateA = new Date(a.uploadedAt || 0)
    const dateB = new Date(b.uploadedAt || 0)
    return dateB - dateA
  })
}
