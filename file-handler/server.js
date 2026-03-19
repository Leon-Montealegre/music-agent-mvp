// =============================================================================
// MUSIC AGENT - Release Management API
// =============================================================================
// Run:    cd ~/Documents/music-agent-mvp/file-handler && node server.js
// Port:   http://localhost:3001
// Health: curl http://localhost:3001/health
// =============================================================================

require('dotenv').config()

const authRoutes = require('./routes/auth')
const authMiddleware = require('./authMiddleware')
const r2 = require('./r2')

const express        = require('express')
const multer         = require('multer')
const cors           = require('cors')
const path           = require('path')
// const fs          = require('fs').promises  // removed — no local file reads
// const fsSync      = require('fs')  // removed — no more local file streaming
// const os          = require('os')  // removed — no local paths needed
const { randomUUID } = require('crypto')
// const checkDiskSpace = require('check-disk-space').default  // removed — storage is on R2
const musicMetadata = require('music-metadata')

// =============================================================================
// SETUP & PATHS
// =============================================================================

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Local disk paths removed — all storage is on Cloudflare R2 + PostgreSQL.


// Static file serving removed — all files are on Cloudflare R2 now.

// =============================================================================
// HELPERS
// =============================================================================

function requireReleaseId(req) {
  const releaseId = (req.params?.releaseId || req.query.releaseId || '').trim()
  if (!releaseId) {
    const err = new Error('Missing releaseId')
    err.statusCode = 400
    throw err
  }
  return releaseId
}

function classify(file) {
  if (file.mimetype?.startsWith('audio/')) return 'audio'
  if (file.mimetype?.startsWith('image/')) return 'artwork'
  if (file.mimetype?.startsWith('video/')) return 'video'
  const ext = path.extname(file.originalname).toLowerCase()
  if (['.wav', '.mp3', '.flac', '.aiff', '.m4a', '.ogg'].includes(ext)) return 'audio'
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'artwork'
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video'
  return 'other'
}

async function validateAudioFile(bufferOrPath, mimetype) {
  try {
    // Accepts either a Buffer (from memoryStorage) or a file path (legacy)
    const metadata = Buffer.isBuffer(bufferOrPath)
      ? await musicMetadata.parseBuffer(bufferOrPath, { mimeType: mimetype })
      : await musicMetadata.parseFile(bufferOrPath)
    if (!metadata.format?.duration) return { valid: false, error: 'Could not read audio metadata' }
    if (metadata.format.duration <= 0 || metadata.format.duration > 3600)
      return { valid: false, error: `Invalid audio duration: ${metadata.format.duration}s` }
    return {
      valid: true,
      metadata: {
        duration:   Math.round(metadata.format.duration),
        bitrate:    metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels:   metadata.format.numberOfChannels,
        codec:      metadata.format.codec
      }
    }
  } catch (error) {
    return { valid: false, error: `Audio validation failed: ${error.message}` }
  }
}

function generateVersionId(versionName) {
  if (!versionName || versionName.trim() === '') return 'primary'
  if (versionName.trim().toLowerCase() === 'primary version') return 'primary'
  return versionName.toLowerCase()
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function getVersionInfo(req) {
  const versionName = (req.query.versionName || '').trim() || 'Primary Version'
  const versionId   = generateVersionId(versionName)
  return { versionName, versionId, isPrimary: versionId === 'primary' }
}



// =============================================================================
// MULTER — memory storage (files land in req.file.buffer, then go straight to R2)
// =============================================================================

// One instance covers every upload route — no disk writes at all.
const upload              = multer({ storage: multer.memoryStorage() })
const trackArtworkUpload  = upload
const releaseNotesUpload  = upload

const promoEntryUpload    = upload
const labelEntryUpload    = upload
const collectionUpload    = upload
const collectionNotesUpload   = upload

const collectionPromoEntryUpload  = upload
const collectionLabelEntryUpload  = multer({ storage: multer.memoryStorage() /* placeholder — same instance */ })

// All aliases point to the same memoryStorage instance — no disk writes anywhere.

// =============================================================================
// HEALTH
// =============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Release management API is running' })
})

// =============================================================================
// SETTINGS
// =============================================================================

