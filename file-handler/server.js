// =============================================================================
// MUSIC AGENT - Release Management API
// =============================================================================
// Backend server for tracking releases, platform uploads, and label submissions.
//
// Run:    cd ~/Documents/music-agent-mvp/file-handler && node server.js
// Port:   http://localhost:3001
// Health: curl http://localhost:3001/health
// =============================================================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const checkDiskSpace = require('check-disk-space').default;
const musicMetadata = require('music-metadata');

// =============================================================================
// SERVER SETUP
// =============================================================================

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const os = require('os');
const RELEASES_DIR = path.join(os.homedir(), 'Documents', 'Music Agent', 'Releases');
app.use('/releases', express.static(RELEASES_BASE));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function requireReleaseId(req) {
  const releaseId = (req.params?.releaseId || req.query.releaseId || '').trim();
  
  if (!releaseId) {
    const err = new Error('Missing releaseId');
    err.statusCode = 400;
    throw err;
  }
  return releaseId;
}

function classify(file) {
  // Check mimetype first
  if (file.mimetype?.startsWith('audio/')) return 'audio';
  if (file.mimetype?.startsWith('image/')) return 'artwork';
  if (file.mimetype?.startsWith('video/')) return 'video';
  
  // Fallback to file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.wav', '.mp3', '.flac', '.aiff', '.m4a', '.ogg'].includes(ext)) return 'audio';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'artwork';
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  
  return 'other';
}

async function validateAudioFile(filePath) {
  try {
    const metadata = await musicMetadata.parseFile(filePath);
    
    if (!metadata.format || !metadata.format.duration) {
      return {
        valid: false,
        error: 'Could not read audio metadata - file may be corrupt'
      };
    }
    
    if (metadata.format.duration <= 0 || metadata.format.duration > 3600) {
      return {
        valid: false,
        error: `Invalid audio duration: ${metadata.format.duration}s`
      };
    }
    
    return {
      valid: true,
      metadata: {
        duration: Math.round(metadata.format.duration),
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        codec: metadata.format.codec
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: `Audio validation failed: ${error.message}`
    };
  }
}

function generateVersionId(versionName) {
  if (!versionName || versionName.trim() === '') {
    return 'primary';
  }
  
  if (versionName.trim().toLowerCase() === 'primary version') {
    return 'primary';
  }
  
  return versionName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getVersionInfo(req) {
  const versionName = (req.query.versionName || '').trim() || 'Primary Version';
  const versionId = generateVersionId(versionName);
  
  return {
    versionName,
    versionId,
    isPrimary: versionId === 'primary'
  };
}

// =============================================================================
// MULTER CONFIGURATION
// =============================================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const releaseId = requireReleaseId(req);
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const fileType = classify(file);
    
    let targetFolder;
    
    if (fileType === 'audio') {
      const { versionId } = getVersionInfo(req);
      targetFolder = path.join(releasePath, 'versions', versionId, 'audio');
    } else if (fileType === 'artwork') {
      targetFolder = path.join(releasePath, 'artwork');
    } else if (fileType === 'video') {
      targetFolder = path.join(releasePath, 'video');
    } else {
      targetFolder = releasePath;
    }
    
    fsSync.mkdirSync(targetFolder, { recursive: true });
    cb(null, targetFolder);
  },
  
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// =============================================================================
// API ROUTES
// =============================================================================

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Release management API is running' 
  });
});

