// =============================================================================
// MUSIC AGENT - Release Management API
// =============================================================================
// Run:    cd ~/Documents/music-agent-mvp/file-handler && node server.js
// Port:   http://localhost:3001
// Health: curl http://localhost:3001/health
// =============================================================================

const express        = require('express')
const multer         = require('multer')
const cors           = require('cors')
const path           = require('path')
const fs             = require('fs').promises
const fsSync         = require('fs')
const os             = require('os')
const { randomUUID } = require('crypto')
const checkDiskSpace = require('check-disk-space').default
const musicMetadata = require('music-metadata')

// =============================================================================
// SETUP & PATHS
// =============================================================================

const app  = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const RELEASES_BASE   = path.join(os.homedir(), 'Documents', 'Music Agent')
const RELEASES_DIR    = path.join(RELEASES_BASE, 'Releases')
const COLLECTIONS_PATH = path.join(os.homedir(), 'Documents', 'Music Agent', 'Collections')
const SETTINGS_PATH   = path.join(os.homedir(), 'Documents', 'music-agent-mvp', 'file-handler', 'settings.json')

app.use('/releases', express.static(RELEASES_BASE))

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

async function validateAudioFile(filePath) {
  try {
    const metadata = await musicMetadata.parseFile(filePath)
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

async function readCollection(collectionId) {
  const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
  const data = await fs.readFile(filePath, 'utf8')
  return JSON.parse(data)
}

async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, 'utf8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// =============================================================================
// MULTER INSTANCES
// =============================================================================

// Main upload (audio / artwork / video for releases)
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const releaseId  = requireReleaseId(req)
      const fileType   = classify(file)
      const releasePath = path.join(RELEASES_DIR, releaseId)
      let targetFolder
      if (fileType === 'audio') {
        const { versionId } = getVersionInfo(req)
        targetFolder = path.join(releasePath, 'versions', versionId, 'audio')
      } else if (fileType === 'artwork') {
        targetFolder = path.join(releasePath, 'artwork')
      } else if (fileType === 'video') {
        targetFolder = path.join(releasePath, 'video')
      } else {
        targetFolder = releasePath
      }
      fsSync.mkdirSync(targetFolder, { recursive: true })
      cb(null, targetFolder)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Track artwork (saves as artwork.ext, replaces old)
const trackArtworkUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'artwork')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, `artwork${path.extname(file.originalname)}`) }
  })
})

// Release notes files
const releaseNotesUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'notes')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Release label-deal files
const releaseLabelDealUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'label-deal')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Per-promo-entry files
const promoEntryUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'promo', req.params.promoId)
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Per-label-entry files
const labelEntryUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'label', req.params.labelId)
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Release promo-deal files
const releasePromoDealUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'promo-deal')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Collection artwork
const collectionUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'artwork')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, `artwork${path.extname(file.originalname)}`) }
  })
})

// Collection notes files
const collectionNotesUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'notes')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Collection label-deal files
const collectionLabelDealUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'label-deal')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Collection promo-deal files
const collectionPromoDealUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'promo-deal')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Per-collection-promo-entry files
const collectionPromoEntryUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'promo', req.params.promoId)
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// Per-collection-label-entry files
const collectionLabelEntryUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'label', req.params.labelId)
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

// =============================================================================
// HEALTH
// =============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Release management API is running' })
})

// =============================================================================
// SETTINGS
// =============================================================================

app.get('/settings', async (req, res) => {
  const settings = await readSettings()
  res.json({ success: true, settings })
})

app.patch('/settings', async (req, res) => {
  const updated = { ...(await readSettings()), ...req.body }
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2))
  res.json({ success: true, settings: updated })
})

// =============================================================================
// STORAGE STATUS
// =============================================================================