app.get('/settings', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const result = await db.query(
      `SELECT artist_name AS "defaultArtistName", default_genre AS "defaultGenre", preferences
       FROM settings WHERE user_id = $1`,
      [req.user.id]
    )
    const settings = result.rows[0] || {}
    res.json({ success: true, settings })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { defaultArtistName, defaultGenre, preferences } = req.body
    await db.query(
      `INSERT INTO settings (user_id, artist_name, default_genre, preferences)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         artist_name   = COALESCE($2, settings.artist_name),
         default_genre = COALESCE($3, settings.default_genre),
         preferences   = COALESCE($4, settings.preferences)`,
      [req.user.id, defaultArtistName || null, defaultGenre || null,
       preferences ? JSON.stringify(preferences) : null]
    )
    const result = await db.query(
      `SELECT artist_name AS "defaultArtistName", default_genre AS "defaultGenre", preferences
       FROM settings WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ success: true, settings: result.rows[0] || {} })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// STORAGE STATUS
// =============================================================================

app.get('/storage/status', async (req, res) => {
  // Files are now on Cloudflare R2 — local disk is no longer relevant.
  // TODO: query R2 usage stats via the Cloudflare API for a real dashboard.
  res.json({
    storage: 'cloudflare-r2',
    bucket: process.env.R2_BUCKET_NAME || '(not set)',
    message: 'File storage is on Cloudflare R2. Local disk is not used.'
  })
})
app.use('/auth', authRoutes);

// =============================================================================
// FILE UPLOAD
// =============================================================================

app.post('/upload', authMiddleware, upload.any(), async (req, res) => {
  try {
    const releaseId = requireReleaseId(req)
    const { artist, title, genre } = req.query
    const { versionName, versionId } = getVersionInfo(req)

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, error: 'No files uploaded' })

    const savedFiles = { audio: [], artwork: [], video: [] }

    for (const file of req.files) {
      const fileType = classify(file)
      if (fileType === 'audio') {
        const validation = await validateAudioFile(file.buffer, file.mimetype)
        if (!validation.valid)
          return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
        const key = `releases/${releaseId}/audio/${versionId}/${file.originalname}`
        await r2.uploadFile(key, file.buffer, file.mimetype)
        savedFiles.audio.push({
          filename: file.originalname, size: file.size, mimetype: file.mimetype,
          duration: validation.metadata.duration, bitrate: validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate, channels: validation.metadata.channels, codec: validation.metadata.codec
        })
      } else if (fileType === 'artwork') {
        const key = `releases/${releaseId}/artwork/artwork${path.extname(file.originalname).toLowerCase()}`
        await r2.uploadFile(key, file.buffer, file.mimetype)
        savedFiles.artwork.push({ filename: file.originalname, size: file.size, mimetype: file.mimetype })
      } else if (fileType === 'video') {
        const key = `releases/${releaseId}/video/${file.originalname}`
        await r2.uploadFile(key, file.buffer, file.mimetype)
        savedFiles.video.push({ filename: file.originalname, size: file.size, mimetype: file.mimetype })
      }
    }

    res.json({ success: true, message: `Files uploaded for ${versionName}`, releaseId, versionId, versionName, files: savedFiles, artist, title, genre })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — METADATA
// =============================================================================

app.post('/metadata', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const {
      releaseId, title, artist, genre, bpm, key,
      trackDate, releaseDate, releaseType, releaseFormat,
      collectionId, isSigned, signedLabel, signedDate
    } = req.body

    if (!releaseId) return res.status(400).json({ success: false, error: 'Missing releaseId' })

    await db.query(`
      INSERT INTO releases (
        user_id, slug, title, artist, genre, bpm, key,
        track_date, release_date, release_type, release_format,
        collection_id, is_signed, signed_label, signed_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (slug) DO UPDATE SET
        title          = EXCLUDED.title,
        artist         = EXCLUDED.artist,
        genre          = EXCLUDED.genre,
        bpm            = EXCLUDED.bpm,
        key            = EXCLUDED.key,
        track_date     = EXCLUDED.track_date,
        release_date   = EXCLUDED.release_date,
        release_type   = EXCLUDED.release_type,
        release_format = EXCLUDED.release_format,
        collection_id  = EXCLUDED.collection_id,
        is_signed      = EXCLUDED.is_signed,
        signed_label   = EXCLUDED.signed_label,
        signed_date    = EXCLUDED.signed_date,
        updated_at     = NOW()
    `, [
      req.user.id, releaseId, title, artist, genre, bpm || null, key || null,
      trackDate || null, releaseDate || null, releaseType || null, releaseFormat || null,
      collectionId || null, isSigned || false, signedLabel || null, signedDate || null
    ])

    res.json({ success: true, message: 'Metadata saved', releaseId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/metadata', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params
    const {
      title, artist, genre, bpm, key,
      trackDate, releaseDate, releaseType, releaseFormat,
      collectionId, isSigned, signedLabel, signedDate
    } = req.body

    const result = await db.query(`
      UPDATE releases SET
        title          = COALESCE($3, title),
        artist         = COALESCE($4, artist),
        genre          = COALESCE($5, genre),
        bpm            = COALESCE($6, bpm),
        key            = COALESCE($7, key),
        track_date     = COALESCE($8, track_date),
        release_date   = COALESCE($9, release_date),
        release_type   = COALESCE($10, release_type),
        release_format = COALESCE($11, release_format),
        collection_id  = COALESCE($12, collection_id),
        is_signed      = COALESCE($13, is_signed),
        signed_label   = COALESCE($14, signed_label),
        signed_date    = COALESCE($15, signed_date),
        updated_at     = NOW()
      WHERE slug = $1 AND user_id = $2
      RETURNING slug
    `, [
      releaseId, req.user.id,
      title, artist, genre, bpm || null, key || null,
      trackDate || null, releaseDate || null, releaseType || null, releaseFormat || null,
      collectionId || null, isSigned ?? null, signedLabel || null, signedDate || null
    ])

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })

    res.json({ success: true, release: { releaseId, ...req.body } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — LIST & GET
// =============================================================================

app.get('/releases/', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')

    // Fetch releases + their distribution entries in two queries, then merge.
    const [relResult, distResult] = await Promise.all([
      db.query(`
        SELECT
          r.id, r.slug AS "releaseId", r.title, r.artist, r.genre, r.bpm, r.key,
          r.track_date AS "trackDate", r.release_date AS "releaseDate",
          r.release_type AS "releaseType", r.release_format AS "releaseFormat",
          col.slug AS "collectionId", r.is_signed AS "isSigned",
          r.signed_label AS "signedLabel", r.signed_date AS "signedDate",
          r.updated_at AS "updatedAt"
        FROM releases r
        LEFT JOIN collections col ON r.collection_id = col.id
        WHERE r.user_id = $1
        ORDER BY r.release_date DESC NULLS LAST
      `, [req.user.id]),
      db.query(`
        SELECT de.release_id, de.path_type, de.platform, de.label, de.status, de.timestamp
        FROM distribution_entries de
        JOIN releases r ON r.id = de.release_id
        WHERE r.user_id = $1
      `, [req.user.id])
    ])

    // Build a map: release UUID → { release: [], submit: [], promote: [] }
    const distMap = {}
    for (const e of distResult.rows) {
      if (!distMap[e.release_id]) distMap[e.release_id] = { release: [], submit: [], promote: [] }
      distMap[e.release_id][e.path_type]?.push({
        platform: e.platform, label: e.label, status: e.status, timestamp: e.timestamp
      })
    }

    const releases = relResult.rows.map(r => ({
      releaseId:     r.releaseId,
      artist:        r.artist,
      title:         r.title,
      genre:         r.genre,
      bpm:           r.bpm,
      key:           r.key,
      releaseDate:   r.releaseDate,
      releaseType:   r.releaseType,
      releaseFormat: r.releaseFormat,
      collectionId:  r.collectionId,
      isSigned:      r.isSigned,
      updatedAt:     r.updatedAt,
      distribution:  distMap[r.id] || { release: [], submit: [], promote: [] }
    }))
    res.json({ success: true, count: releases.length, releases })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/releases/:releaseId/', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params

    const result = await db.query(`
      SELECT
        r.id, r.slug AS "releaseId", r.title, r.artist, r.genre, r.bpm, r.key,
        r.track_date AS "trackDate", r.release_date AS "releaseDate",
        r.release_type AS "releaseType", r.release_format AS "releaseFormat",
        col.slug AS "collectionId", r.is_signed AS "isSigned",
        r.signed_label AS "signedLabel", r.signed_date AS "signedDate",
        r.updated_at AS "updatedAt"
      FROM releases r
      LEFT JOIN collections col ON r.collection_id = col.id
      WHERE r.slug = $1 AND r.user_id = $2
    `, [releaseId, req.user.id])

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: `Release not found: ${releaseId}` })

    const r = result.rows[0]
    const releaseUUID = r.id

    const [distResult, notesResult, songLinksResult] = await Promise.all([
      db.query(`SELECT * FROM distribution_entries WHERE release_id = $1`, [releaseUUID]),
      db.query(`SELECT text FROM notes WHERE release_id = $1 LIMIT 1`, [releaseUUID]),
      db.query(`SELECT id, label, url FROM song_links WHERE release_id = $1`, [releaseUUID])
    ])

    const distribution = { release: [], submit: [], promote: [] }
    for (const entry of distResult.rows) {
      distribution[entry.path_type]?.push({
        id:        entry.id,
        platform:  entry.platform,
        label:     entry.label,
        promoName: entry.promo_name,
        status:    entry.status,
        url:       entry.url,
        liveDate:  entry.live_date,
        pageNotes: entry.page_notes,
        timestamp: entry.timestamp,
        contacts:  [],
        documents: []
      })
    }

    res.json({
      success: true,
      release: {
        releaseId:     r.releaseId,
        artist:        r.artist,
        title:         r.title,
        genre:         r.genre,
        bpm:           r.bpm,
        key:           r.key,
        trackDate:     r.trackDate,
        releaseDate:   r.releaseDate,
        releaseType:   r.releaseType,
        releaseFormat: r.releaseFormat,
        collectionId:  r.collectionId,
        isSigned:      r.isSigned,
        signedLabel:   r.signedLabel,
        signedDate:    r.signedDate,
        updatedAt:     r.updatedAt,
        versions:      {},
        distribution,
        notes:         { text: notesResult.rows[0]?.text || '', documents: [] },
        songLinks:     songLinksResult.rows
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params

    const result = await db.query(
      `DELETE FROM releases WHERE slug = $1 AND user_id = $2 RETURNING slug`,
      [releaseId, req.user.id]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })

    res.json({ success: true, message: `Release ${releaseId} deleted` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — ARTWORK
// =============================================================================

app.get('/releases/:releaseId/artwork/', async (req, res) => {
  try {
    const { releaseId } = req.params
    const publicUrl = process.env.R2_PUBLIC_URL
    if (!publicUrl) {
      // Fallback: stream through server if public URL not configured
      const files = await r2.listFiles(`releases/${releaseId}/artwork/`)
      if (files.length === 0) return res.status(404).json({ error: 'No artwork found' })
      const r2Obj = await r2.getFile(files[0].Key)
      res.set('Content-Type', r2Obj.ContentType || 'image/jpeg')
      return r2Obj.Body.pipe(res)
    }
    const files = await r2.listFiles(`releases/${releaseId}/artwork/`)
    if (files.length === 0) return res.status(404).json({ error: 'No artwork found' })
    return res.redirect(302, `${publicUrl}/${files[0].Key}`)
  } catch (err) {
    res.status(404).json({ error: 'No artwork found' })
  }
})

app.post('/releases/:releaseId/artwork', authMiddleware, trackArtworkUpload.single('artwork'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const ext = path.extname(req.file.originalname).toLowerCase()
    const key = `releases/${releaseId}/artwork/artwork${ext}`

    // Delete any existing artwork files first (clean replace)
    const existing = await r2.listFiles(`releases/${releaseId}/artwork/`)
    await Promise.all(existing.map(f => r2.deleteFile(f.Key)))

    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    res.json({ success: true, key })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/releases/:releaseId/artwork', authMiddleware, async (req, res) => {
  try {
    const { releaseId } = req.params
    const existing = await r2.listFiles(`releases/${releaseId}/artwork/`)
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'No artwork found' })
    await Promise.all(existing.map(f => r2.deleteFile(f.Key)))
    res.json({ success: true, message: 'Artwork deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// RELEASES — VERSIONS
// =============================================================================

app.post('/releases/:releaseId/versions',
  authMiddleware,
  upload.any(),
  async (req, res) => {
    try {
      const releaseId = requireReleaseId(req)
      const { versionName, versionId } = getVersionInfo(req)

      if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, error: 'No audio files uploaded' })

      const savedFiles = { audio: [], artwork: [], video: [] }

      for (const file of req.files) {
        const fileType = classify(file)
        if (fileType !== 'audio')
          return res.status(400).json({ success: false, error: `Only audio files allowed. Received: ${fileType}`, file: file.originalname })
        const validation = await validateAudioFile(file.buffer, file.mimetype)
        if (!validation.valid)
          return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
        const key = `releases/${releaseId}/audio/${versionId}/${file.originalname}`
        await r2.uploadFile(key, file.buffer, file.mimetype)
        savedFiles.audio.push({
          filename: file.originalname, size: file.size, mimetype: file.mimetype,
          duration: validation.metadata.duration, bitrate: validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate, channels: validation.metadata.channels, codec: validation.metadata.codec
        })
      }

      res.json({ success: true, message: `Version "${versionName}" added`, releaseId, versionId, versionName, files: savedFiles })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
)

app.delete('/releases/:releaseId/versions/primary/audio/:filename', authMiddleware, async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const key = `releases/${releaseId}/audio/primary/${filename}`
    await r2.deleteFile(key)
    res.json({ success: true, message: `${filename} deleted` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/releases/:releaseId/video/:filename', authMiddleware, async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const key = `releases/${releaseId}/video/${filename}`
    await r2.deleteFile(key)
    res.json({ success: true, message: `${filename} deleted` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
// POST /releases/:releaseId/versions/primary/audio
// Add audio file(s) to an existing primary version (no duplicate-version check)
app.post('/releases/:releaseId/versions/primary/audio',
  authMiddleware,
  upload.any(),
  async (req, res) => {
    try {
      const { releaseId } = req.params
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, error: 'No files uploaded' })

      const added = []
      for (const file of req.files) {
        if (classify(file) !== 'audio')
          return res.status(400).json({ success: false, error: `Only audio files allowed. Got: ${file.originalname}` })
        const validation = await validateAudioFile(file.buffer, file.mimetype)
        if (!validation.valid)
          return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
        const key = `releases/${releaseId}/audio/primary/${file.originalname}`
        await r2.uploadFile(key, file.buffer, file.mimetype)
        added.push({
          filename: file.originalname, size: file.size, mimetype: file.mimetype,
          duration: validation.metadata.duration, bitrate: validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate, channels: validation.metadata.channels, codec: validation.metadata.codec
        })
      }
      res.json({ success: true, added })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// POST /releases/:releaseId/video
app.post('/releases/:releaseId/video', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const key = `releases/${releaseId}/video/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    res.json({ success: true, file: { filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// RELEASES — DISTRIBUTION
// =============================================================================

app.patch('/releases/:releaseId/distribution', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params
    const { path: distPath, entry } = req.body

    if (!distPath || !entry) return res.status(400).json({ success: false, error: 'Missing path and entry' })
    if (!['release', 'submit', 'promote'].includes(distPath))
      return res.status(400).json({ success: false, error: 'path must be: release, submit, or promote' })

    // Look up the release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    const timestamp = entry.timestamp || new Date().toISOString()

    await db.query(
      `INSERT INTO distribution_entries
         (id, release_id, path_type, platform, label, promo_name, status, url, live_date, page_notes, timestamp)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        releaseUUID,
        distPath,
        entry.platform   || null,
        entry.label      || null,
        entry.promoName  || null,
        entry.status     || 'Pending',
        entry.url        || null,
        entry.liveDate   || null,
        entry.pageNotes  !== undefined ? entry.pageNotes : '',
        timestamp
      ]
    )

    // Return the full distribution for this release (same shape as old API)
    const allEntries = await db.query(
      `SELECT * FROM distribution_entries WHERE release_id = $1 ORDER BY timestamp ASC`,
      [releaseUUID]
    )
    const distribution = { release: [], submit: [], promote: [] }
    for (const e of allEntries.rows) {
      distribution[e.path_type]?.push({
        id: e.id, platform: e.platform, label: e.label, promoName: e.promo_name,
        status: e.status, url: e.url, liveDate: e.live_date, pageNotes: e.page_notes,
        timestamp: e.timestamp, contacts: [], documents: []
      })
    }

    res.json({ success: true, distribution })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/distribution/:pathType/:timestamp', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid path type' })

    // Look up release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    const result = await db.query(
      `UPDATE distribution_entries SET
         platform   = COALESCE($4, platform),
         label      = COALESCE($5, label),
         promo_name = COALESCE($6, promo_name),
         status     = COALESCE($7, status),
         url        = COALESCE($8, url),
         live_date  = COALESCE($9::date, live_date),
         page_notes = COALESCE($10, page_notes)
       WHERE release_id = $1 AND path_type = $2 AND timestamp = $3::timestamptz
       RETURNING *`,
      [
        releaseUUID, pathType, timestamp,
        req.body.platform   || null,
        req.body.label      || null,
        req.body.promoName  || null,
        req.body.status     || null,
        req.body.url        || null,
        req.body.liveDate   || null,
        req.body.pageNotes  !== undefined ? req.body.pageNotes : null
      ]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Entry not found' })

    const e = result.rows[0]
    res.json({ success: true, entry: {
      id: e.id, platform: e.platform, label: e.label, promoName: e.promo_name,
      status: e.status, url: e.url, liveDate: e.live_date, pageNotes: e.page_notes,
      timestamp: e.timestamp, contacts: [], documents: []
    }})
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/distribution/:pathType/:timestamp', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid path type' })

    // Look up release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    const result = await db.query(
      `DELETE FROM distribution_entries
       WHERE release_id = $1 AND path_type = $2 AND timestamp = $3::timestamptz
       RETURNING id`,
      [releaseUUID, pathType, timestamp]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Entry not found' })

    res.json({ success: true, message: 'Entry deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/sign', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params
    const { labelName, signedDate } = req.body
    if (!labelName) return res.status(400).json({ success: false, error: 'Label name required' })

    const date = signedDate || new Date().toISOString()

    const result = await db.query(
      `UPDATE releases SET
         is_signed    = true,
         signed_label = $3,
         signed_date  = $4::date,
         updated_at   = NOW()
       WHERE slug = $1 AND user_id = $2
       RETURNING slug`,
      [releaseId, req.user.id, labelName, date]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })

    res.json({ success: true, message: `Marked as signed by ${labelName}` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — PROMO / LABEL ENTRY DETAILS
// =============================================================================

function ensureDistributionStructure(metadata) {
  if (!metadata.metadata) metadata.metadata = {}
  if (!metadata.metadata.distribution) metadata.metadata.distribution = { release: [], submit: [], promote: [] }
  if (!metadata.metadata.distribution.release) metadata.metadata.distribution.release = []
  if (!metadata.metadata.distribution.submit) metadata.metadata.distribution.submit = []
  if (!metadata.metadata.distribution.promote) metadata.metadata.distribution.promote = []
}

function ensurePromoEntryDefaults(entry) {
  if (!entry.contacts) entry.contacts = []
  if (!entry.documents) entry.documents = []
  if (entry.pageNotes === undefined) entry.pageNotes = ''
}

function ensureLabelEntryDefaults(entry) {
  if (!entry.contacts) entry.contacts = []
  if (!entry.documents) entry.documents = []
  if (entry.pageNotes === undefined) entry.pageNotes = ''
}


// =============================================================================
// PER-ENTRY HELPERS (shared by releases + collections promo / label pages)
// =============================================================================

// Look up a release distribution entry and verify user ownership.
// Returns the entry row, or null if not found / not owned.
async function getReleaseEntry(db, releaseSlug, entryId, userId) {
  const relRes = await db.query(
    `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
    [releaseSlug, userId]
  )
  if (!relRes.rows.length) return null
  const relUUID = relRes.rows[0].id
  const entRes = await db.query(
    `SELECT * FROM distribution_entries WHERE id = $1 AND release_id = $2`,
    [entryId, relUUID]
  )
  return entRes.rows[0] || null
}

// Same for collection entries.
async function getCollectionEntry(db, collectionSlug, entryId, userId) {
  const colRes = await db.query(
    `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
    [collectionSlug, userId]
  )
  if (!colRes.rows.length) return null
  const colUUID = colRes.rows[0].id
  const entRes = await db.query(
    `SELECT * FROM distribution_entries WHERE id = $1 AND collection_id = $2`,
    [entryId, colUUID]
  )
  return entRes.rows[0] || null
}

// Fetch the contacts and documents attached to an entry.
async function fetchEntryContactsAndDocs(db, entryId) {
  const [cRes, fRes] = await Promise.all([
    db.query(
      `SELECT c.id, c.name, c.email, c.role,
              COALESCE(c.phone, '')         AS phone,
              COALESCE(c.location, '')      AS location,
              COALESCE(c.label_name, '')    AS label,
              COALESCE(c.contact_notes, '') AS notes,
              c.created_at AS "createdAt"
       FROM contacts c
       JOIN entry_contacts ec ON c.id = ec.contact_id
       WHERE ec.entry_id = $1
       ORDER BY c.created_at ASC`,
      [entryId]
    ),
    db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`,
      [entryId]
    )
  ])
  return { contacts: cRes.rows, documents: fRes.rows }
}

// Serialize a distribution_entries row into the shape the frontend expects
// for a label/submit entry.
function fmtLabel(ent, contacts, documents) {
  return {
    id:         ent.id,
    label:      ent.label       || '',
    platform:   ent.platform    || '',
    status:     ent.status      || '',
    signedDate: ent.signed_date || null,
    notes:      ent.entry_notes || '',
    pageNotes:  ent.page_notes  || '',
    timestamp:  ent.timestamp,
    contacts,
    documents
  }
}

// Same for a promo/promote entry.
function fmtPromo(ent, contacts, documents) {
  return {
    id:        ent.id,
    promoName: ent.promo_name  || '',
    platform:  ent.platform    || '',
    status:    ent.status      || '',
    liveDate:  ent.live_date   || null,
    notes:     ent.entry_notes || '',
    pageNotes: ent.page_notes  || '',
    timestamp: ent.timestamp,
    contacts,
    documents
  }
}

// -- Promo entry: GET --------------------------------------------------------
app.get('/releases/:releaseId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtPromo(ent, contacts, documents), releaseId })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: PATCH -------------------------------------------------------
app.patch('/releases/:releaseId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const { promoName, status, liveDate, platform, notes } = req.body
    await db.query(
      `UPDATE distribution_entries SET
         promo_name  = COALESCE($2, promo_name),
         status      = COALESCE($3, status),
         live_date   = COALESCE($4, live_date),
         platform    = COALESCE($5, platform),
         entry_notes = COALESCE($6, entry_notes)
       WHERE id = $1`,
      [ent.id, promoName || null, status || null,
       liveDate || null, platform || null, notes !== undefined ? notes : null]
    )
    const updated = await db.query(
      `SELECT * FROM distribution_entries WHERE id = $1`, [ent.id]
    )
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtPromo(updated.rows[0], contacts, documents) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: DELETE ------------------------------------------------------
app.delete('/releases/:releaseId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    // Also clean up R2 files for this entry
    try {
      const files = await db.query(`SELECT r2_key FROM files WHERE entry_id = $1`, [ent.id])
      await Promise.all(files.rows.map(f => r2.deleteFile(f.r2_key)))
    } catch {}
    await db.query(`DELETE FROM distribution_entries WHERE id = $1`, [ent.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: POST contact ------------------------------------------------
app.post('/releases/:releaseId/promo/:promoId/contacts', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const cRes = await db.query(
      `INSERT INTO contacts (id, user_id, name, email, role, phone, location, label_name, contact_notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const contact = cRes.rows[0]
    await db.query(
      `INSERT INTO entry_contacts (contact_id, entry_id) VALUES ($1, $2)`,
      [contact.id, ent.id]
    )
    res.json({ success: true, contact: {
      id: contact.id, name: contact.name, email: contact.email, role: contact.role,
      phone: contact.phone || '', location: contact.location || '',
      label: contact.label_name || '', notes: contact.contact_notes || '',
      createdAt: contact.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: PATCH contact -----------------------------------------------
app.patch('/releases/:releaseId/promo/:promoId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    // Verify the contact belongs to this entry
    const check = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2`,
      [contactId, ent.id]
    )
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const cRes = await db.query(
      `UPDATE contacts SET name=$2, email=$3, role=$4, phone=$5, location=$6,
         label_name=$7, contact_notes=$8 WHERE id=$1 RETURNING *`,
      [contactId, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const c = cRes.rows[0]
    res.json({ success: true, contact: {
      id: c.id, name: c.name, email: c.email, role: c.role,
      phone: c.phone || '', location: c.location || '',
      label: c.label_name || '', notes: c.contact_notes || '',
      createdAt: c.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: DELETE contact ----------------------------------------------
app.delete('/releases/:releaseId/promo/:promoId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId, contactId } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const result = await db.query(
      `DELETE FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2 RETURNING contact_id`,
      [contactId, ent.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    // Clean up the contact row itself if it has no other entries
    const others = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 LIMIT 1`, [contactId]
    )
    if (!others.rows.length) await db.query(`DELETE FROM contacts WHERE id = $1`, [contactId])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: POST file ---------------------------------------------------
app.post('/releases/:releaseId/promo/:promoId/files', authMiddleware, promoEntryUpload.single('file'), async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const key = `releases/${releaseId}/promo/${promoId}/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    await db.query(
      `INSERT INTO files (id, user_id, entry_id, category, filename, r2_key, size_bytes)
       VALUES (gen_random_uuid(), $1, $2, 'promo', $3, $4, $5)`,
      [req.user.id, ent.id, req.file.originalname, key, req.file.size]
    )
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: GET file (download) ----------------------------------------
app.get('/releases/:releaseId/promo/:promoId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId, filename } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const fRes = await db.query(
      `SELECT r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    const r2Obj = await r2.getFile(fRes.rows[0].r2_key)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    r2Obj.Body.pipe(res)
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: DELETE file -------------------------------------------------
app.delete('/releases/:releaseId/promo/:promoId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId, filename } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const fRes = await db.query(
      `SELECT id, r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    await r2.deleteFile(fRes.rows[0].r2_key)
    await db.query(`DELETE FROM files WHERE id = $1`, [fRes.rows[0].id])
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Promo entry: PATCH notes -------------------------------------------------
app.patch('/releases/:releaseId/promo/:promoId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, promoId } = req.params
    const ent = await getReleaseEntry(db, releaseId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    await db.query(
      `UPDATE distribution_entries SET page_notes = $2 WHERE id = $1`,
      [ent.id, req.body.notes || '']
    )
    res.json({ success: true, notes: req.body.notes || '' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// =============================================================================
// RELEASES — LABEL / SUBMIT PER-ENTRY ENDPOINTS
// =============================================================================

// -- Label entry: GET ---------------------------------------------------------
app.get('/releases/:releaseId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtLabel(ent, contacts, documents), releaseId })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: PATCH -------------------------------------------------------
app.patch('/releases/:releaseId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const { label, status, signedDate, platform, notes } = req.body
    await db.query(
      `UPDATE distribution_entries SET
         label       = COALESCE($2, label),
         status      = COALESCE($3, status),
         signed_date = COALESCE($4, signed_date),
         platform    = COALESCE($5, platform),
         entry_notes = COALESCE($6, entry_notes)
       WHERE id = $1`,
      [ent.id, label || null, status || null,
       signedDate || null, platform || null, notes !== undefined ? notes : null]
    )
    const updated = await db.query(
      `SELECT * FROM distribution_entries WHERE id = $1`, [ent.id]
    )
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtLabel(updated.rows[0], contacts, documents) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: DELETE ------------------------------------------------------
app.delete('/releases/:releaseId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    try {
      const files = await db.query(`SELECT r2_key FROM files WHERE entry_id = $1`, [ent.id])
      await Promise.all(files.rows.map(f => r2.deleteFile(f.r2_key)))
    } catch {}
    await db.query(`DELETE FROM distribution_entries WHERE id = $1`, [ent.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: POST contact ------------------------------------------------
app.post('/releases/:releaseId/label/:labelId/contacts', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const cRes = await db.query(
      `INSERT INTO contacts (id, user_id, name, email, role, phone, location, label_name, contact_notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const contact = cRes.rows[0]
    await db.query(
      `INSERT INTO entry_contacts (contact_id, entry_id) VALUES ($1, $2)`,
      [contact.id, ent.id]
    )
    res.json({ success: true, contact: {
      id: contact.id, name: contact.name, email: contact.email, role: contact.role,
      phone: contact.phone || '', location: contact.location || '',
      label: contact.label_name || '', notes: contact.contact_notes || '',
      createdAt: contact.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: PATCH contact -----------------------------------------------
app.patch('/releases/:releaseId/label/:labelId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const check = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2`,
      [contactId, ent.id]
    )
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const cRes = await db.query(
      `UPDATE contacts SET name=$2, email=$3, role=$4, phone=$5, location=$6,
         label_name=$7, contact_notes=$8 WHERE id=$1 RETURNING *`,
      [contactId, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const c = cRes.rows[0]
    res.json({ success: true, contact: {
      id: c.id, name: c.name, email: c.email, role: c.role,
      phone: c.phone || '', location: c.location || '',
      label: c.label_name || '', notes: c.contact_notes || '',
      createdAt: c.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: DELETE contact ----------------------------------------------
app.delete('/releases/:releaseId/label/:labelId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId, contactId } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const result = await db.query(
      `DELETE FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2 RETURNING contact_id`,
      [contactId, ent.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const others = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 LIMIT 1`, [contactId]
    )
    if (!others.rows.length) await db.query(`DELETE FROM contacts WHERE id = $1`, [contactId])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: POST file ---------------------------------------------------
app.post('/releases/:releaseId/label/:labelId/files', authMiddleware, labelEntryUpload.single('file'), async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const key = `releases/${releaseId}/label/${labelId}/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    await db.query(
      `INSERT INTO files (id, user_id, entry_id, category, filename, r2_key, size_bytes)
       VALUES (gen_random_uuid(), $1, $2, 'label', $3, $4, $5)`,
      [req.user.id, ent.id, req.file.originalname, key, req.file.size]
    )
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: GET file (download) ----------------------------------------
app.get('/releases/:releaseId/label/:labelId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId, filename } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const fRes = await db.query(
      `SELECT r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    const r2Obj = await r2.getFile(fRes.rows[0].r2_key)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    r2Obj.Body.pipe(res)
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: DELETE file -------------------------------------------------
app.delete('/releases/:releaseId/label/:labelId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId, filename } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const fRes = await db.query(
      `SELECT id, r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    await r2.deleteFile(fRes.rows[0].r2_key)
    await db.query(`DELETE FROM files WHERE id = $1`, [fRes.rows[0].id])
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Label entry: PATCH notes -------------------------------------------------
app.patch('/releases/:releaseId/label/:labelId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, labelId } = req.params
    const ent = await getReleaseEntry(db, releaseId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    await db.query(
      `UPDATE distribution_entries SET page_notes = $2 WHERE id = $1`,
      [ent.id, req.body.notes || '']
    )
    res.json({ success: true, notes: req.body.notes || '' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})


// =============================================================================
// RELEASES — FILE DOWNLOAD
// =============================================================================

app.get('/releases/:releaseId/files/:fileType/:filename', async (req, res) => {
  try {
    const { releaseId, fileType, filename } = req.params
    if (!['audio', 'artwork', 'video'].includes(fileType))
      return res.status(400).json({ error: 'Invalid file type' })

    // Build the R2 key — audio lives under /audio/primary/, others at the top level
    const key = fileType === 'audio'
      ? `releases/${releaseId}/audio/primary/${filename}`
      : `releases/${releaseId}/${fileType}/${filename}`

    const r2Obj = await r2.getFile(key)
    if (r2Obj.ContentType) res.set('Content-Type', r2Obj.ContentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    r2Obj.Body.pipe(res)
  } catch (error) {
    // R2 throws NoSuchKey when file doesn't exist
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404)
      return res.status(404).json({ error: 'File not found' })
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — NOTES
// =============================================================================

app.patch('/releases/:releaseId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params
    const notesText = req.body.notes || ''

    // Look up release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    // Upsert: try update first, insert if no existing row
    const updateResult = await db.query(
      `UPDATE notes SET text = $2, updated_at = NOW()
       WHERE release_id = $1 AND collection_id IS NULL AND entry_id IS NULL`,
      [releaseUUID, notesText]
    )
    if (updateResult.rowCount === 0) {
      await db.query(
        `INSERT INTO notes (id, release_id, text, updated_at)
         VALUES (gen_random_uuid(), $1, $2, NOW())`,
        [releaseUUID, notesText]
      )
    }

    res.json({ success: true, notes: notesText })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/releases/:releaseId/notes/files', authMiddleware, releaseNotesUpload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const key = `releases/${releaseId}/notes/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    res.json({ success: true, filename: req.file.originalname, size: req.file.size })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/releases/:releaseId/notes/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const key = `releases/${releaseId}/notes/${filename}`
    const r2Obj = await r2.getFile(key)
    res.set('Content-Disposition', `attachment; filename="${filename}"`)
    res.set('Content-Type', r2Obj.ContentType || 'application/octet-stream')
    r2Obj.Body.pipe(res)
  } catch (error) {
    res.status(404).json({ error: 'File not found' })
  }
})

app.delete('/releases/:releaseId/notes/files/:filename', authMiddleware, async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    await r2.deleteFile(`releases/${releaseId}/notes/${filename}`)
    res.json({ success: true, message: `${filename} deleted` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — SONG LINKS
// =============================================================================

app.post('/releases/:releaseId/song-links', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId } = req.params
    const { label, url } = req.body

    // Look up release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    await db.query(
      `INSERT INTO song_links (id, release_id, label, url)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [releaseUUID, label, url]
    )

    const allLinks = await db.query(
      `SELECT id, label, url FROM song_links WHERE release_id = $1`,
      [releaseUUID]
    )
    res.json({ songLinks: allLinks.rows })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add song link' })
  }
})

app.delete('/releases/:releaseId/song-links/:linkId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { releaseId, linkId } = req.params

    // Look up release UUID and verify ownership
    const releaseResult = await db.query(
      `SELECT id FROM releases WHERE slug = $1 AND user_id = $2`,
      [releaseId, req.user.id]
    )
    if (releaseResult.rows.length === 0)
      return res.status(404).json({ error: 'Release not found' })
    const releaseUUID = releaseResult.rows[0].id

    await db.query(
      `DELETE FROM song_links WHERE id = $1 AND release_id = $2`,
      [linkId, releaseUUID]
    )

    const allLinks = await db.query(
      `SELECT id, label, url FROM song_links WHERE release_id = $1`,
      [releaseUUID]
    )
    res.json({ songLinks: allLinks.rows })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete song link' })
  }
})

// =============================================================================
// COLLECTIONS — CRUD
// =============================================================================

app.post('/collections', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { title, artist, genre, releaseDate, collectionType, releaseType } = req.body
    const type = collectionType || releaseType
    if (!title || !artist || !type)
      return res.status(400).json({ success: false, error: 'title, artist and collectionType are required' })

    const cleanArtist  = artist.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanTitle   = title.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const date         = releaseDate || new Date().toISOString().split('T')[0]
    const collectionId = `${date}_${cleanArtist}_${cleanTitle}`

    await db.query(
      `INSERT INTO collections (id, user_id, slug, title, artist, genre, release_type, release_date, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
      [req.user.id, collectionId, title, artist, genre || '', type, date || null]
    )
    // Return in a shape the frontend expects: collection.releaseId is used for navigation
    res.json({ success: true, collectionId, collection: { releaseId: collectionId, collectionId, title, artist, genre: genre || '', collectionType: type, releaseType: type, releaseDate: date } })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, error: 'Collection already exists' })
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/collections', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')

    const [colResult, distResult] = await Promise.all([
      db.query(
        `SELECT id, slug AS "collectionId", title, artist, genre,
                release_type AS "releaseType", release_date AS "releaseDate",
                is_signed AS "isSigned", signed_label AS "signedLabel",
                signed_date AS "signedDate", updated_at AS "updatedAt"
         FROM collections WHERE user_id = $1 ORDER BY release_date DESC NULLS LAST`,
        [req.user.id]
      ),
      db.query(
        `SELECT de.collection_id, de.path_type, de.platform, de.label, de.status, de.timestamp
         FROM distribution_entries de
         JOIN collections c ON c.id = de.collection_id
         WHERE c.user_id = $1`,
        [req.user.id]
      )
    ])

    // Build a map: collection UUID → { release: [], submit: [], promote: [] }
    const distMap = {}
    for (const e of distResult.rows) {
      if (!distMap[e.collection_id]) distMap[e.collection_id] = { release: [], submit: [], promote: [] }
      distMap[e.collection_id][e.path_type]?.push({
        platform: e.platform, label: e.label, status: e.status, timestamp: e.timestamp
      })
    }

    const collections = colResult.rows.map(c => ({
      ...c,
      releaseId:      c.collectionId,   // frontend uses item.releaseId
      collectionType: c.releaseType,    // frontend uses item.collectionType
      distribution:   distMap[c.id] || { release: [], submit: [], promote: [] }
    }))
    res.json({ success: true, count: collections.length, collections })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/collections/:collectionId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params

    const result = await db.query(
      `SELECT id, slug AS "collectionId", title, artist, genre,
              release_type AS "releaseType", release_date AS "releaseDate",
              is_signed AS "isSigned", signed_label AS "signedLabel",
              signed_date AS "signedDate", updated_at AS "updatedAt"
       FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })

    const c = result.rows[0]
    const collectionUUID = c.id

    const [distResult, notesResult, songLinksResult] = await Promise.all([
      db.query(`SELECT * FROM distribution_entries WHERE collection_id = $1`, [collectionUUID]),
      db.query(`SELECT text FROM notes WHERE collection_id = $1 AND release_id IS NULL AND entry_id IS NULL LIMIT 1`, [collectionUUID]),
      db.query(`SELECT id, label, url FROM song_links WHERE collection_id = $1`, [collectionUUID])
    ])

    const distribution = { release: [], submit: [], promote: [] }
    for (const entry of distResult.rows) {
      distribution[entry.path_type]?.push({
        id: entry.id, platform: entry.platform, label: entry.label,
        promoName: entry.promo_name, status: entry.status, url: entry.url,
        liveDate: entry.live_date, pageNotes: entry.page_notes,
        timestamp: entry.timestamp, contacts: [], documents: []
      })
    }

    res.json({
      success: true,
      collection: {
        collectionId: c.collectionId,
        releaseId: c.collectionId,        // frontend uses collection.releaseId in some places
        title: c.title, artist: c.artist,
        genre: c.genre,
        releaseType: c.releaseType,
        collectionType: c.releaseType,    // frontend uses collection.collectionType for badges
        releaseDate: c.releaseDate,
        isSigned: c.isSigned, signedLabel: c.signedLabel, signedDate: c.signedDate,
        updatedAt: c.updatedAt, distribution,
        notes: { text: notesResult.rows[0]?.text || '', documents: [] },
        songLinks: songLinksResult.rows
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/collections/:collectionId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params
    const { title, artist, genre, releaseType, collectionType, releaseDate, isSigned, signedLabel, signedDate } = req.body
    const type = releaseType || collectionType || undefined

    const result = await db.query(
      `UPDATE collections SET
         title        = COALESCE($3, title),
         artist       = COALESCE($4, artist),
         genre        = COALESCE($5, genre),
         release_type = COALESCE($6, release_type),
         release_date = COALESCE($7, release_date),
         is_signed    = COALESCE($8, is_signed),
         signed_label = COALESCE($9, signed_label),
         signed_date  = COALESCE($10, signed_date),
         updated_at   = NOW()
       WHERE slug = $1 AND user_id = $2 RETURNING slug`,
      [collectionId, req.user.id, title, artist, genre, type,
       releaseDate || null, isSigned ?? null, signedLabel || null, signedDate || null]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })

    res.json({ success: true, collectionId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params

    const result = await db.query(
      `DELETE FROM collections WHERE slug = $1 AND user_id = $2 RETURNING slug`,
      [collectionId, req.user.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })

    res.json({ success: true, message: `Collection ${collectionId} deleted` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — ARTWORK
// =============================================================================

app.post('/collections/:collectionId/artwork', authMiddleware, collectionUpload.single('artwork'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const ext = path.extname(req.file.originalname).toLowerCase()
    const key = `collections/${collectionId}/artwork/artwork${ext}`
    // Delete existing artwork first
    const existing = await r2.listFiles(`collections/${collectionId}/artwork/`)
    await Promise.all(existing.map(f => r2.deleteFile(f.Key)))
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    res.json({ success: true, key })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections/:collectionId/artwork', async (req, res) => {
  try {
    const { collectionId } = req.params
    const publicUrl = process.env.R2_PUBLIC_URL
    const files = await r2.listFiles(`collections/${collectionId}/artwork/`)
    if (files.length === 0) return res.status(404).json({ error: 'No artwork found' })
    if (!publicUrl) {
      const r2Obj = await r2.getFile(files[0].Key)
      res.set('Content-Type', r2Obj.ContentType || 'image/jpeg')
      return r2Obj.Body.pipe(res)
    }
    return res.redirect(302, `${publicUrl}/${files[0].Key}`)
  } catch {
    res.status(404).json({ error: 'No artwork found' })
  }
})

app.delete('/collections/:collectionId/artwork', authMiddleware, async (req, res) => {
  try {
    const { collectionId } = req.params
    const existing = await r2.listFiles(`collections/${collectionId}/artwork/`)
    if (existing.length === 0) return res.status(404).json({ success: false, error: 'No artwork found' })
    await Promise.all(existing.map(f => r2.deleteFile(f.Key)))
    res.json({ success: true, message: 'Artwork deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — TRACKS
// =============================================================================

app.get('/collections/:collectionId/tracks', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const result = await db.query(
      `SELECT slug AS "releaseId", title, artist, genre, bpm, key
       FROM releases WHERE collection_id = $1 AND user_id = $2
       ORDER BY release_date ASC NULLS LAST`,
      [collectionUUID, req.user.id]
    )
    res.json({ success: true, tracks: result.rows })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/collections/:collectionId/tracks', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params
    const { trackReleaseId } = req.body
    if (!trackReleaseId) return res.status(400).json({ success: false, error: 'trackReleaseId is required' })

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const result = await db.query(
      `UPDATE releases SET collection_id = $1, updated_at = NOW()
       WHERE slug = $2 AND user_id = $3 RETURNING slug`,
      [collectionUUID, trackReleaseId, req.user.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })

    res.json({ success: true, message: `Track ${trackReleaseId} added to collection` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/tracks/:trackReleaseId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { trackReleaseId } = req.params

    const result = await db.query(
      `UPDATE releases SET collection_id = NULL, updated_at = NOW()
       WHERE slug = $1 AND user_id = $2 RETURNING slug`,
      [trackReleaseId, req.user.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Release not found' })

    res.json({ success: true, message: `Track ${trackReleaseId} removed from collection` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — DISTRIBUTION
// =============================================================================

app.patch('/collections/:collectionId/distribution', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params
    const { path: distPath, entry } = req.body
    if (!['release', 'submit', 'promote'].includes(distPath))
      return res.status(400).json({ success: false, error: 'path must be release, submit, or promote' })
    if (!entry) return res.status(400).json({ success: false, error: 'entry is required' })

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const ts = new Date().toISOString()
    await db.query(
      `INSERT INTO distribution_entries
         (id, collection_id, path_type, platform, label, promo_name, status, url, live_date, page_notes, timestamp)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [collectionUUID, distPath,
       entry.platform || null, entry.label || null, entry.promoName || null,
       entry.status || null, entry.url || null,
       entry.liveDate || null, entry.pageNotes || null, ts]
    )
    res.json({ success: true, message: 'Entry added' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/collections/:collectionId/distribution/:pathType/:timestamp', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid pathType' })

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const { platform, label, promoName, status, url, liveDate, pageNotes } = req.body
    const result = await db.query(
      `UPDATE distribution_entries SET
         platform   = COALESCE($3, platform),
         label      = COALESCE($4, label),
         promo_name = COALESCE($5, promo_name),
         status     = COALESCE($6, status),
         url        = COALESCE($7, url),
         live_date  = COALESCE($8, live_date),
         page_notes = COALESCE($9, page_notes)
       WHERE collection_id = $1 AND timestamp = $2 RETURNING id`,
      [collectionUUID, timestamp, platform, label, promoName, status, url,
       liveDate || null, pageNotes]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Entry not found' })

    res.json({ success: true, message: 'Entry updated' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/distribution/:pathType/:timestamp', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid pathType' })

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const result = await db.query(
      `DELETE FROM distribution_entries WHERE collection_id = $1 AND timestamp = $2 RETURNING id`,
      [collectionUUID, timestamp]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Entry not found' })

    res.json({ success: true, message: 'Entry deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/collections/:collectionId/sign', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params
    const { labelName, signedDate } = req.body
    if (!labelName) return res.status(400).json({ success: false, error: 'Label name required' })

    const date = signedDate || new Date().toISOString()
    const result = await db.query(
      `UPDATE collections SET is_signed = true, signed_label = $3, signed_date = $4::date, updated_at = NOW()
       WHERE slug = $1 AND user_id = $2 RETURNING slug`,
      [collectionId, req.user.id, labelName, date]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })

    res.json({ success: true, message: `Marked as signed by ${labelName}` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — SONG LINKS
// =============================================================================

app.post('/collections/:collectionId/song-links', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params
    const { label, url } = req.body
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' })

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    await db.query(
      `INSERT INTO song_links (id, collection_id, label, url) VALUES (gen_random_uuid(), $1, $2, $3)`,
      [collectionUUID, label || url, url]
    )
    res.json({ success: true, message: 'Link added' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/song-links/:linkId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, linkId } = req.params

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const result = await db.query(
      `DELETE FROM song_links WHERE id = $1 AND collection_id = $2 RETURNING id`,
      [linkId, collectionUUID]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Link not found' })

    res.json({ success: true, message: 'Link deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — NOTES
// =============================================================================

app.patch('/collections/:collectionId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId } = req.params

    const colResult = await db.query(
      `SELECT id FROM collections WHERE slug = $1 AND user_id = $2`,
      [collectionId, req.user.id]
    )
    if (colResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Collection not found' })
    const collectionUUID = colResult.rows[0].id

    const notesText = req.body.notes || ''
    // Upsert: try update first, insert if no existing row
    const updateResult = await db.query(
      `UPDATE notes SET text = $2, updated_at = NOW()
       WHERE collection_id = $1 AND release_id IS NULL AND entry_id IS NULL`,
      [collectionUUID, notesText]
    )
    if (updateResult.rowCount === 0) {
      await db.query(
        `INSERT INTO notes (id, collection_id, text, updated_at)
         VALUES (gen_random_uuid(), $1, $2, NOW())`,
        [collectionUUID, notesText]
      )
    }
    res.json({ success: true, notes: notesText })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/collections/:collectionId/notes/files', authMiddleware, collectionNotesUpload.single('file'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const key = `collections/${collectionId}/notes/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    res.json({ success: true, filename: req.file.originalname, size: req.file.size })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections/:collectionId/notes/files/:filename', authMiddleware, async (req, res) => {
  try {
    const { collectionId, filename } = req.params
    const r2Obj = await r2.getFile(`collections/${collectionId}/notes/${filename}`)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.set('Content-Type', r2Obj.ContentType || 'application/octet-stream')
    r2Obj.Body.pipe(res)
  } catch {
    res.status(404).json({ error: 'File not found' })
  }
})

app.delete('/collections/:collectionId/notes/files/:filename', authMiddleware, async (req, res) => {
  try {
    const { collectionId, filename } = req.params
    await r2.deleteFile(`collections/${collectionId}/notes/${filename}`)
    res.json({ success: true, message: `${filename} deleted` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — PER-ENTRY PROMO / LABEL ENDPOINTS
// =============================================================================

// -- Collection promo entry: GET ----------------------------------------------
app.get('/collections/:collectionId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtPromo(ent, contacts, documents), collectionId })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: PATCH --------------------------------------------
app.patch('/collections/:collectionId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const { promoName, status, liveDate, platform, notes } = req.body
    await db.query(
      `UPDATE distribution_entries SET
         promo_name  = COALESCE($2, promo_name),
         status      = COALESCE($3, status),
         live_date   = COALESCE($4, live_date),
         platform    = COALESCE($5, platform),
         entry_notes = COALESCE($6, entry_notes)
       WHERE id = $1`,
      [ent.id, promoName || null, status || null,
       liveDate || null, platform || null, notes !== undefined ? notes : null]
    )
    const updated = await db.query(
      `SELECT * FROM distribution_entries WHERE id = $1`, [ent.id]
    )
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtPromo(updated.rows[0], contacts, documents) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: DELETE -------------------------------------------
app.delete('/collections/:collectionId/promo/:promoId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    try {
      const files = await db.query(`SELECT r2_key FROM files WHERE entry_id = $1`, [ent.id])
      await Promise.all(files.rows.map(f => r2.deleteFile(f.r2_key)))
    } catch {}
    await db.query(`DELETE FROM distribution_entries WHERE id = $1`, [ent.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: POST contact -------------------------------------
app.post('/collections/:collectionId/promo/:promoId/contacts', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const cRes = await db.query(
      `INSERT INTO contacts (id, user_id, name, email, role, phone, location, label_name, contact_notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const contact = cRes.rows[0]
    await db.query(
      `INSERT INTO entry_contacts (contact_id, entry_id) VALUES ($1, $2)`,
      [contact.id, ent.id]
    )
    res.json({ success: true, contact: {
      id: contact.id, name: contact.name, email: contact.email, role: contact.role,
      phone: contact.phone || '', location: contact.location || '',
      label: contact.label_name || '', notes: contact.contact_notes || '',
      createdAt: contact.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: PATCH contact ------------------------------------
app.patch('/collections/:collectionId/promo/:promoId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const check = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2`,
      [contactId, ent.id]
    )
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const cRes = await db.query(
      `UPDATE contacts SET name=$2, email=$3, role=$4, phone=$5, location=$6,
         label_name=$7, contact_notes=$8 WHERE id=$1 RETURNING *`,
      [contactId, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const c = cRes.rows[0]
    res.json({ success: true, contact: {
      id: c.id, name: c.name, email: c.email, role: c.role,
      phone: c.phone || '', location: c.location || '',
      label: c.label_name || '', notes: c.contact_notes || '',
      createdAt: c.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: DELETE contact -----------------------------------
app.delete('/collections/:collectionId/promo/:promoId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId, contactId } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const result = await db.query(
      `DELETE FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2 RETURNING contact_id`,
      [contactId, ent.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const others = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 LIMIT 1`, [contactId]
    )
    if (!others.rows.length) await db.query(`DELETE FROM contacts WHERE id = $1`, [contactId])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: POST file ----------------------------------------
app.post('/collections/:collectionId/promo/:promoId/files', authMiddleware, collectionPromoEntryUpload.single('file'), async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const key = `collections/${collectionId}/promo/${promoId}/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    await db.query(
      `INSERT INTO files (id, user_id, entry_id, category, filename, r2_key, size_bytes)
       VALUES (gen_random_uuid(), $1, $2, 'promo', $3, $4, $5)`,
      [req.user.id, ent.id, req.file.originalname, key, req.file.size]
    )
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: GET file -----------------------------------------
app.get('/collections/:collectionId/promo/:promoId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId, filename } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const fRes = await db.query(
      `SELECT r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    const r2Obj = await r2.getFile(fRes.rows[0].r2_key)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    r2Obj.Body.pipe(res)
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: DELETE file --------------------------------------
app.delete('/collections/:collectionId/promo/:promoId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId, filename } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    const fRes = await db.query(
      `SELECT id, r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    await r2.deleteFile(fRes.rows[0].r2_key)
    await db.query(`DELETE FROM files WHERE id = $1`, [fRes.rows[0].id])
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection promo entry: PATCH notes --------------------------------------
app.patch('/collections/:collectionId/promo/:promoId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, promoId } = req.params
    const ent = await getCollectionEntry(db, collectionId, promoId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Promo entry not found' })
    await db.query(
      `UPDATE distribution_entries SET page_notes = $2 WHERE id = $1`,
      [ent.id, req.body.notes || '']
    )
    res.json({ success: true, notes: req.body.notes || '' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// =============================================================================
// COLLECTIONS — LABEL / SUBMIT PER-ENTRY ENDPOINTS
// =============================================================================

// -- Collection label entry: GET ----------------------------------------------
app.get('/collections/:collectionId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtLabel(ent, contacts, documents), collectionId })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: PATCH --------------------------------------------
app.patch('/collections/:collectionId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const { label, status, signedDate, platform, notes } = req.body
    await db.query(
      `UPDATE distribution_entries SET
         label       = COALESCE($2, label),
         status      = COALESCE($3, status),
         signed_date = COALESCE($4, signed_date),
         platform    = COALESCE($5, platform),
         entry_notes = COALESCE($6, entry_notes)
       WHERE id = $1`,
      [ent.id, label || null, status || null,
       signedDate || null, platform || null, notes !== undefined ? notes : null]
    )
    const updated = await db.query(
      `SELECT * FROM distribution_entries WHERE id = $1`, [ent.id]
    )
    const { contacts, documents } = await fetchEntryContactsAndDocs(db, ent.id)
    res.json({ success: true, entry: fmtLabel(updated.rows[0], contacts, documents) })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: DELETE -------------------------------------------
app.delete('/collections/:collectionId/label/:labelId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    try {
      const files = await db.query(`SELECT r2_key FROM files WHERE entry_id = $1`, [ent.id])
      await Promise.all(files.rows.map(f => r2.deleteFile(f.r2_key)))
    } catch {}
    await db.query(`DELETE FROM distribution_entries WHERE id = $1`, [ent.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: POST contact -------------------------------------
app.post('/collections/:collectionId/label/:labelId/contacts', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const cRes = await db.query(
      `INSERT INTO contacts (id, user_id, name, email, role, phone, location, label_name, contact_notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const contact = cRes.rows[0]
    await db.query(
      `INSERT INTO entry_contacts (contact_id, entry_id) VALUES ($1, $2)`,
      [contact.id, ent.id]
    )
    res.json({ success: true, contact: {
      id: contact.id, name: contact.name, email: contact.email, role: contact.role,
      phone: contact.phone || '', location: contact.location || '',
      label: contact.label_name || '', notes: contact.contact_notes || '',
      createdAt: contact.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: PATCH contact ------------------------------------
app.patch('/collections/:collectionId/label/:labelId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const check = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2`,
      [contactId, ent.id]
    )
    if (!check.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const cRes = await db.query(
      `UPDATE contacts SET name=$2, email=$3, role=$4, phone=$5, location=$6,
         label_name=$7, contact_notes=$8 WHERE id=$1 RETURNING *`,
      [contactId, name, email || '', role || '', phone || '', location || '', label || '', notes || '']
    )
    const c = cRes.rows[0]
    res.json({ success: true, contact: {
      id: c.id, name: c.name, email: c.email, role: c.role,
      phone: c.phone || '', location: c.location || '',
      label: c.label_name || '', notes: c.contact_notes || '',
      createdAt: c.created_at
    }})
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: DELETE contact -----------------------------------
app.delete('/collections/:collectionId/label/:labelId/contacts/:contactId', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId, contactId } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const result = await db.query(
      `DELETE FROM entry_contacts WHERE contact_id = $1 AND entry_id = $2 RETURNING contact_id`,
      [contactId, ent.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Contact not found' })
    const others = await db.query(
      `SELECT 1 FROM entry_contacts WHERE contact_id = $1 LIMIT 1`, [contactId]
    )
    if (!others.rows.length) await db.query(`DELETE FROM contacts WHERE id = $1`, [contactId])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: POST file ----------------------------------------
app.post('/collections/:collectionId/label/:labelId/files', authMiddleware, collectionLabelEntryUpload.single('file'), async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const key = `collections/${collectionId}/label/${labelId}/${req.file.originalname}`
    await r2.uploadFile(key, req.file.buffer, req.file.mimetype)
    await db.query(
      `INSERT INTO files (id, user_id, entry_id, category, filename, r2_key, size_bytes)
       VALUES (gen_random_uuid(), $1, $2, 'label', $3, $4, $5)`,
      [req.user.id, ent.id, req.file.originalname, key, req.file.size]
    )
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: GET file -----------------------------------------
app.get('/collections/:collectionId/label/:labelId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId, filename } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const fRes = await db.query(
      `SELECT r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    const r2Obj = await r2.getFile(fRes.rows[0].r2_key)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    r2Obj.Body.pipe(res)
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: DELETE file --------------------------------------
app.delete('/collections/:collectionId/label/:labelId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId, filename } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    const fRes = await db.query(
      `SELECT id, r2_key FROM files WHERE entry_id = $1 AND filename = $2 LIMIT 1`,
      [ent.id, filename]
    )
    if (!fRes.rows.length) return res.status(404).json({ success: false, error: 'File not found' })
    await r2.deleteFile(fRes.rows[0].r2_key)
    await db.query(`DELETE FROM files WHERE id = $1`, [fRes.rows[0].id])
    const docs = await db.query(
      `SELECT filename, size_bytes AS size, created_at AS "uploadedAt"
       FROM files WHERE entry_id = $1 ORDER BY created_at ASC`, [ent.id]
    )
    res.json({ success: true, documents: docs.rows })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})

// -- Collection label entry: PATCH notes --------------------------------------
app.patch('/collections/:collectionId/label/:labelId/notes', authMiddleware, async (req, res) => {
  try {
    const db = require('./db')
    const { collectionId, labelId } = req.params
    const ent = await getCollectionEntry(db, collectionId, labelId, req.user.id)
    if (!ent) return res.status(404).json({ success: false, error: 'Label submission not found' })
    await db.query(
      `UPDATE distribution_entries SET page_notes = $2 WHERE id = $1`,
      [ent.id, req.body.notes || '']
    )
    res.json({ success: true, notes: req.body.notes || '' })
  } catch (err) { res.status(500).json({ success: false, error: err.message }) }
})


// =============================================================================
// ERROR HANDLER
// =============================================================================

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' })
})

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`✅ Release Management API running on http://localhost:${PORT}`)
})