// --- File Upload ---
app.post('/upload', upload.any(), async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const { artist, title, genre } = req.query;
    const { versionName, versionId } = getVersionInfo(req);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    // Load existing metadata
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      // File doesn't exist yet
    }
    
    if (!metadata.versions) {
      metadata.versions = {};
    }
    
    // Check for duplicate version
    if (metadata.versions[versionId]) {
      const versionAudioPath = path.join(releasePath, 'versions', versionId, 'audio');
      let existingAudioFiles = [];
      
      try {
        existingAudioFiles = await fs.readdir(versionAudioPath);
      } catch (error) {
        // Folder doesn't exist
      }
      
      if (existingAudioFiles.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Version "${versionName}" already exists`,
          existingVersion: metadata.versions[versionId]
        });
      }
    }
    
    const savedFiles = {
      audio: [],
      artwork: [],
      video: []
    };
    
    // Process files
    for (const file of req.files) {
      const fileType = classify(file);
      
      if (fileType === 'audio') {
        const validation = await validateAudioFile(file.path);
        
        if (!validation.valid) {
          await fs.unlink(file.path);
          return res.status(400).json({
            success: false,
            error: validation.error,
            file: file.originalname
          });
        }
        
        savedFiles.audio.push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          duration: validation.metadata.duration,
          bitrate: validation.metadata.bitrate,
          sampleRate: validation.metadata.sampleRate,
          channels: validation.metadata.channels,
          codec: validation.metadata.codec
        });
      } else {
        savedFiles[fileType].push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }
    
    // Store version in metadata
    metadata.versions[versionId] = {
      versionName: versionName,
      versionId: versionId,
      createdAt: new Date().toISOString(),
      files: savedFiles
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({
      success: true,
      message: `Files uploaded successfully for ${versionName}`,
      releaseId: releaseId,
      versionId: versionId,
      versionName: versionName,
      files: savedFiles,
      artist: artist,
      title: title,
      genre: genre
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// --- Save Metadata ---
app.post('/metadata', async (req, res) => {
  try {
    const { releaseId, ...metadata } = req.body;
    
    if (!releaseId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing releaseId' 
      });
    }
    
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    await fs.mkdir(releasePath, { recursive: true });
    
    // Read existing metadata
    let existingMetadata = {};
    try {
      const existingContent = await fs.readFile(metadataPath, 'utf8');
      existingMetadata = JSON.parse(existingContent);
    } catch (error) {
      // File doesn't exist
    }
    
    // Merge with existing
    const mergedMetadata = {
      ...existingMetadata,
      ...metadata,
      releaseId: releaseId,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(mergedMetadata, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Metadata saved',
      releaseId: releaseId 
    });
    
  } catch (error) {
    console.error('Metadata save error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// --- List All Releases (FIX 1 - FLATTENED WITH DISTRIBUTION) ---
app.get('/releases/', async (req, res) => {
  try {
    const folders = await fs.readdir(RELEASES_BASE);
    const releases = [];
    
    for (const folder of folders) {
      if (folder.startsWith('.')) continue;
      
      const folderPath = path.join(RELEASES_BASE, folder);
      const stats = await fs.stat(folderPath);
      
      if (!stats.isDirectory()) continue;
      
      const metadataPath = path.join(folderPath, 'metadata.json');
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const parsed = JSON.parse(metadataContent);
        
        // Flatten nested structure
        const metadata = parsed.metadata || parsed;
        const versions = parsed.versions || {};
        
        // Count files from primary version
        const primaryVersion = versions.primary || {};
        const files = primaryVersion.files || {};
        
        releases.push({
          releaseId: parsed.releaseId || metadata.releaseId || folder,
          artist: metadata.artist,
          title: metadata.title,
          genre: metadata.genre,
          releaseDate: metadata.releaseDate || metadata.trackDate,
          releaseType: metadata.releaseType || metadata.releaseFormat,
          createdAt: metadata.createdAt,
          versionCount: Object.keys(versions).length,
          fileCounts: {
            audio: files.audio?.length || 0,
            artwork: files.artwork?.length || 0,
            video: files.video?.length || 0
          },
          distribution: metadata.distribution || {
            release: [],
            submit: [],
            promote: []
          }
        });
        
      } catch (error) {
        releases.push({
          releaseId: folder,
          error: 'No metadata.json found',
          createdAt: stats.birthtime
        });
      }
    }
    
    // Sort by date (newest first)
    releases.sort((a, b) => {
      const dateA = new Date(a.releaseDate || a.createdAt);
      const dateB = new Date(b.releaseDate || b.createdAt);
      return dateB - dateA;
    });
    
    res.json({
      success: true,
      count: releases.length,
      releases: releases
    });
    
  } catch (error) {
    console.error('Error listing releases:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// --- Serve Artwork Images ---
app.get('/releases/:releaseId/artwork/', (req, res) => {
  const { releaseId } = req.params;
  const artworkPath = path.join(RELEASES_BASE, releaseId, 'artwork');

  if (!fsSync.existsSync(artworkPath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'No artwork found' 
    });
  }

  const artworkFiles = fsSync.readdirSync(artworkPath);
  
  if (artworkFiles.length === 0) {
    return res.status(404).json({ 
      success: false, 
      error: 'No artwork files found' 
    });
  }

  const firstArtwork = artworkFiles[0];
  const filePath = path.join(artworkPath, firstArtwork);
  res.sendFile(filePath);
});

// Serve artwork for a release
app.get('/releases/:releaseId/artwork/', async (req, res) => {
  // ... existing artwork endpoint code ...
})

// Download any file from a release
app.get('/releases/:releaseId/files/:fileType/:filename', async (req, res) => {
  try {
    const { releaseId, fileType, filename } = req.params
    
    // Validate file type
    if (!['audio', 'artwork', 'video'].includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type' })
    }
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    
    // Try multiple possible file locations
    const possiblePaths = [
      path.join(releasePath, fileType, filename),                       // Root level ✅ Check this FIRST
      path.join(releasePath, 'versions/primary', fileType, filename),  // Standard location
      path.join(releasePath, 'versions', 'primary', 'files', fileType, filename) // Alternative structure
    ]
    
    let filePath = null
    
    // Check each possible path
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath)
        filePath = possiblePath
        console.log('✅ Found file at:', possiblePath)
        break
      } catch (err) {
        // File not at this location, try next
        console.log('❌ Not found at:', possiblePath)
      }
    }
    
    if (!filePath) {
      console.error('❌ File not found in any expected location:', filename)
      return res.status(404).json({ error: 'File not found' })
    }
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase()
    const contentTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aiff': 'audio/aiff',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska'
    }
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext])
    }
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath)
    fileStream.pipe(res)
    
    console.log(`✅ Serving file: ${filename}`)
    
  } catch (error) {
    console.error('❌ Error serving file:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete an entire release
app.delete('/releases/:releaseId', async (req, res) => {
  try {
    const { releaseId } = req.params
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    
    console.log('🗑️ Attempting to delete release:', releaseId)
    console.log('🗑️ Path:', releasePath)
    
    // Check if release exists
    try {
      await fs.access(releasePath)
    } catch (err) {
      console.log('❌ Release not found:', releasePath)
      return res.status(404).json({ error: 'Release not found' })
    }
    
    // Delete the entire release folder
    await fs.rm(releasePath, { recursive: true, force: true })
    
    console.log('✅ Successfully deleted release:', releaseId)
    
    res.json({ 
      success: true, 
      message: `Release ${releaseId} deleted successfully` 
    })
    
  } catch (error) {
    console.error('❌ Error deleting release:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// LABEL DEAL ENDPOINTS
// ============================================

// Upload label deal file
app.post('/releases/:releaseId/label-deal/files', upload.single('file'), async (req, res) => {
  try {
    const { releaseId } = req.params
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const labelDealPath = path.join(releasePath, 'label-deal')
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Create label-deal folder if it doesn't exist
    await fs.mkdir(labelDealPath, { recursive: true })
    
    // Move file to label-deal folder
    const filename = req.file.originalname
    const targetPath = path.join(labelDealPath, filename)
    await fs.rename(req.file.path, targetPath)
    
    // Update metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    if (!metadata.metadata.labelInfo) {
      metadata.metadata.labelInfo = {}
    }
    if (!metadata.metadata.labelInfo.contractDocuments) {
      metadata.metadata.labelInfo.contractDocuments = []
    }
    
    // Add file to contractDocuments array
    metadata.metadata.labelInfo.contractDocuments.push({
      filename: filename,
      uploadedAt: new Date().toISOString(),
      size: req.file.size
    })
    
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Uploaded label deal file: ${filename}`)
    
    res.json({
      success: true,
      file: {
        filename: filename,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading label deal file:', error)
    res.status(500).json({ error: error.message })
  }
})

// Download label deal file
app.get('/releases/:releaseId/label-deal/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const filePath = path.join(releasePath, 'label-deal', filename)
    
    console.log('🔍 Looking for label deal file at:', filePath)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (err) {
      console.log('❌ File not found at:', filePath)
      return res.status(404).json({ error: 'File not found' })
    }
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase()
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.txt': 'text/plain',
      '.zip': 'application/zip'
    }
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext])
    }
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath)
    fileStream.pipe(res)
    
    console.log(`✅ Serving label deal file: ${filename}`)
    
  } catch (error) {
    console.error('❌ Error serving label deal file:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete label deal file
app.delete('/releases/:releaseId/label-deal/files/:filename', async (req, res) => {
  try {
    const { releaseId, filename } = req.params
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const filePath = path.join(releasePath, 'label-deal', filename)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Delete the file
    try {
      await fs.unlink(filePath)
      console.log(`🗑️ Deleted file: ${filename}`)
    } catch (err) {
      console.log('❌ File not found:', filePath)
      return res.status(404).json({ error: 'File not found' })
    }
    
    // Update metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    if (metadata.metadata.labelInfo?.contractDocuments) {
      metadata.metadata.labelInfo.contractDocuments = metadata.metadata.labelInfo.contractDocuments.filter(
        doc => doc.filename !== filename
      )
    }
    
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Removed ${filename} from metadata`)
    
    res.json({ success: true, message: 'File deleted' })
    
  } catch (error) {
    console.error('❌ Error deleting label deal file:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// LABEL CONTACT ENDPOINTS (MULTIPLE CONTACTS)
// ============================================

// Add a new contact
app.post('/releases/:releaseId/label-deal/contacts', async (req, res) => {
  try {
    const { releaseId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    if (!metadata.metadata.labelInfo) {
      metadata.metadata.labelInfo = {}
    }
    if (!metadata.metadata.labelInfo.contacts) {
      metadata.metadata.labelInfo.contacts = []
    }
    
    // Create new contact with unique ID
    const newContact = {
      id: Date.now().toString(), // Simple unique ID
      name,
      label: label || metadata.metadata.labelInfo.label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      lastContact: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add to contacts array
    metadata.metadata.labelInfo.contacts.push(newContact)
    
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Added contact for ${releaseId}:`, newContact.name)
    
    res.json({
      success: true,
      contact: newContact
    })
    
  } catch (error) {
    console.error('❌ Error adding contact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update an existing contact
app.patch('/releases/:releaseId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    const { name, label, email, phone, location, role, notes } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    if (!metadata.metadata.labelInfo?.contacts) {
      return res.status(404).json({ error: 'No contacts found' })
    }
    
    // Find and update the contact
    const contactIndex = metadata.metadata.labelInfo.contacts.findIndex(c => c.id === contactId)
    
    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' })
    }
    
    // Update contact
    metadata.metadata.labelInfo.contacts[contactIndex] = {
      ...metadata.metadata.labelInfo.contacts[contactIndex],
      name,
      label: label || metadata.metadata.labelInfo.label || '',
      email: email || '',
      phone: phone || '',
      location: location || '',
      role: role || '',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    }
    
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Updated contact for ${releaseId}:`, name)
    
    res.json({
      success: true,
      contact: metadata.metadata.labelInfo.contacts[contactIndex]
    })
    
  } catch (error) {
    console.error('❌ Error updating contact:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a contact
app.delete('/releases/:releaseId/label-deal/contacts/:contactId', async (req, res) => {
  try {
    const { releaseId, contactId } = req.params
    
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    if (!metadata.metadata.labelInfo?.contacts) {
      return res.status(404).json({ error: 'No contacts found' })
    }
    
    // Filter out the contact
    const originalLength = metadata.metadata.labelInfo.contacts.length
    metadata.metadata.labelInfo.contacts = metadata.metadata.labelInfo.contacts.filter(
      c => c.id !== contactId
    )
    
    if (metadata.metadata.labelInfo.contacts.length === originalLength) {
      return res.status(404).json({ error: 'Contact not found' })
    }
    
    metadata.updatedAt = new Date().toISOString()
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Deleted contact from ${releaseId}`)
    
    res.json({ success: true, message: 'Contact deleted' })
    
  } catch (error) {
    console.error('❌ Error deleting contact:', error)
    res.status(500).json({ error: error.message })
  }
})