app.get('/storage/status', async (req, res) => {
  try {
    const diskSpace  = await checkDiskSpace(RELEASES_BASE)
    const totalGB    = (diskSpace.size / 1024 ** 3).toFixed(2)
    const freeGB     = (diskSpace.free / 1024 ** 3).toFixed(2)
    const usedGB     = (totalGB - freeGB).toFixed(2)
    const usedPercent = ((usedGB / totalGB) * 100).toFixed(1)
    res.json({
      disk: { totalGB: parseFloat(totalGB), usedGB: parseFloat(usedGB), freeGB: parseFloat(freeGB), usedPercent: parseFloat(usedPercent) },
      warning: diskSpace.free < 10 * 1024 ** 3 ? 'Low disk space! Less than 10GB remaining.' : null,
      releasesPath: RELEASES_BASE
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check disk space' })
  }
})

// =============================================================================
// FILE UPLOAD
// =============================================================================

app.post('/upload', upload.any(), async (req, res) => {
  try {
    const releaseId = requireReleaseId(req)
    const { artist, title, genre } = req.query
    const { versionName, versionId } = getVersionInfo(req)

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, error: 'No files uploaded' })

    const releasePath  = path.join(RELEASES_DIR, releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')

    let metadata = {}
    try {
      metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    } catch {}

    if (!metadata.versions) metadata.versions = {}

    if (metadata.versions[versionId]) {
      const audioPath = path.join(releasePath, 'versions', versionId, 'audio')
      let existing = []
      try { existing = await fs.readdir(audioPath) } catch {}
      if (existing.length > 0)
        return res.status(409).json({ success: false, error: `Version "${versionName}" already exists`, existingVersion: metadata.versions[versionId] })
    }

    const savedFiles = { audio: [], artwork: [], video: [] }

    for (const file of req.files) {
      const fileType = classify(file)
      if (fileType === 'audio') {
        const validation = await validateAudioFile(file.path)
        if (!validation.valid) {
          await fs.unlink(file.path)
          return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
        }
        savedFiles.audio.push({
          filename: file.originalname, size: file.size, mimetype: file.mimetype,
          duration: validation.metadata.duration, bitrate: validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate, channels: validation.metadata.channels, codec: validation.metadata.codec
        })
      } else {
        savedFiles[fileType]?.push({ filename: file.originalname, size: file.size, mimetype: file.mimetype })
      }
    }

    metadata.versions[versionId] = { versionName, versionId, createdAt: new Date().toISOString(), files: savedFiles }
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, message: `Files uploaded for ${versionName}`, releaseId, versionId, versionName, files: savedFiles, artist, title, genre })
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — METADATA
// =============================================================================

app.post('/metadata', async (req, res) => {
  try {
    const { releaseId, ...metadata } = req.body
    if (!releaseId) return res.status(400).json({ success: false, error: 'Missing releaseId' })

    const releasePath  = path.join(RELEASES_DIR, releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    await fs.mkdir(releasePath, { recursive: true })

    let existing = {}
    try { existing = JSON.parse(await fs.readFile(metadataPath, 'utf8')) } catch {}

    await fs.writeFile(metadataPath, JSON.stringify({ ...existing, ...metadata, releaseId, updatedAt: new Date().toISOString() }, null, 2))
    res.json({ success: true, message: 'Metadata saved', releaseId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/metadata', async (req, res) => {
  try {
    const { releaseId } = req.params
    const updates = req.body
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')

    const exists = await fs.access(metadataPath).then(() => true).catch(() => false)
    if (!exists) return res.status(404).json({ success: false, error: 'Release not found' })

    const existing = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (existing.metadata) {
      existing.metadata = { ...existing.metadata, ...updates, releaseId: existing.metadata.releaseId }
      const metaFields = ['genre', 'artist', 'title', 'bpm', 'key', 'trackDate', 'releaseDate', 'releaseFormat', 'releaseType']
      metaFields.forEach(f => { if (existing[f] !== undefined && existing.metadata[f] !== undefined) delete existing[f] })
    } else {
      Object.assign(existing, updates)
      existing.releaseId = releaseId
    }

    existing.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(existing, null, 2))
    res.json({ success: true, release: existing })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// RELEASES — LIST & GET
// =============================================================================

app.get('/releases/', async (req, res) => {
  try {
    const folders  = await fs.readdir(RELEASES_DIR)
    const releases = []

    for (const folder of folders) {
      if (folder.startsWith('.')) continue
      const folderPath = path.join(RELEASES_DIR, folder)
      const stats = await fs.stat(folderPath)
      if (!stats.isDirectory()) continue

      try {
        const parsed  = JSON.parse(await fs.readFile(path.join(folderPath, 'metadata.json'), 'utf8'))
        const metadata = parsed.metadata || parsed
        const versions = parsed.versions || {}
        const files    = (versions.primary || {}).files || {}

        releases.push({
          releaseId:    parsed.releaseId || metadata.releaseId || folder,
          artist:       metadata.artist,
          title:        metadata.title,
          genre:        metadata.genre,
          bpm:          metadata.bpm,
          key:          metadata.key,
          releaseDate:  metadata.releaseDate || metadata.trackDate,
          releaseType:  metadata.releaseType || metadata.releaseFormat,
          releaseFormat: metadata.releaseFormat || metadata.releaseType,
          collectionId: metadata.collectionId || null,
          createdAt:    metadata.createdAt,
          versionCount: Object.keys(versions).length,
          fileCounts: {
            audio:   files.audio?.length   || 0,
            artwork: files.artwork?.length  || 0,
            video:   files.video?.length   || 0
          },
          distribution: metadata.distribution || { release: [], submit: [], promote: [] }
        })
      } catch {
        releases.push({ releaseId: folder, error: 'No metadata.json found', createdAt: stats.birthtime })
      }
    }

    releases.sort((a, b) => new Date(b.releaseDate || b.createdAt) - new Date(a.releaseDate || a.createdAt))
    res.json({ success: true, count: releases.length, releases })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/releases/:releaseId/', async (req, res) => {
  try {
    const releaseId    = requireReleaseId(req)
    const releasePath  = path.join(RELEASES_DIR, releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')

    try { await fs.access(releasePath) }
    catch { return res.status(404).json({ success: false, error: `Release not found: ${releaseId}` }) }

    const parsed   = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    const metadata = parsed.metadata || parsed
    const versions = parsed.versions || {}

    res.json({
      success: true,
      release: {
        releaseId:        parsed.releaseId || metadata.releaseId,
        artist:           metadata.artist,
        title:            metadata.title,
        genre:            metadata.genre,
        bpm:              metadata.bpm,
        key:              metadata.key,
        releaseDate:      metadata.releaseDate || metadata.trackDate,
        releaseType:      metadata.releaseType || metadata.releaseFormat,
        releaseFormat:    metadata.releaseFormat || metadata.releaseType,
        collectionId:     metadata.collectionId || null,
        partOfCollection: metadata.partOfCollection || null,
        trackType:        metadata.trackType,
        trackDate:        metadata.trackDate,
        createdAt:        metadata.createdAt,
        updatedAt:        parsed.updatedAt,
        versions,
        files:            metadata.files,
        distribution:     metadata.distribution || { release: [], submit: [], promote: [] },
        notes:            parsed.notes || { text: '', documents: [] },
        songLinks:        parsed.songLinks || []
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId', async (req, res) => {
  try {
    const releasePath = path.join(RELEASES_DIR, req.params.releaseId)
    try { await fs.access(releasePath) }
    catch { return res.status(404).json({ error: 'Release not found' }) }
    await fs.rm(releasePath, { recursive: true, force: true })
    res.json({ success: true, message: `Release ${req.params.releaseId} deleted` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — ARTWORK
// =============================================================================

app.get('/releases/:releaseId/artwork/', (req, res) => {
  const artworkPath  = path.join(RELEASES_DIR, req.params.releaseId, 'artwork')
  if (!fsSync.existsSync(artworkPath)) return res.status(404).json({ error: 'No artwork found' })
  const files = fsSync.readdirSync(artworkPath)
  if (files.length === 0) return res.status(404).json({ error: 'No artwork files found' })
  res.sendFile(path.join(artworkPath, files[0]))
})

app.post('/releases/:releaseId/artwork', trackArtworkUpload.single('artwork'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const artworkDir = path.join(RELEASES_DIR, releaseId, 'artwork')
    try {
      const files = await fs.readdir(artworkDir)
      for (const file of files) {
        if (file !== req.file.filename) await fs.unlink(path.join(artworkDir, file))
      }
    } catch {}

    try {
      const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
      const raw = await fs.readFile(metadataPath, 'utf8')
      const metadata = JSON.parse(raw)
      const meta = metadata.metadata || metadata
      meta.fileCounts = { ...(meta.fileCounts || {}), artwork: 1 }
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    } catch {}

    res.json({ success: true, filename: req.file.filename })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/releases/:releaseId/artwork', async (req, res) => {
  try {
    const artworkDir   = path.join(RELEASES_DIR, req.params.releaseId, 'artwork')
    const metadataPath = path.join(RELEASES_DIR, req.params.releaseId, 'metadata.json')
    try {
      const files = await fs.readdir(artworkDir)
      for (const file of files) await fs.unlink(path.join(artworkDir, file))
    } catch { return res.status(404).json({ success: false, error: 'No artwork found' }) }

    try {
      const raw = await fs.readFile(metadataPath, 'utf8')
      const metadata = JSON.parse(raw)
      const meta = metadata.metadata || metadata
      meta.fileCounts = { ...(meta.fileCounts || {}), artwork: 0 }
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    } catch {}

    res.json({ success: true, message: 'Artwork deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// RELEASES — VERSIONS
// =============================================================================

app.post('/releases/:releaseId/versions',
  (req, res, next) => {
    try { requireReleaseId(req); next() }
    catch (error) { res.status(error.statusCode || 500).json({ success: false, error: error.message }) }
  },
  upload.any(),
  async (req, res) => {
    try {
      const releaseId   = requireReleaseId(req)
      const { versionName, versionId } = getVersionInfo(req)

      if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, error: 'No audio files uploaded' })

      const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
      const metadata     = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

      if (metadata.versions?.[versionId])
        return res.status(409).json({ success: false, error: `Version "${versionName}" already exists`, existingVersion: metadata.versions[versionId] })

      const savedFiles = { audio: [], artwork: [], video: [] }

      for (const file of req.files) {
        const fileType = classify(file)
        if (fileType === 'audio') {
          const validation = await validateAudioFile(file.path)
          if (!validation.valid) {
            await fs.unlink(file.path)
            return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
          }
          savedFiles.audio.push({
            filename: file.originalname, size: file.size, mimetype: file.mimetype,
            duration: validation.metadata.duration, bitrate: validation.metadata.bitrate,
            sampleRate: validation.metadata.sampleRate, channels: validation.metadata.channels, codec: validation.metadata.codec
          })
        } else {
          await fs.unlink(file.path)
          return res.status(400).json({ success: false, error: `Only audio files allowed. Received: ${fileType}`, file: file.originalname })
        }
      }

      if (!metadata.versions) metadata.versions = {}
      metadata.versions[versionId] = { versionName, versionId, createdAt: new Date().toISOString(), files: savedFiles }
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

      res.json({ success: true, message: `Version "${versionName}" added`, releaseId, versionId, versionName, files: savedFiles })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
)

app.delete('/releases/:releaseId/versions/primary/audio/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const filePath = path.join(RELEASES_DIR, releaseId, 'versions', 'primary', 'audio', filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    await fs.unlink(filePath)

    try {
      const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      if (metadata.versions?.primary?.files?.audio) {
        metadata.versions.primary.files.audio = metadata.versions.primary.files.audio.filter(f => f.filename !== filename)
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      }
    } catch {}

    res.json({ success: true, message: `${filename} deleted` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
// DELETE /releases/:releaseId/video/:filename
app.delete('/releases/:releaseId/video/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const filePath = path.join(RELEASES_DIR, releaseId, 'video', filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    await fs.unlink(filePath)
    try {
      const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      if (metadata.versions?.primary?.files?.video) {
        metadata.versions.primary.files.video =
          metadata.versions.primary.files.video.filter(f => f.filename !== filename)
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      }
    } catch {}
    res.json({ success: true, message: `${filename} deleted` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
// POST /releases/:releaseId/versions/primary/audio
// Add audio file(s) to an existing primary version (no duplicate-version check)
app.post('/releases/:releaseId/versions/primary/audio',
  (req, res, next) => {
    try { requireReleaseId(req); next() }
    catch (err) { res.status(err.statusCode || 500).json({ success: false, error: err.message }) }
  },
  upload.any(),
  async (req, res) => {
    try {
      const { releaseId } = req.params
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, error: 'No files uploaded' })

      const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

      if (!metadata.versions) metadata.versions = {}
      if (!metadata.versions.primary) {
        metadata.versions.primary = {
          versionName: 'Primary Version',
          versionId: 'primary',
          createdAt: new Date().toISOString(),
          files: { audio: [], artwork: [], video: [] }
        }
      }
      if (!metadata.versions.primary.files)        metadata.versions.primary.files = {}
      if (!metadata.versions.primary.files.audio)  metadata.versions.primary.files.audio = []

      const added = []
      for (const file of req.files) {
        const fileType = classify(file)
        if (fileType !== 'audio') {
          await fs.unlink(file.path)
          return res.status(400).json({ success: false, error: `Only audio files allowed. Got: ${file.originalname}` })
        }
        const validation = await validateAudioFile(file.path)
        if (!validation.valid) {
          await fs.unlink(file.path)
          return res.status(400).json({ success: false, error: validation.error, file: file.originalname })
        }
        const fileEntry = {
          filename:   file.originalname,
          size:       file.size,
          mimetype:   file.mimetype,
          duration:   validation.metadata.duration,
          bitrate:    validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate,
          channels:   validation.metadata.channels,
          codec:      validation.metadata.codec
        }
        metadata.versions.primary.files.audio.push(fileEntry)
        added.push(fileEntry)
      }

      metadata.updatedAt = new Date().toISOString()
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      res.json({ success: true, added, totalAudioFiles: metadata.versions.primary.files.audio.length })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
)

// POST /releases/:releaseId/video
// Upload a video file — completely separate from the versions system
const videoUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(RELEASES_DIR, req.params.releaseId, 'video')
      fsSync.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(req, file, cb) { cb(null, file.originalname) }
  })
})

app.post('/releases/:releaseId/video', videoUpload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.versions)                          metadata.versions = {}
    if (!metadata.versions.primary)                  metadata.versions.primary = { versionName: 'Primary Version', versionId: 'primary', createdAt: new Date().toISOString(), files: { audio: [], artwork: [], video: [] } }
    if (!metadata.versions.primary.files)            metadata.versions.primary.files = {}
    if (!metadata.versions.primary.files.video)      metadata.versions.primary.files.video = []

    const fileEntry = { filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype }
    metadata.versions.primary.files.video.push(fileEntry)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, file: fileEntry })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// RELEASES — DISTRIBUTION
// =============================================================================

app.patch('/releases/:releaseId/distribution', async (req, res) => {
  try {
    const releaseId  = requireReleaseId(req)
    const { path: distPath, entry } = req.body

    if (!distPath || !entry) return res.status(400).json({ success: false, error: 'Missing path and entry' })
    if (!['release', 'submit', 'promote'].includes(distPath))
      return res.status(400).json({ success: false, error: 'path must be: release, submit, or promote' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const parsed = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!parsed.metadata) parsed.metadata = {}
    if (!parsed.metadata.distribution) parsed.metadata.distribution = { release: [], submit: [], promote: [] }
    if (!parsed.metadata.distribution[distPath]) parsed.metadata.distribution[distPath] = []

    if (['submit', 'promote'].includes(distPath)) {
      if (!entry.id) entry.id = randomUUID().slice(0, 8)
      if (!entry.contacts) entry.contacts = []
      if (!entry.documents) entry.documents = []
      if (entry.pageNotes === undefined) entry.pageNotes = ''
    }

    entry.timestamp = entry.timestamp || new Date().toISOString()
    parsed.metadata.distribution[distPath].push(entry)
    parsed.updatedAt = new Date().toISOString()

    await fs.writeFile(metadataPath, JSON.stringify(parsed, null, 2))
    res.json({ success: true, distribution: parsed.metadata.distribution })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { releaseId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid path type' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata?.distribution?.[pathType])
      return res.status(404).json({ success: false, error: 'Distribution path not found' })

    const entries = metadata.metadata.distribution[pathType]
    const idx = entries.findIndex(e => e.timestamp === timestamp)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Entry not found' })

    metadata.metadata.distribution[pathType][idx] = {
      ...entries[idx], ...req.body,
      timestamp: entries[idx].timestamp,
      updatedAt: new Date().toISOString()
    }

    const updatedEntry = metadata.metadata.distribution[pathType][idx]
    if (pathType === 'submit' && updatedEntry.status === 'Signed' && updatedEntry.signedDate) {
      if (!metadata.metadata.labelInfo) metadata.metadata.labelInfo = {}
      metadata.metadata.labelInfo.isSigned = true
      metadata.metadata.labelInfo.label = updatedEntry.label
      metadata.metadata.labelInfo.signedDate = updatedEntry.signedDate
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, entry: updatedEntry })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { releaseId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid path type' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata?.distribution?.[pathType])
      return res.status(404).json({ success: false, error: 'Distribution path not found' })

    const entries = metadata.metadata.distribution[pathType]
    const entryToDelete = entries.find(e => e.timestamp === timestamp)
    const wasSignedSubmission = pathType === 'submit' && entryToDelete?.status === 'signed'

    metadata.metadata.distribution[pathType] = entries.filter(e => e.timestamp !== timestamp)
    if (metadata.metadata.distribution[pathType].length === entries.length)
      return res.status(404).json({ success: false, error: 'Entry not found' })

    if (wasSignedSubmission) {
      if (!metadata.metadata.labelInfo) metadata.metadata.labelInfo = {}
      metadata.metadata.labelInfo.isSigned   = false
      metadata.metadata.labelInfo.label      = null
      metadata.metadata.labelInfo.signedDate = null
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, message: 'Entry deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/sign', async (req, res) => {
  try {
    const { releaseId } = req.params
    const { labelName, signedDate } = req.body
    if (!labelName) return res.status(400).json({ success: false, error: 'Label name required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    try { await fs.access(metadataPath) }
    catch { return res.status(404).json({ success: false, error: 'Release not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata) metadata.metadata = {}
    if (!metadata.metadata.distribution) metadata.metadata.distribution = { release: [], submit: [], promote: [] }
    if (!metadata.metadata.distribution.submit) metadata.metadata.distribution.submit = []

    const submission = metadata.metadata.distribution.submit.find(s => s.label === labelName)
    if (!submission) return res.status(404).json({ success: false, error: `No submission found for label: ${labelName}` })

    submission.status   = 'signed'
    submission.signedAt = new Date().toISOString()

    if (!metadata.metadata.labelInfo) metadata.metadata.labelInfo = {}
    metadata.metadata.labelInfo.isSigned   = true
    metadata.metadata.labelInfo.label      = labelName
    metadata.metadata.labelInfo.signedDate = signedDate || new Date().toISOString()
    metadata.updatedAt = new Date().toISOString()

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, message: `Marked as signed by ${labelName}`, submission })
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

// -- Promo entry: GET one -----------------------------------------------------
app.get('/releases/:releaseId/promo/:promoId', async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    res.json({ success: true, entry, releaseId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Promo entry: PATCH top-level fields -------------------------------------
app.patch('/releases/:releaseId/promo/:promoId', async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const idx = entries.findIndex(e => e.id === promoId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    const existing = entries[idx]
    ensurePromoEntryDefaults(existing)

    const allowed = ['promoName', 'status', 'liveDate', 'notes', 'platform']
    const updates = {}
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key]
      }
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      timestamp: existing.timestamp,
      contacts: existing.contacts,
      documents: existing.documents,
      pageNotes: existing.pageNotes
    }

    metadata.metadata.distribution.promote[idx] = updated
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, entry: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Promo entry: DELETE ------------------------------------------------------
app.delete('/releases/:releaseId/promo/:promoId', async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const originalLength = entries.length
    metadata.metadata.distribution.promote = entries.filter(e => e.id !== promoId)
    if (metadata.metadata.distribution.promote.length === originalLength)
      return res.status(404).json({ success: false, error: 'Promo entry not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    const folderPath = path.join(RELEASES_DIR, releaseId, 'promo', promoId)
    try {
      await fs.rm(folderPath, { recursive: true, force: true })
    } catch {}

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Promo entry: contacts ----------------------------------------------------
app.post('/releases/:releaseId/promo/:promoId/contacts', async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const idx = entries.findIndex(e => e.id === promoId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    const entry = entries[idx]
    ensurePromoEntryDefaults(entry)

    const newContact = {
      id: randomUUID(),
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    entry.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/promo/:promoId/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, promoId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    const idx = entry.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Contact not found' })

    entry.contacts[idx] = {
      ...entry.contacts[idx],
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: entry.contacts[idx] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/promo/:promoId/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, promoId, contactId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    const original = entry.contacts.length
    entry.contacts = entry.contacts.filter(c => c.id !== contactId)
    if (entry.contacts.length === original)
      return res.status(404).json({ success: false, error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Promo entry: documents ---------------------------------------------------
app.post('/releases/:releaseId/promo/:promoId/files', promoEntryUpload.single('file'), async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)

    entry.documents.push({
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/releases/:releaseId/promo/:promoId/files/:filename', async (req, res) => {
  try {
    const { releaseId, promoId, filename } = req.params
    const filePath = path.join(RELEASES_DIR, releaseId, 'promo', promoId, filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fsSync.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/promo/:promoId/files/:filename', async (req, res) => {
  try {
    const { releaseId, promoId, filename } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)

    const filePath = path.join(RELEASES_DIR, releaseId, 'promo', promoId, filename)
    try { await fs.unlink(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }

    entry.documents = entry.documents.filter(d => d.filename !== filename)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Promo entry: page notes --------------------------------------------------
app.patch('/releases/:releaseId/promo/:promoId/notes', async (req, res) => {
  try {
    const { releaseId, promoId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    entry.pageNotes = req.body.notes || ''
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, notes: entry.pageNotes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: GET one ---------------------------------------------
app.get('/releases/:releaseId/label/:labelId', async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    res.json({ success: true, entry, releaseId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: PATCH top-level fields ------------------------------
app.patch('/releases/:releaseId/label/:labelId', async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const idx = entries.findIndex(e => e.id === labelId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Label submission not found' })

    const existing = entries[idx]
    ensureLabelEntryDefaults(existing)

    const allowed = ['label', 'status', 'signedDate', 'notes', 'platform']
    const updates = {}
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key]
      }
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      timestamp: existing.timestamp,
      contacts: existing.contacts,
      documents: existing.documents,
      pageNotes: existing.pageNotes
    }

    metadata.metadata.distribution.submit[idx] = updated
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, entry: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: DELETE ----------------------------------------------
app.delete('/releases/:releaseId/label/:labelId', async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const originalLength = entries.length
    metadata.metadata.distribution.submit = entries.filter(e => e.id !== labelId)
    if (metadata.metadata.distribution.submit.length === originalLength)
      return res.status(404).json({ success: false, error: 'Label submission not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    const folderPath = path.join(RELEASES_DIR, releaseId, 'label', labelId)
    try {
      await fs.rm(folderPath, { recursive: true, force: true })
    } catch {}

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: contacts --------------------------------------------
app.post('/releases/:releaseId/label/:labelId/contacts', async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    const newContact = {
      id: randomUUID(),
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    entry.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/releases/:releaseId/label/:labelId/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, labelId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    const idx = entry.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Contact not found' })

    entry.contacts[idx] = {
      ...entry.contacts[idx],
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: entry.contacts[idx] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/label/:labelId/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, labelId, contactId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    const original = entry.contacts.length
    entry.contacts = entry.contacts.filter(c => c.id !== contactId)
    if (entry.contacts.length === original)
      return res.status(404).json({ success: false, error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: documents -------------------------------------------
app.post('/releases/:releaseId/label/:labelId/files', labelEntryUpload.single('file'), async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    entry.documents.push({
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/releases/:releaseId/label/:labelId/files/:filename', async (req, res) => {
  try {
    const { releaseId, labelId, filename } = req.params
    const filePath = path.join(RELEASES_DIR, releaseId, 'label', labelId, filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fsSync.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/releases/:releaseId/label/:labelId/files/:filename', async (req, res) => {
  try {
    const { releaseId, labelId, filename } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    const filePath = path.join(RELEASES_DIR, releaseId, 'label', labelId, filename)
    try { await fs.unlink(filePath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }

    entry.documents = entry.documents.filter(d => d.filename !== filename)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Label/submit entry: page notes ------------------------------------------
app.patch('/releases/:releaseId/label/:labelId/notes', async (req, res) => {
  try {
    const { releaseId, labelId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const raw = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(raw)

    ensureDistributionStructure(metadata)
    const entries = metadata.metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    entry.pageNotes = req.body.notes || ''
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, notes: entry.pageNotes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// RELEASES — FILE DOWNLOAD
// =============================================================================

app.get('/releases/:releaseId/files/:fileType/:filename', async (req, res) => {
  try {
    const { releaseId, fileType, filename } = req.params
    if (!['audio', 'artwork', 'video'].includes(fileType))
      return res.status(400).json({ error: 'Invalid file type' })

    const releasePath = path.join(RELEASES_DIR, releaseId)
    const candidates  = [
      path.join(releasePath, fileType, filename),
      path.join(releasePath, 'versions', 'primary', fileType, filename)
    ]

    let filePath = null
    for (const p of candidates) {
      try { await fs.access(p); filePath = p; break } catch {}
    }
    if (!filePath) return res.status(404).json({ error: 'File not found' })

    const ext = path.extname(filename).toLowerCase()
    const contentTypes = {
      '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.aiff': 'audio/aiff',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
      '.mp4': 'video/mp4', '.mov': 'video/quicktime'
    }
    if (contentTypes[ext]) res.setHeader('Content-Type', contentTypes[ext])
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fsSync.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — NOTES
// =============================================================================

app.patch('/releases/:releaseId/notes', async (req, res) => {
  try {
    const { releaseId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    try { await fs.access(metadataPath) }
    catch { return res.status(404).json({ error: 'Release not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.notes) metadata.notes = { text: '', documents: [] }
    metadata.notes.text = req.body.notes || ''
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, notes: metadata.notes.text })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/releases/:releaseId/notes/files', releaseNotesUpload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.notes) metadata.notes = { text: '', documents: [] }
    if (!metadata.notes.documents) metadata.notes.documents = []

    metadata.notes.documents.push({ filename: req.file.originalname, size: req.file.size, uploadedAt: new Date().toISOString() })
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ documents: metadata.notes.documents })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/releases/:releaseId/notes/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(RELEASES_DIR, req.params.releaseId, 'notes', req.params.filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ error: 'File not found' }) }
    res.download(filePath)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/releases/:releaseId/notes/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const filePath     = path.join(RELEASES_DIR, releaseId, 'notes', filename)
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')

    await fs.unlink(filePath)
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (metadata.notes?.documents) {
      metadata.notes.documents = metadata.notes.documents.filter(d => d.filename !== filename)
    }
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ documents: metadata.notes?.documents || [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — SONG LINKS
// =============================================================================

app.post('/releases/:releaseId/song-links', async (req, res) => {
  try {
    const { releaseId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    try { await fs.access(metadataPath) }
    catch { return res.status(404).json({ error: 'Release not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.songLinks) metadata.songLinks = []
    metadata.songLinks.push(req.body)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json(metadata)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add song link' })
  }
})

app.delete('/releases/:releaseId/song-links/:linkId', async (req, res) => {
  try {
    const { releaseId, linkId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    try { await fs.access(metadataPath) }
    catch { return res.status(404).json({ error: 'Release not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.songLinks) return res.status(404).json({ error: 'No song links found' })
    metadata.songLinks = metadata.songLinks.filter(l => l.id !== linkId)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json(metadata)
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete song link' })
  }
})

// =============================================================================
// RELEASES — LABEL DEAL FILES
// =============================================================================

app.post('/releases/:releaseId/label-deal/files', releaseLabelDealUpload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata.labelInfo) metadata.metadata.labelInfo = {}
    if (!metadata.metadata.labelInfo.contractDocuments) metadata.metadata.labelInfo.contractDocuments = []

    metadata.metadata.labelInfo.contractDocuments.push({ filename: req.file.originalname, uploadedAt: new Date().toISOString(), size: req.file.size })
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, file: { filename: req.file.originalname, size: req.file.size } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/releases/:releaseId/label-deal/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(RELEASES_DIR, req.params.releaseId, 'label-deal', req.params.filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`)
    fsSync.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/releases/:releaseId/label-deal/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const filePath     = path.join(RELEASES_DIR, releaseId, 'label-deal', filename)
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')

    try { await fs.unlink(filePath) }
    catch { return res.status(404).json({ error: 'File not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (metadata.metadata.labelInfo?.contractDocuments) {
      metadata.metadata.labelInfo.contractDocuments = metadata.metadata.labelInfo.contractDocuments.filter(d => d.filename !== filename)
    }
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — PROMO DEAL FILES
// =============================================================================

app.post('/releases/:releaseId/promo-deal/files', releasePromoDealUpload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata) metadata.metadata = {}
    if (!metadata.metadata.promoInfo) {
      metadata.metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }
    if (!metadata.metadata.promoInfo.contractDocuments) {
      metadata.metadata.promoInfo.contractDocuments = []
    }

    metadata.metadata.promoInfo.contractDocuments.push({
      filename:   req.file.originalname,
      uploadedAt: new Date().toISOString(),
      size:       req.file.size
    })
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, file: { filename: req.file.originalname, size: req.file.size } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/releases/:releaseId/promo-deal/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(RELEASES_DIR, req.params.releaseId, 'promo-deal', req.params.filename)
    try { await fs.access(filePath) }
    catch { return res.status(404).json({ error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`)
    fsSync.createReadStream(filePath).pipe(res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/releases/:releaseId/promo-deal/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    const filePath     = path.join(RELEASES_DIR, releaseId, 'promo-deal', filename)
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')

    try { await fs.unlink(filePath) }
    catch { return res.status(404).json({ error: 'File not found' }) }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata) metadata.metadata = {}
    if (!metadata.metadata.promoInfo) {
      metadata.metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }

    if (metadata.metadata.promoInfo.contractDocuments) {
      metadata.metadata.promoInfo.contractDocuments =
        metadata.metadata.promoInfo.contractDocuments.filter(d => d.filename !== filename)
    }
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — LABEL DEAL CONTACTS
// =============================================================================

app.post('/releases/:releaseId/label-deal/contacts', async (req, res) => {
  try {
    const { releaseId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata.labelInfo) metadata.metadata.labelInfo = {}
    if (!metadata.metadata.labelInfo.contacts) metadata.metadata.labelInfo.contacts = []

    const newContact = {
      id: Date.now().toString(), name,
      label:    label    || metadata.metadata.labelInfo.label || '',
      email:    email    || '', phone:    phone    || '',
      location: location || '', role:     role     || '', notes: notes || '',
      lastContact: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    metadata.metadata.labelInfo.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/releases/:releaseId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata.labelInfo?.contacts) return res.status(404).json({ error: 'No contacts found' })

    const idx = metadata.metadata.labelInfo.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ error: 'Contact not found' })

    metadata.metadata.labelInfo.contacts[idx] = {
      ...metadata.metadata.labelInfo.contacts[idx],
      name, label: label || '', email: email || '', phone: phone || '',
      location: location || '', role: role || '', notes: notes || '',
      updatedAt: new Date().toISOString()
    }
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: metadata.metadata.labelInfo.contacts[idx] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/releases/:releaseId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    if (!metadata.metadata.labelInfo?.contacts) return res.status(404).json({ error: 'No contacts found' })

    const original = metadata.metadata.labelInfo.contacts.length
    metadata.metadata.labelInfo.contacts = metadata.metadata.labelInfo.contacts.filter(c => c.id !== contactId)
    if (metadata.metadata.labelInfo.contacts.length === original) return res.status(404).json({ error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// RELEASES — PROMO DEAL CONTACTS
// =============================================================================

app.post('/releases/:releaseId/promo-deal/contacts', async (req, res) => {
  try {
    const { releaseId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata) metadata.metadata = {}
    if (!metadata.metadata.promoInfo) {
      metadata.metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }
    if (!metadata.metadata.promoInfo.contacts) {
      metadata.metadata.promoInfo.contacts = []
    }

    const newContact = {
      id:         randomUUID(),
      name,
      label:      label    || '',
      email:      email    || '',
      phone:      phone    || '',
      location:   location || '',
      role:       role     || '',
      notes:      notes    || '',
      lastContact: null,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    }

    metadata.metadata.promoInfo.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/releases/:releaseId/promo-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata?.promoInfo?.contacts)
      return res.status(404).json({ error: 'No contacts found' })

    const idx = metadata.metadata.promoInfo.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ error: 'Contact not found' })

    metadata.metadata.promoInfo.contacts[idx] = {
      ...metadata.metadata.promoInfo.contacts[idx],
      name,
      label:      label    || '',
      email:      email    || '',
      phone:      phone    || '',
      location:   location || '',
      role:       role     || '',
      notes:      notes    || '',
      updatedAt:  new Date().toISOString()
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: metadata.metadata.promoInfo.contacts[idx] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/releases/:releaseId/promo-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    const metadataPath = path.join(RELEASES_DIR, releaseId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

    if (!metadata.metadata?.promoInfo?.contacts)
      return res.status(404).json({ error: 'No contacts found' })

    const original = metadata.metadata.promoInfo.contacts.length
    metadata.metadata.promoInfo.contacts =
      metadata.metadata.promoInfo.contacts.filter(c => c.id !== contactId)
    if (metadata.metadata.promoInfo.contacts.length === original)
      return res.status(404).json({ error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — CRUD
// =============================================================================

app.post('/collections', async (req, res) => {
  try {
    const { title, artist, genre, releaseDate, collectionType } = req.body
    if (!title || !artist || !collectionType)
      return res.status(400).json({ success: false, error: 'title, artist and collectionType are required' })

    const cleanArtist = artist.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const cleanTitle  = title.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    const date        = releaseDate || new Date().toISOString().split('T')[0]
    const collectionId = `${date}_${cleanArtist}_${cleanTitle}`

    const collectionDir = path.join(COLLECTIONS_PATH, collectionId)
    await fs.mkdir(collectionDir, { recursive: true })
    await fs.mkdir(path.join(collectionDir, 'artwork'), { recursive: true })

    const metadata = {
      releaseId: collectionId, collectionType, title, artist, genre: genre || '',
      releaseDate: date, createdAt: new Date().toISOString(),
      tracks: [], notes: { text: '', documents: [] },
      fileCounts: { artwork: 0 },
      distribution: { submit: [], release: [], promote: [] },
      labelInfo: { isSigned: false, label: null, signedDate: null, contractDocuments: [], contacts: [] },
      songLinks: []
    }
    await fs.writeFile(path.join(collectionDir, 'metadata.json'), JSON.stringify(metadata, null, 2))
    res.json({ success: true, collection: metadata })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections', async (req, res) => {
  try {
    const entries = await fs.readdir(COLLECTIONS_PATH, { withFileTypes: true })
    const collections = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      try {
        const metadata = await readCollection(entry.name)
        if (metadata.collectionType) collections.push(metadata)
      } catch {}
    }
    res.json({ success: true, collections })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections/:collectionId', async (req, res) => {
  try {
    const metadata = await readCollection(req.params.collectionId)
    res.json({ success: true, collection: metadata })
  } catch {
    res.status(404).json({ success: false, error: 'Collection not found' })
  }
})

app.patch('/collections/:collectionId', async (req, res) => {
  try {
    const filePath = path.join(COLLECTIONS_PATH, req.params.collectionId, 'metadata.json')
    const existing = await readCollection(req.params.collectionId)
    const updated  = {
      ...existing, ...req.body,
      releaseId: existing.releaseId,
      tracks: req.body.tracks || existing.tracks
    }
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    res.json({ success: true, collection: updated })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/collections/:collectionId', async (req, res) => {
  try {
    await fs.rm(path.join(COLLECTIONS_PATH, req.params.collectionId), { recursive: true, force: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — ARTWORK
// =============================================================================

app.post('/collections/:collectionId/artwork', collectionUpload.single('artwork'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })
    const metadataPath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
    metadata.fileCounts = { artwork: 1 }
    metadata.artworkFilename = req.file.filename
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections/:collectionId/artwork', async (req, res) => {
  try {
    const artworkDir = path.join(COLLECTIONS_PATH, req.params.collectionId, 'artwork')
    const files = await fs.readdir(artworkDir)
    const imageFile = files.find(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    if (!imageFile) return res.status(404).json({ error: 'No artwork found' })
    res.sendFile(path.join(artworkDir, imageFile))
  } catch {
    res.status(404).json({ error: 'No artwork found' })
  }
})

app.delete('/collections/:collectionId/artwork', async (req, res) => {
  try {
    const { collectionId } = req.params
    const artworkDir   = path.join(COLLECTIONS_PATH, collectionId, 'artwork')
    const metadataPath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')

    try {
      const files = await fs.readdir(artworkDir)
      for (const file of files) await fs.unlink(path.join(artworkDir, file))
    } catch { return res.status(404).json({ success: false, error: 'No artwork found' }) }

    const metadata = await readCollection(collectionId)
    metadata.fileCounts = { artwork: 0 }
    delete metadata.artworkFilename
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, message: 'Artwork deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — TRACKS
// =============================================================================

app.get('/collections/:collectionId/tracks', async (req, res) => {
  try {
    const collection = await readCollection(req.params.collectionId)
    const enriched = await Promise.all((collection.tracks || []).map(async (t) => {
      try {
        const parsed = JSON.parse(await fs.readFile(path.join(RELEASES_DIR, t.trackReleaseId, 'metadata.json'), 'utf8'))
        const meta = parsed.metadata || parsed
        return { releaseId: t.trackReleaseId, title: meta.title || t.title, artist: meta.artist || '', genre: meta.genre || '', bpm: meta.bpm || null, key: meta.key || null }
      } catch {
        return { releaseId: t.trackReleaseId, title: t.title || t.trackReleaseId }
      }
    }))
    res.json({ success: true, tracks: enriched })
  } catch (err) {
    res.status(404).json({ success: false, error: 'Collection not found' })
  }
})

app.post('/collections/:collectionId/tracks', async (req, res) => {
  try {
    const { trackReleaseId, trackOrder, title } = req.body
    if (!trackReleaseId) return res.status(400).json({ success: false, error: 'trackReleaseId is required' })

    const filePath  = path.join(COLLECTIONS_PATH, req.params.collectionId, 'metadata.json')
    const collection = await readCollection(req.params.collectionId)

    if (collection.tracks.some(t => t.trackReleaseId === trackReleaseId))
      return res.status(400).json({ success: false, error: 'Track already in this collection' })

    collection.tracks.push({ trackReleaseId, trackOrder: trackOrder || collection.tracks.length + 1, title: title || trackReleaseId })
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2))
    res.json({ success: true, collection })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/collections/:collectionId/tracks/:trackReleaseId', async (req, res) => {
  try {
    const filePath  = path.join(COLLECTIONS_PATH, req.params.collectionId, 'metadata.json')
    const collection = await readCollection(req.params.collectionId)
    collection.tracks = collection.tracks.filter(t => t.trackReleaseId !== req.params.trackReleaseId)
    await fs.writeFile(filePath, JSON.stringify(collection, null, 2))
    res.json({ success: true, collection })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — DISTRIBUTION
// =============================================================================

app.patch('/collections/:collectionId/distribution', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { path: distPath, entry } = req.body
    if (!['release', 'submit', 'promote'].includes(distPath))
      return res.status(400).json({ success: false, error: 'path must be release, submit, or promote' })
    if (!entry) return res.status(400).json({ success: false, error: 'entry is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    if (!metadata.distribution[distPath]) metadata.distribution[distPath] = []

    if (['submit', 'promote'].includes(distPath)) {
      if (!entry.id) entry.id = randomUUID().slice(0, 8)
      if (!entry.contacts) entry.contacts = []
      if (!entry.documents) entry.documents = []
      if (entry.pageNotes === undefined) entry.pageNotes = ''
    }

    entry.timestamp = entry.timestamp || new Date().toISOString()
    metadata.distribution[distPath].push(entry)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, collection: metadata })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.patch('/collections/:collectionId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { collectionId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid pathType' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.distribution?.[pathType]) return res.status(404).json({ success: false, error: 'Distribution path not found' })

    const idx = metadata.distribution[pathType].findIndex(e => e.timestamp === timestamp)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Entry not found' })

    metadata.distribution[pathType][idx] = {
      ...metadata.distribution[pathType][idx], ...req.body,
      timestamp: metadata.distribution[pathType][idx].timestamp,
      updatedAt: new Date().toISOString()
    }

    const updatedEntry = metadata.distribution[pathType][idx]
    if (pathType === 'submit' && updatedEntry.status === 'Signed' && updatedEntry.signedDate) {
      if (!metadata.labelInfo) metadata.labelInfo = {}
      metadata.labelInfo.isSigned = true
      metadata.labelInfo.label = updatedEntry.label
      metadata.labelInfo.signedDate = updatedEntry.signedDate
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, collection: metadata })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/collections/:collectionId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { collectionId, pathType, timestamp } = req.params
    if (!['release', 'submit', 'promote'].includes(pathType))
      return res.status(400).json({ success: false, error: 'Invalid pathType' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.distribution?.[pathType]) return res.status(404).json({ success: false, error: 'Distribution path not found' })

    const original = metadata.distribution[pathType].length
    metadata.distribution[pathType] = metadata.distribution[pathType].filter(e => e.timestamp !== timestamp)
    if (metadata.distribution[pathType].length === original) return res.status(404).json({ success: false, error: 'Entry not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, message: 'Entry deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.patch('/collections/:collectionId/sign', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { labelName, signedDate } = req.body
    if (!labelName) return res.status(400).json({ success: false, error: 'Label name required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    if (!metadata.distribution.submit) metadata.distribution.submit = []

    const submission = metadata.distribution.submit.find(s => s.label === labelName)
    if (!submission) return res.status(404).json({ success: false, error: `No submission found for label: ${labelName}` })

    submission.status = 'Signed'
    submission.signedAt = new Date().toISOString()

    if (!metadata.labelInfo) metadata.labelInfo = {}
    metadata.labelInfo.isSigned = true
    metadata.labelInfo.label = labelName
    metadata.labelInfo.signedDate = signedDate || new Date().toISOString()
    metadata.updatedAt = new Date().toISOString()

    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, message: `Marked as signed by ${labelName}`, submission })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// =============================================================================
// COLLECTIONS — SONG LINKS
// =============================================================================

app.post('/collections/:collectionId/song-links', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { label, url } = req.body
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.songLinks) metadata.songLinks = []
    metadata.songLinks.push({ label: label || url, url, addedAt: new Date().toISOString() })
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, songLinks: metadata.songLinks })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete('/collections/:collectionId/song-links/:index', async (req, res) => {
  try {
    const { collectionId, index } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.songLinks) return res.status(404).json({ success: false, error: 'No links found' })
    metadata.songLinks.splice(parseInt(index), 1)
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, songLinks: metadata.songLinks })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — NOTES
// =============================================================================

app.patch('/collections/:collectionId/notes', async (req, res) => {
  try {
    const { collectionId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.notes) metadata.notes = { text: '', documents: [] }
    metadata.notes.text  = req.body.notes || ''
    metadata.updatedAt   = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, notes: metadata.notes.text })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/collections/:collectionId/notes/files', collectionNotesUpload.single('file'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.notes) metadata.notes = { text: '', documents: [] }
    if (!metadata.notes.documents) metadata.notes.documents = []

    metadata.notes.documents.push({ filename: req.file.originalname, size: req.file.size, uploadedAt: new Date().toISOString() })
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, documents: metadata.notes.documents })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/collections/:collectionId/notes/files/:filename', (req, res) => {
  const filePath = path.join(COLLECTIONS_PATH, req.params.collectionId, 'notes', req.params.filename)
  if (!fsSync.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`)
  fsSync.createReadStream(filePath).pipe(res)
})

app.delete('/collections/:collectionId/notes/files/:filename', async (req, res) => {
  try {
    const { collectionId, filename } = req.params
    const filePath     = path.join(COLLECTIONS_PATH, collectionId, 'notes', filename)
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    try { await fs.unlink(filePath) } catch {}
    const metadata = await readCollection(collectionId)
    if (metadata.notes?.documents) {
      metadata.notes.documents = metadata.notes.documents.filter(d => d.filename !== filename)
    }
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, documents: metadata.notes?.documents || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — LABEL DEAL FILES
// =============================================================================

app.post('/collections/:collectionId/label-deal/files', collectionLabelDealUpload.single('file'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.labelInfo) metadata.labelInfo = {}
    if (!metadata.labelInfo.contractDocuments) metadata.labelInfo.contractDocuments = []

    metadata.labelInfo.contractDocuments.push({ filename: req.file.originalname, size: req.file.size, uploadedAt: new Date().toISOString() })
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/collections/:collectionId/label-deal/files/:filename', (req, res) => {
  const filePath = path.join(COLLECTIONS_PATH, req.params.collectionId, 'label-deal', req.params.filename)
  if (!fsSync.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`)
  fsSync.createReadStream(filePath).pipe(res)
})

app.delete('/collections/:collectionId/label-deal/files/:filename', async (req, res) => {
  try {
    const { collectionId, filename } = req.params
    const filePath     = path.join(COLLECTIONS_PATH, collectionId, 'label-deal', filename)
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    try { await fs.unlink(filePath) } catch {}
    const metadata = await readCollection(collectionId)
    if (metadata.labelInfo?.contractDocuments) {
      metadata.labelInfo.contractDocuments = metadata.labelInfo.contractDocuments.filter(d => d.filename !== filename)
    }
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — LABEL DEAL CONTACTS
// =============================================================================

app.post('/collections/:collectionId/label-deal/contacts', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.labelInfo) metadata.labelInfo = {}
    if (!metadata.labelInfo.contacts) metadata.labelInfo.contacts = []

    const newContact = {
      id: Date.now().toString(), name, label: label || '', email: email || '',
      phone: phone || '', location: location || '', role: role || '', notes: notes || '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
    metadata.labelInfo.contacts.push(newContact)
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: newContact })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/collections/:collectionId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, contactId } = req.params
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    const idx = metadata.labelInfo?.contacts?.findIndex(c => c.id === contactId)
    if (idx === -1 || idx === undefined) return res.status(404).json({ error: 'Contact not found' })

    metadata.labelInfo.contacts[idx] = {
      ...metadata.labelInfo.contacts[idx], ...req.body,
      id: contactId, updatedAt: new Date().toISOString()
    }
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: metadata.labelInfo.contacts[idx] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/collections/:collectionId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, contactId } = req.params
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)
    if (!metadata.labelInfo?.contacts) return res.status(404).json({ error: 'No contacts found' })

    const original = metadata.labelInfo.contacts.length
    metadata.labelInfo.contacts = metadata.labelInfo.contacts.filter(c => c.id !== contactId)
    if (metadata.labelInfo.contacts.length === original) return res.status(404).json({ error: 'Contact not found' })

    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — PROMO DEAL FILES
// =============================================================================

app.post('/collections/:collectionId/promo-deal/files', collectionPromoDealUpload.single('file'), async (req, res) => {
  try {
    const { collectionId } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.promoInfo) {
      metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }
    if (!metadata.promoInfo.contractDocuments) {
      metadata.promoInfo.contractDocuments = []
    }

    metadata.promoInfo.contractDocuments.push({
      filename:   req.file.originalname,
      size:       req.file.size,
      uploadedAt: new Date().toISOString()
    })

    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/collections/:collectionId/promo-deal/files/:filename', (req, res) => {
  const filePath = path.join(COLLECTIONS_PATH, req.params.collectionId, 'promo-deal', req.params.filename)
  if (!fsSync.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`)
  fsSync.createReadStream(filePath).pipe(res)
})

app.delete('/collections/:collectionId/promo-deal/files/:filename', async (req, res) => {
  try {
    const { collectionId, filename } = req.params
    const filePath     = path.join(COLLECTIONS_PATH, collectionId, 'promo-deal', filename)
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')

    try { await fs.unlink(filePath) } catch {}
    const metadata = await readCollection(collectionId)

    if (!metadata.promoInfo) {
      metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }

    if (metadata.promoInfo?.contractDocuments) {
      metadata.promoInfo.contractDocuments =
        metadata.promoInfo.contractDocuments.filter(d => d.filename !== filename)
    }

    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — PROMO DEAL CONTACTS
// =============================================================================

app.post('/collections/:collectionId/promo-deal/contacts', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.promoInfo) {
      metadata.promoInfo = { contacts: [], contractDocuments: [] }
    }
    if (!metadata.promoInfo.contacts) {
      metadata.promoInfo.contacts = []
    }

    const newContact = {
      id:         randomUUID(),
      name,
      label:      label    || '',
      email:      email    || '',
      phone:      phone    || '',
      location:   location || '',
      role:       role     || '',
      notes:      notes    || '',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    }

    metadata.promoInfo.contacts.push(newContact)
    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: newContact })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/collections/:collectionId/promo-deal/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.promoInfo?.contacts)
      return res.status(404).json({ error: 'No contacts found' })

    const idx = metadata.promoInfo.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ error: 'Contact not found' })

    metadata.promoInfo.contacts[idx] = {
      ...metadata.promoInfo.contacts[idx],
      name,
      label:      label    || '',
      email:      email    || '',
      phone:      phone    || '',
      location:   location || '',
      role:       role     || '',
      notes:      notes    || '',
      updatedAt:  new Date().toISOString()
    }

    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true, contact: metadata.promoInfo.contacts[idx] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/collections/:collectionId/promo-deal/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, contactId } = req.params
    const metaFilePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.promoInfo?.contacts)
      return res.status(404).json({ error: 'No contacts found' })

    const original = metadata.promoInfo.contacts.length
    metadata.promoInfo.contacts =
      metadata.promoInfo.contacts.filter(c => c.id !== contactId)
    if (metadata.promoInfo.contacts.length === original)
      return res.status(404).json({ error: 'Contact not found' })

    await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2))
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =============================================================================
// COLLECTIONS — PER-ENTRY PROMO / LABEL ENDPOINTS
// =============================================================================

// -- Collection promo entry: GET one ------------------------------------------
app.get('/collections/:collectionId/promo/:promoId', async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    res.json({ success: true, entry, collectionId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection promo entry: PATCH top-level fields ---------------------------
app.patch('/collections/:collectionId/promo/:promoId', async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const idx = entries.findIndex(e => e.id === promoId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    const existing = entries[idx]
    ensurePromoEntryDefaults(existing)

    const allowed = ['promoName', 'status', 'liveDate', 'notes', 'platform']
    const updates = {}
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key]
      }
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      timestamp: existing.timestamp,
      contacts: existing.contacts,
      documents: existing.documents,
      pageNotes: existing.pageNotes
    }

    metadata.distribution.promote[idx] = updated
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, entry: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection promo entry: DELETE -------------------------------------------
app.delete('/collections/:collectionId/promo/:promoId', async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const originalLength = entries.length
    metadata.distribution.promote = entries.filter(e => e.id !== promoId)
    if (metadata.distribution.promote.length === originalLength)
      return res.status(404).json({ success: false, error: 'Promo entry not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    const folderPath = path.join(COLLECTIONS_PATH, collectionId, 'promo', promoId)
    try {
      await fs.rm(folderPath, { recursive: true, force: true })
    } catch {}

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection promo entry: contacts -----------------------------------------
app.post('/collections/:collectionId/promo/:promoId/contacts', async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const idx = entries.findIndex(e => e.id === promoId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    const entry = entries[idx]
    ensurePromoEntryDefaults(entry)

    const newContact = {
      id: randomUUID(),
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    entry.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/collections/:collectionId/promo/:promoId/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, promoId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    const idx = entry.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Contact not found' })

    entry.contacts[idx] = {
      ...entry.contacts[idx],
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: entry.contacts[idx] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/promo/:promoId/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, promoId, contactId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    const original = entry.contacts.length
    entry.contacts = entry.contacts.filter(c => c.id !== contactId)
    if (entry.contacts.length === original)
      return res.status(404).json({ success: false, error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection promo entry: documents ----------------------------------------
app.post('/collections/:collectionId/promo/:promoId/files', collectionPromoEntryUpload.single('file'), async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)

    entry.documents.push({
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/collections/:collectionId/promo/:promoId/files/:filename', async (req, res) => {
  try {
    const { collectionId, promoId, filename } = req.params
    const diskPath = path.join(COLLECTIONS_PATH, collectionId, 'promo', promoId, filename)
    try { await fs.access(diskPath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fsSync.createReadStream(diskPath).pipe(res)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/promo/:promoId/files/:filename', async (req, res) => {
  try {
    const { collectionId, promoId, filename } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)

    const diskPath = path.join(COLLECTIONS_PATH, collectionId, 'promo', promoId, filename)
    try { await fs.unlink(diskPath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }

    entry.documents = entry.documents.filter(d => d.filename !== filename)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection promo entry: page notes ---------------------------------------
app.patch('/collections/:collectionId/promo/:promoId/notes', async (req, res) => {
  try {
    const { collectionId, promoId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.promote || []
    const entry = entries.find(e => e.id === promoId)
    if (!entry) return res.status(404).json({ success: false, error: 'Promo entry not found' })

    ensurePromoEntryDefaults(entry)
    entry.pageNotes = req.body.notes || ''
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, notes: entry.pageNotes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: GET one ------------------------------------------
app.get('/collections/:collectionId/label/:labelId', async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    res.json({ success: true, entry, collectionId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: PATCH top-level fields ---------------------------
app.patch('/collections/:collectionId/label/:labelId', async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const idx = entries.findIndex(e => e.id === labelId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Label submission not found' })

    const existing = entries[idx]
    ensureLabelEntryDefaults(existing)

    const allowed = ['label', 'status', 'signedDate', 'notes', 'platform']
    const updates = {}
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key]
      }
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      timestamp: existing.timestamp,
      contacts: existing.contacts,
      documents: existing.documents,
      pageNotes: existing.pageNotes
    }

    metadata.distribution.submit[idx] = updated
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, entry: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: DELETE -------------------------------------------
app.delete('/collections/:collectionId/label/:labelId', async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const originalLength = entries.length
    metadata.distribution.submit = entries.filter(e => e.id !== labelId)
    if (metadata.distribution.submit.length === originalLength)
      return res.status(404).json({ success: false, error: 'Label submission not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    const folderPath = path.join(COLLECTIONS_PATH, collectionId, 'label', labelId)
    try {
      await fs.rm(folderPath, { recursive: true, force: true })
    } catch {}

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: contacts -----------------------------------------
app.post('/collections/:collectionId/label/:labelId/contacts', async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    const newContact = {
      id: randomUUID(),
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    entry.contacts.push(newContact)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: newContact })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.patch('/collections/:collectionId/label/:labelId/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, labelId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    const idx = entry.contacts.findIndex(c => c.id === contactId)
    if (idx === -1) return res.status(404).json({ success: false, error: 'Contact not found' })

    entry.contacts[idx] = {
      ...entry.contacts[idx],
      name,
      label: label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, contact: entry.contacts[idx] })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/label/:labelId/contacts/:contactId', async (req, res) => {
  try {
    const { collectionId, labelId, contactId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    const original = entry.contacts.length
    entry.contacts = entry.contacts.filter(c => c.id !== contactId)
    if (entry.contacts.length === original)
      return res.status(404).json({ success: false, error: 'Contact not found' })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: documents ----------------------------------------
app.post('/collections/:collectionId/label/:labelId/files', collectionLabelEntryUpload.single('file'), async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    entry.documents.push({
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    })

    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/collections/:collectionId/label/:labelId/files/:filename', async (req, res) => {
  try {
    const { collectionId, labelId, filename } = req.params
    const diskPath = path.join(COLLECTIONS_PATH, collectionId, 'label', labelId, filename)
    try { await fs.access(diskPath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    fsSync.createReadStream(diskPath).pipe(res)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/collections/:collectionId/label/:labelId/files/:filename', async (req, res) => {
  try {
    const { collectionId, labelId, filename } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)

    const diskPath = path.join(COLLECTIONS_PATH, collectionId, 'label', labelId, filename)
    try { await fs.unlink(diskPath) }
    catch { return res.status(404).json({ success: false, error: 'File not found' }) }

    entry.documents = entry.documents.filter(d => d.filename !== filename)
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, documents: entry.documents })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// -- Collection label entry: page notes ---------------------------------------
app.patch('/collections/:collectionId/label/:labelId/notes', async (req, res) => {
  try {
    const { collectionId, labelId } = req.params
    const filePath = path.join(COLLECTIONS_PATH, collectionId, 'metadata.json')
    const metadata = await readCollection(collectionId)

    if (!metadata.distribution) metadata.distribution = { release: [], submit: [], promote: [] }
    const entries = metadata.distribution.submit || []
    const entry = entries.find(e => e.id === labelId)
    if (!entry) return res.status(404).json({ success: false, error: 'Label submission not found' })

    ensureLabelEntryDefaults(entry)
    entry.pageNotes = req.body.notes || ''
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))

    res.json({ success: true, notes: entry.pageNotes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
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
