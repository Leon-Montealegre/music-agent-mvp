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

const RELEASES_BASE = '/Users/Mathias2/Documents/Music Agent/Releases';
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