// Next endpoint continues below...


// --- Get Single Release (FIX 2 - FLATTENED STRUCTURE) ---
app.get('/releases/:releaseId/', async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    try {
      await fs.access(releasePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Release not found: ${releaseId}`
      });
    }
    
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const parsed = JSON.parse(metadataContent);
    
    // Flatten for frontend
    const metadata = parsed.metadata || parsed;
    const versions = parsed.versions || {};
    
    const release = {
      releaseId: parsed.releaseId || metadata.releaseId,
      artist: metadata.artist,
      title: metadata.title,
      genre: metadata.genre,
      releaseDate: metadata.releaseDate || metadata.trackDate,
      releaseType: metadata.releaseType || metadata.releaseFormat,
      createdAt: metadata.createdAt,
      updatedAt: parsed.updatedAt,
      versions: versions,
      distribution: metadata.distribution || {
        release: [],
        submit: [],
        promote: []
      },
      labelInfo: metadata.labelInfo || {
        isSigned: false,
        label: null,
        signedDate: null,
        contractDocuments: []
      }
    };
    
    res.json({
      success: true,
      release: release
    });
    
  } catch (error) {
    console.error('Error getting release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// --- Update Distribution Tracking (FIX 3 - NESTED METADATA) ---
app.patch('/releases/:releaseId/distribution', async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const { path: distPath, entry } = req.body;
    
    if (!distPath || !entry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: path and entry'
      });
    }
    
    if (!['release', 'submit', 'promote'].includes(distPath)) {
      return res.status(400).json({
        success: false,
        error: 'path must be: release, submit, or promote'
      });
    }
    
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const parsed = JSON.parse(metadataContent);
    
    // Work with nested structure
    if (!parsed.metadata) {
      parsed.metadata = {};
    }
    if (!parsed.metadata.distribution) {
      parsed.metadata.distribution = {
        release: [],
        submit: [],
        promote: []
      };
    }
    
    if (!parsed.metadata.distribution[distPath]) {
      parsed.metadata.distribution[distPath] = [];
    }
    
    // Add timestamp
    entry.timestamp = entry.timestamp || new Date().toISOString();
    
    parsed.metadata.distribution[distPath].push(entry);
    parsed.updatedAt = new Date().toISOString();
    
    await fs.writeFile(metadataPath, JSON.stringify(parsed, null, 2));
    
    console.log(`✅ Added ${entry.platform || entry.label} to ${distPath} path`);
    
    res.json({ 
      success: true,
      message: `Distribution updated for ${distPath}`,
      distribution: parsed.metadata.distribution 
    });
    
  } catch (error) {
    console.error('Error updating distribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Mark release as signed by label
app.patch('/releases/:releaseId/sign', async (req, res) => {
  try {
    const { releaseId } = req.params
    const { labelName } = req.body
    
    if (!labelName) {
      return res.status(400).json({ success: false, error: 'Label name required' })
    }
    
    // Build path to release folder
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    console.log('🔍 Looking for release at:', releasePath)
    
    // Check if metadata exists
    try {
      await fs.access(metadataPath)
    } catch (err) {
      console.log('❌ Release not found at:', metadataPath)
      return res.status(404).json({ success: false, error: 'Release not found' })
    }
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    // Initialize nested structure if needed
    if (!metadata.metadata) {
      metadata.metadata = {}
    }
    if (!metadata.metadata.distribution) {
      metadata.metadata.distribution = { release: [], submit: [], promote: [] }
    }
    if (!metadata.metadata.distribution.submit) {
      metadata.metadata.distribution.submit = []
    }
    
    // Find the submission for this label in metadata.distribution
    console.log('🔍 Looking for label:', labelName)
    console.log('🔍 Available submissions:', JSON.stringify(metadata.metadata.distribution.submit, null, 2))
    
    const submission = metadata.metadata.distribution.submit.find(s => s.label === labelName)
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        error: `No submission found for label: ${labelName}` 
      })
    }
    
    // Update the submission to "signed"
    submission.status = 'signed'
    submission.signedAt = new Date().toISOString()
    
    // Also update labelInfo
    if (!metadata.metadata.labelInfo) {
      metadata.metadata.labelInfo = {}
    }
    metadata.metadata.labelInfo.isSigned = true
    metadata.metadata.labelInfo.label = labelName
    metadata.metadata.labelInfo.signedDate = new Date().toISOString()
    
    // Mark metadata as updated
    metadata.updatedAt = new Date().toISOString()
    
    // Write back to file
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Marked ${releaseId} as signed by ${labelName}`)
    
    res.json({ 
      success: true, 
      message: `Marked as signed by ${labelName}`,
      submission 
    })
    
  } catch (error) {
    console.error('❌ Error signing release:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete a distribution entry (submission or platform release)
app.delete('/releases/:releaseId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { releaseId, pathType, timestamp } = req.params
    
    // Validate pathType
    if (!['release', 'submit', 'promote'].includes(pathType)) {
      return res.status(400).json({ success: false, error: 'Invalid path type' })
    }
    
    // Build path
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Check if metadata exists
    try {
      await fs.access(metadataPath)
    } catch (err) {
      return res.status(404).json({ success: false, error: 'Release not found' })
    }
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    // Navigate to the correct distribution array
    if (!metadata.metadata?.distribution?.[pathType]) {
      return res.status(404).json({ success: false, error: 'Distribution path not found' })
    }
    
    const entries = metadata.metadata.distribution[pathType]
    const originalLength = entries.length
    
    // Find the entry to check if it's signed
    const entryToDelete = entries.find(entry => entry.timestamp === timestamp)
    const wasSignedSubmission = pathType === 'submit' && entryToDelete?.status === 'signed'
    
    // Filter out the entry with matching timestamp
    metadata.metadata.distribution[pathType] = entries.filter(
      entry => entry.timestamp !== timestamp
    )
    
    if (metadata.metadata.distribution[pathType].length === originalLength) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    
    // If we deleted a signed submission, clear labelInfo
    if (wasSignedSubmission) {
      if (!metadata.metadata.labelInfo) {
        metadata.metadata.labelInfo = {}
      }
      metadata.metadata.labelInfo.isSigned = false
      metadata.metadata.labelInfo.label = null
      metadata.metadata.labelInfo.signedDate = null
      console.log('🔄 Cleared labelInfo because signed submission was deleted')
    }
    
    // Update timestamp
    metadata.updatedAt = new Date().toISOString()
    
    // Write back
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Deleted ${pathType} entry from ${releaseId}`)
    
    res.json({ success: true, message: 'Entry deleted' })
    
  } catch (error) {
    console.error('❌ Error deleting entry:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})


// Edit a distribution entry
app.patch('/releases/:releaseId/distribution/:pathType/:timestamp', async (req, res) => {
  try {
    const { releaseId, pathType, timestamp } = req.params
    const updatedData = req.body
    
    // Validate pathType
    if (!['release', 'submit', 'promote'].includes(pathType)) {
      return res.status(400).json({ success: false, error: 'Invalid path type' })
    }
    
    // Build path
    const releasePath = path.join(process.env.HOME, 'Documents/Music Agent/Releases', releaseId)
    const metadataPath = path.join(releasePath, 'metadata.json')
    
    // Check if metadata exists
    try {
      await fs.access(metadataPath)
    } catch (err) {
      return res.status(404).json({ success: false, error: 'Release not found' })
    }
    
    // Read metadata
    const rawData = await fs.readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(rawData)
    
    // Navigate to the correct distribution array
    if (!metadata.metadata?.distribution?.[pathType]) {
      return res.status(404).json({ success: false, error: 'Distribution path not found' })
    }
    
    const entries = metadata.metadata.distribution[pathType]
    
    // Find the entry with matching timestamp
    const entryIndex = entries.findIndex(entry => entry.timestamp === timestamp)
    
    if (entryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    
    // Update the entry (merge with existing data)
    metadata.metadata.distribution[pathType][entryIndex] = {
      ...entries[entryIndex],
      ...updatedData,
      timestamp: entries[entryIndex].timestamp, // Keep original timestamp
      updatedAt: new Date().toISOString()
    }
    
    // Update metadata timestamp
    metadata.updatedAt = new Date().toISOString()
    
    // Write back
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8')
    
    console.log(`✅ Updated ${pathType} entry in ${releaseId}`)
    
    res.json({ 
      success: true, 
      message: 'Entry updated',
      entry: metadata.metadata.distribution[pathType][entryIndex]
    })
    
  } catch (error) {
    console.error('❌ Error updating entry:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})


// --- Add Audio Version ---
app.post('/releases/:releaseId/versions', 
  (req, res, next) => {
    try {
      requireReleaseId(req);
      next();
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  },
  upload.any(),
  async (req, res) => {
    try {
      const releaseId = requireReleaseId(req);
      const { versionName, versionId } = getVersionInfo(req);
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No audio files uploaded'
        });
      }
      
      const releasePath = path.join(RELEASES_BASE, releaseId);
      const metadataPath = path.join(releasePath, 'metadata.json');
      
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      if (metadata.versions && metadata.versions[versionId]) {
        return res.status(409).json({
          success: false,
          error: `Version "${versionName}" already exists`,
          existingVersion: metadata.versions[versionId]
        });
      }
      
      const savedFiles = {
        audio: [],
        artwork: [],
        video: []
      };
      
      for (const file of req.files) {
        const fileType = classify(file);
        
        if (fileType === 'audio') {
          const validation = await validateAudioFile(file.path);
          
          if (!validation.valid) {
            await fs.unlink(file.path);
            return res.status(400).json({
              success: false,
              error: validation.error,
              file: file.originalname
            });
          }
          
          savedFiles.audio.push({
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            duration: validation.metadata.duration,
            bitrate: validation.metadata.bitrate,
            sampleRate: validation.metadata.sampleRate,
            channels: validation.metadata.channels,
            codec: validation.metadata.codec
          });
        } else {
          await fs.unlink(file.path);
          return res.status(400).json({
            success: false,
            error: `Only audio files allowed. Received: ${fileType}`,
            file: file.originalname
          });
        }
      }
      
      if (!metadata.versions) {
        metadata.versions = {};
      }
      
      metadata.versions[versionId] = {
        versionName: versionName,
        versionId: versionId,
        createdAt: new Date().toISOString(),
        files: savedFiles
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      res.json({
        success: true,
        message: `Version "${versionName}" added successfully`,
        releaseId: releaseId,
        versionId: versionId,
        versionName: versionName,
        files: savedFiles
      });
      
    } catch (error) {
      console.error('Error adding version:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// --- Storage Status ---
app.get('/storage/status', async (req, res) => {
  try {
    const diskSpace = await checkDiskSpace(RELEASES_BASE);
    
    const totalGB = (diskSpace.size / (1024 ** 3)).toFixed(2);
    const freeGB = (diskSpace.free / (1024 ** 3)).toFixed(2);
    const usedGB = (totalGB - freeGB).toFixed(2);
    const usedPercent = ((usedGB / totalGB) * 100).toFixed(1);
    
    const isLowSpace = diskSpace.free < (10 * 1024 ** 3);
    
    res.json({
      disk: {
        totalGB: parseFloat(totalGB),
        usedGB: parseFloat(usedGB),
        freeGB: parseFloat(freeGB),
        usedPercent: parseFloat(usedPercent)
      },
      warning: isLowSpace ? 'Low disk space! Less than 10GB remaining.' : null,
      releasesPath: RELEASES_BASE
    });
    
  } catch (error) {
    console.error('Error checking disk space:', error);
    res.status(500).json({ error: 'Failed to check disk space' });
  }
});

// =============================================================================
// ERROR HANDLER
// =============================================================================

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`✅ Release Management API running on http://localhost:${PORT}`);
});
