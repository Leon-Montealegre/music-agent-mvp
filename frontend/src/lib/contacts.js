/**
 * CRM aggregation utilities — fetches and aggregates contacts and files
 * from releases and collections using existing APIs. No new backend endpoints.
 */

const API_BASE = 'http://localhost:3001'

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
    fetch(`${API_BASE}/releases`).then(r => r.json()),
    fetch(`${API_BASE}/collections`).then(r => r.json())
  ])

  const releases = releasesRes.releases || []
  const collections = collectionsRes.collections || []

  const allContacts = []

  for (const r of releases) {
    const releaseId = r.releaseId
    const fullRes = await fetch(`${API_BASE}/releases/${releaseId}`).then(x => x.json())
    const release = fullRes.release || fullRes
    const extracted = extractContactsFromItem(release, releaseId, 'release')
    allContacts.push(...extracted)
  }

  for (const c of collections) {
    const collectionId = c.releaseId || c.collectionId
    const fullRes = await fetch(`${API_BASE}/collections/${collectionId}`).then(x => x.json())
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
 * Build download URL for a file based on category and source.
 */
function buildDownloadUrl(sourceId, sourceType, category, filename, labelId, promoId) {
  const base = `${API_BASE}/${sourceType === 'release' ? 'releases' : 'collections'}/${sourceId}`
  switch (category) {
    case 'Notes':
      return `${base}/notes/files/${encodeURIComponent(filename)}`
    case 'Label Deal':
      return `${base}/label-deal/files/${encodeURIComponent(filename)}`
    case 'Promo Deal':
      return `${base}/promo-deal/files/${encodeURIComponent(filename)}`
    case 'Label Submission':
      return `${base}/label/${labelId}/files/${encodeURIComponent(filename)}`
    case 'Promo Entry':
      return `${base}/promo/${promoId}/files/${encodeURIComponent(filename)}`
    default:
      return `${base}/notes/files/${encodeURIComponent(filename)}`
  }
}

/**
 * Extract files from a release or collection object.
 */
function extractFilesFromItem(item, sourceId, sourceType) {
  const files = []
  const sourceName = item.title || item.metadata?.title || 'Untitled'
  const sourceHref = sourceType === 'release' ? `/releases/${sourceId}` : `/collections/${sourceId}`

  const meta = item.metadata || item

  // 1. metadata.notes.documents[] → category: 'Notes'
  const notes = item.notes || meta.notes || {}
  const noteDocs = notes.documents || []
  for (const d of noteDocs) {
    const filename = d.filename || d.name
    if (!filename) continue
    files.push({
      ...d,
      filename,
      category: 'Notes',
      sourceId,
      sourceName,
      sourceType,
      sourceHref,
      downloadUrl: buildDownloadUrl(sourceId, sourceType, 'Notes', filename)
    })
  }

  // 2. metadata.metadata.labelInfo.contractDocuments[] → category: 'Label Deal'
  const labelDocs = meta.labelInfo?.contractDocuments || []
  for (const d of labelDocs) {
    const filename = d.filename || d.name
    if (!filename) continue
    files.push({
      ...d,
      filename,
      category: 'Label Deal',
      sourceId,
      sourceName,
      sourceType,
      sourceHref,
      downloadUrl: buildDownloadUrl(sourceId, sourceType, 'Label Deal', filename)
    })
  }

  // 3. metadata.metadata.promoInfo.contractDocuments[] → category: 'Promo Deal'
  const promoDocs = meta.promoInfo?.contractDocuments || []
  for (const d of promoDocs) {
    const filename = d.filename || d.name
    if (!filename) continue
    files.push({
      ...d,
      filename,
      category: 'Promo Deal',
      sourceId,
      sourceName,
      sourceType,
      sourceHref,
      downloadUrl: buildDownloadUrl(sourceId, sourceType, 'Promo Deal', filename)
    })
  }

  // 4. distribution.submit[].documents[] → category: 'Label Submission'
  const submitEntries = (item.distribution?.submit || meta.distribution?.submit || [])
  for (const entry of submitEntries) {
    const entryDocs = entry.documents || []
    for (const d of entryDocs) {
      const filename = d.filename || d.name
      if (!filename) continue
      files.push({
        ...d,
        filename,
        category: 'Label Submission',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: buildDownloadUrl(sourceId, sourceType, 'Label Submission', filename, entry.id, null)
      })
    }
  }

  // 5. distribution.promote[].documents[] → category: 'Promo Entry'
  const promoteEntries = (item.distribution?.promote || meta.distribution?.promote || [])
  for (const entry of promoteEntries) {
    const entryDocs = entry.documents || []
    for (const d of entryDocs) {
      const filename = d.filename || d.name
      if (!filename) continue
      files.push({
        ...d,
        filename,
        category: 'Promo Entry',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: buildDownloadUrl(sourceId, sourceType, 'Promo Entry', filename, null, entry.id)
      })
    }
  }

  // 6. metadata.versions.primary.files.audio[] → category: 'Track Upload' (releases only; skip for collections)
  if (sourceType === 'release') {
    const audioFiles = meta.versions?.primary?.files?.audio || []
    for (const a of audioFiles) {
      const filename = a.filename || a.name
      if (!filename) continue
      files.push({
        ...a,
        filename,
        category: 'Track Upload',
        sourceId,
        sourceName,
        sourceType,
        sourceHref,
        downloadUrl: `${API_BASE}/releases/${sourceId}/files/audio/${encodeURIComponent(filename)}`
      })
    }
  }

  return files
}

/**
 * Fetches all files from releases and collections.
 * @returns {Promise<Array>} All files sorted by uploadedAt descending
 */
export async function fetchAllFiles() {
  const [releasesRes, collectionsRes] = await Promise.all([
    fetch(`${API_BASE}/releases`).then(r => r.json()),
    fetch(`${API_BASE}/collections`).then(r => r.json())
  ])

  const releases = releasesRes.releases || []
  const collections = collectionsRes.collections || []

  const allFiles = []

  for (const r of releases) {
    const releaseId = r.releaseId
    const fullRes = await fetch(`${API_BASE}/releases/${releaseId}`).then(x => x.json())
    const release = fullRes.release || fullRes
    const extracted = extractFilesFromItem(release, releaseId, 'release')
    allFiles.push(...extracted)
  }

  for (const c of collections) {
    const collectionId = c.releaseId || c.collectionId
    const fullRes = await fetch(`${API_BASE}/collections/${collectionId}`).then(x => x.json())
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
