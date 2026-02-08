// =============================================================================
// FILE-HANDLER API - server.js
// =============================================================================
// This is the main backend server for the Music Agent MVP.
// It handles file uploads, metadata storage, and release management.
//
// How to run:   cd ~/Documents/music-agent-mvp/file-handler && node server.js
// Runs on:      http://localhost:3001
// Health check: curl http://localhost:3001/health
// =============================================================================


// =============================================================================
// SECTION 1: IMPORTS (Loading the tools we need)
// =============================================================================
// Think of these like hiring specialists for different jobs.
// Each package does one specific thing well.

const express = require('express');          // The web server framework - handles HTTP requests/responses
const multer = require('multer');            // File upload handler - processes multipart/form-data
const cors = require('cors');                // Cross-Origin Resource Sharing - allows n8n/Next.js to call our API
const path = require('path');                // File path utilities - joins folder paths safely across OS types
const fs = require('fs').promises;           // File system (async version) - read/write files without blocking
const fsSync = require('fs');                // File system (sync version) - for Multer callbacks that need instant results
const checkDiskSpace = require('check-disk-space').default;  // Monitors how much disk space is left
const musicMetadata = require('music-metadata');             // Reads audio file info (duration, bitrate, codec)
const archiver = require('archiver');                // ZIP file creator - packages files for distribution

// =============================================================================
// SECTION 2: SERVER CONFIGURATION
// =============================================================================
// Basic setup: create the server, set the port, enable middleware.

const app = express();   // Create the Express application (this IS our server)
const PORT = 3001;       // The port number our server listens on

// --- Middleware ---
// Middleware runs on EVERY request before it reaches your routes.
// Think of it like a security checkpoint at an airport - every request passes through.

app.use(cors());           // Allow requests from other origins (n8n on port 5678, Next.js on port 3000)
app.use(express.json());   // Parse JSON request bodies (needed for POST /metadata endpoint)


// =============================================================================
// SECTION 3: CONSTANTS
// =============================================================================
// The base folder where ALL release files are stored on your Mac.
// Every release gets its own subfolder inside this directory.

const RELEASES_BASE = '/Users/Mathias2/Documents/Music Agent/Releases';
app.use('/releases', express.static(RELEASES_BASE));



// =============================================================================
// SECTION 4: HELPER FUNCTIONS
// =============================================================================
// These are reusable tools that our routes call upon.
// Keeping them separate makes the code cleaner and easier to maintain.

// --- 4a: requireReleaseId ---
// Extracts and validates the releaseId from the URL query string or URL params.
// Example URL: /upload?releaseId=2026-02-05_SophieJoe_TellMe
// Example URL: /releases/2026-02-05_SophieJoe_TellMe/versions
// This function grabs the releaseId from either source.
// Throws an error if no releaseId is provided.

function requireReleaseId(req) {
  // Check URL params first (for /releases/:releaseId/versions)
  // Then fall back to query params (for /upload?releaseId=...)
  const releaseId = (req.params?.releaseId || req.query.releaseId || '').trim();
  
  if (!releaseId) {
    const err = new Error('Missing releaseId. Use /upload?releaseId=YOUR_RELEASE_ID or /releases/:releaseId/...');
    err.statusCode = 400;  // 400 = Bad Request (client sent something wrong)
    throw err;
  }
  return releaseId;
}


// --- 4b: classify ---
// Determines what TYPE of file was uploaded (audio, artwork, or video).
// This decides which subfolder the file goes into.
// Strategy: Check mimetype first (more reliable), fall back to file extension.
//
// Example: An MP3 file has mimetype "audio/mpeg" → goes to audio/ folder
// Example: A PNG file has mimetype "image/png"  → goes to artwork/ folder

function classify(file) {
  // First try: check the mimetype (the browser/sender tells us what type it is)
  if (file.mimetype?.startsWith('audio/')) return 'audio';
  if (file.mimetype?.startsWith('image/')) return 'artwork';
  if (file.mimetype?.startsWith('video/')) return 'video';
  
  // Fallback: check the file extension (in case mimetype is missing or wrong)
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.wav', '.mp3', '.flac', '.aiff', '.m4a', '.ogg'].includes(ext)) return 'audio';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'artwork';
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  
  return 'other';  // Unknown file type
}


// --- 4c: validateAudioFile ---
// Checks if an audio file is valid and not corrupt.
// Uses the music-metadata package to read the file's internal data.
// Returns either { valid: true, metadata: {...} } or { valid: false, error: "..." }
//
// What it checks:
// - Can the file be read at all? (not corrupt)
// - Does it have a duration? (real audio file)
// - Is duration between 1 second and 1 hour? (reasonable for a music track)

async function validateAudioFile(filePath) {
  try {
    const metadata = await musicMetadata.parseFile(filePath);
    
    // Check 1: Can we read basic format info?
    if (!metadata.format || !metadata.format.duration) {
      return {
        valid: false,
        error: 'Could not read audio metadata - file may be corrupt'
      };
    }
    
    // Check 2: Is the duration reasonable? (between 1 second and 1 hour)
    if (metadata.format.duration <= 0 || metadata.format.duration > 3600) {
      return {
        valid: false,
        error: `Invalid audio duration: ${metadata.format.duration}s (expected 1s - 1 hour)`
      };
    }
    
    // All checks passed! Return the metadata we extracted.
    return {
      valid: true,
      metadata: {
        duration: Math.round(metadata.format.duration),  // Duration in seconds
        bitrate: metadata.format.bitrate,                 // Quality indicator (e.g., 1411200 for WAV)
        sampleRate: metadata.format.sampleRate,           // e.g., 44100 Hz
        channels: metadata.format.numberOfChannels,       // 1 = mono, 2 = stereo
        codec: metadata.format.codec                      // e.g., "PCM" for WAV, "MPEG" for MP3
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: `Audio validation failed: ${error.message}`
    };
  }
}

// --- 4d: generateVersionId ---
// Converts a version name into a URL-safe folder name.
// Example: "Extended Mix" → "extended-mix"
// Example: "Radio Edit" → "radio-edit"
// Example: "Primary Version" → "primary"
//
// Why we need this:
// - Folder names can't have spaces (causes issues in terminal commands)
// - Lowercase makes everything consistent
// - Hyphens are safer than underscores for cross-platform compatibility

function generateVersionId(versionName) {
  if (!versionName || versionName.trim() === '') {
    return 'primary';  // Default fallback
  }
  
  // Special case: "Primary Version" should return "primary"
  if (versionName.trim().toLowerCase() === 'primary version') {
    return 'primary';
  }
  
  return versionName
    .toLowerCase()                    // "Extended Mix" → "extended mix"
    .replace(/\s+/g, '-')             // "extended mix" → "extended-mix"
    .replace(/[^a-z0-9-]/g, '')       // Remove any special characters
    .replace(/-+/g, '-')              // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');           // Remove leading/trailing hyphens
}


// --- 4e: getVersionInfo ---
// Extracts version information from the request.
// Returns an object with versionName and versionId.
// If no versionName is provided, defaults to "Primary Version".
//
// This centralizes version logic so we don't repeat it everywhere.

function getVersionInfo(req) {
  const versionName = (req.query.versionName || '').trim() || 'Primary Version';
  const versionId = generateVersionId(versionName);
  
  return {
    versionName,
    versionId,
    isPrimary: versionId === 'primary'
  };
}


// --- 4f: generateSoundCloudTags ---
// Smart tag generation for maximum SoundCloud discoverability.
// Extracts keywords from genre, artist, and title.
// Returns comma-separated string (SoundCloud format).
//
// Example input: artist="Sophie Joe", title="Tell Me", genre="Melodic House and Techno"
// Example output: "melodic, house, techno, sophiejoe, tell, me, electronic music, new music, new release, melodic house and techno"
//
// Why this helps:
// - Tags are crucial for SoundCloud's search algorithm
// - Automatically generates relevant tags without manual work
// - Removes duplicates and limits to 30 tags (SoundCloud's max)

function generateSoundCloudTags(artist, title, genre) {
  const tags = [];
  
  // Genre keywords (split multi-word genres like "Melodic House and Techno")
  const genreWords = genre.toLowerCase()
    .replace(/ and /g, ' ')  // "House and Techno" → "House Techno"
    .split(' ')
    .filter(word => word.length > 2);  // Skip short words like "of", "in"
  
  genreWords.forEach(word => tags.push(word));
  
  // Artist name (remove spaces, make it one tag)
  const artistTag = artist.toLowerCase().replace(/\s+/g, '');
  tags.push(artistTag);
  
  // Track title keywords (skip common filler words)
  const skipWords = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and'];
  const titleWords = title.toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .split(' ')
    .filter(word => word.length > 2 && !skipWords.includes(word));
  
  titleWords.forEach(word => tags.push(word));
  
  // High-value generic tags (these help with discovery)
  tags.push('electronic music', 'new music', 'new release', genre.toLowerCase());
  
  // Remove duplicates and limit to 30 tags (SoundCloud's max)
  const uniqueTags = [...new Set(tags)].slice(0, 30);
  
  return uniqueTags.join(', ');
}


// =============================================================================
// SECTION 5: MULTER CONFIGURATION (File Upload Settings)
// =============================================================================
// Multer handles the actual file saving when someone uploads files.
// This configuration tells Multer WHERE to save files and WHAT to name them.
//
// How it works:
// 1. A request comes in with files attached
// 2. Multer calls destination() to decide the folder path
// 3. Multer calls filename() to decide the file name
// 4. Multer saves the file to disk
//
// Key design decision: Audio files are version-specific, artwork/video are shared.
// - Audio: saved to versions/<versionId>/audio/
// - Artwork: saved to artwork/ (shared by all versions)
// - Video: saved to video/ (shared by all versions)

const storage = multer.diskStorage({
  
  // Where to save the file (destination folder)
  destination: function (req, file, cb) {
    const releaseId = requireReleaseId(req);
    const releasePath = path.join(RELEASES_BASE, releaseId);
    
    const fileType = classify(file);
    
    let targetFolder;
    
    if (fileType === 'audio') {
      // Audio files are version-specific
      const { versionId } = getVersionInfo(req);
      targetFolder = path.join(releasePath, 'versions', versionId, 'audio');
    } else if (fileType === 'artwork') {
      // Artwork is shared across all versions
      targetFolder = path.join(releasePath, 'artwork');
    } else if (fileType === 'video') {
      // Video is shared across all versions
      targetFolder = path.join(releasePath, 'video');
    } else {
      // Unknown file type - save to root of release folder
      targetFolder = releasePath;
    }
    
    // Create the folder if it doesn't exist
    // recursive: true means it creates parent folders too (like mkdir -p)
    fsSync.mkdirSync(targetFolder, { recursive: true });
    
    cb(null, targetFolder);
  },
  
  // What to name the file
  filename: function (req, file, cb) {
    // Keep the original filename as-is
    // Example: "Tell Me (Extended Mix).wav" stays as "Tell Me (Extended Mix).wav"
    cb(null, file.originalname);
  }
});

// Create the Multer upload handler with our custom storage config
// .any() means accept files from ANY form field name (flexible for different upload methods)
const upload = multer({ storage: storage });


// =============================================================================
// SECTION 6: API ROUTES (The actual endpoints)
// =============================================================================
// Each route handles a specific action:
// - GET routes: retrieve data (read-only)
// - POST routes: create new data or trigger actions
// - PATCH routes: update existing data
// - DELETE routes: remove data

// --- 6a: Health Check ---
// Simple endpoint to verify the server is running.
// Example: curl http://localhost:3001/health

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'File handler is running' 
  });
});


// --- 6b: File Upload ---
// Accepts multipart/form-data uploads (audio, artwork, video).
// Validates audio files to ensure they're not corrupt.
// Detects duplicates and prevents re-uploading the same file.
//
// Query parameters:
//   - releaseId (required): The release identifier (e.g., "2026-02-05_SophieJoe_TellMe")
//   - artist (required): Artist name
//   - title (required): Track title
//   - genre (required): Genre
//   - versionName (optional): Version name (defaults to "Primary Version")

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
    
    // Load existing metadata if it exists
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      // Metadata file doesn't exist yet, that's okay
    }
    
    // Initialize versions object if it doesn't exist
    if (!metadata.versions) {
      metadata.versions = {};
    }
    
    // Check if this version already has audio (duplicate detection)
    if (metadata.versions[versionId]) {
      const versionAudioPath = path.join(releasePath, 'versions', versionId, 'audio');
      let existingAudioFiles = [];
      
      try {
        existingAudioFiles = await fs.readdir(versionAudioPath);
      } catch (error) {
        // Folder doesn't exist, that's fine
      }
      
      if (existingAudioFiles.length > 0) {
        console.log(`🚫 Duplicate upload detected: ${versionId} already exists for ${releaseId}`);
        return res.status(409).json({
          success: false,
          error: `Version "${versionName}" already exists for this release`,
          existingVersion: metadata.versions[versionId]
        });
      }
    }
    
    const savedFiles = {
      audio: [],
      artwork: [],
      video: []
    };
    
    // Process each uploaded file
    for (const file of req.files) {
      const fileType = classify(file);
      
      if (fileType === 'audio') {
        // Validate audio file
        console.log(`🎵 Validating audio: ${file.originalname}`);
        
        const validation = await validateAudioFile(file.path);
        
        if (!validation.valid) {
          // Audio is invalid - delete it and return error
          await fs.unlink(file.path);
          return res.status(400).json({
            success: false,
            error: validation.error,
            file: file.originalname
          });
        }
        
        console.log(`✅ Audio valid: ${validation.metadata.duration}s, ${validation.metadata.codec}`);
        
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
    
    // Store version info in metadata
    metadata.versions[versionId] = {
      versionName: versionName,
      versionId: versionId,
      createdAt: new Date().toISOString(),
      files: savedFiles
    };
    
    // Save updated metadata
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


// --- 6c: Save Metadata ---
// Saves or updates the metadata.json file for a release.
// This is called by n8n after the Create Metadata node.

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
    
    // Ensure the release folder exists
    await fs.mkdir(releasePath, { recursive: true });
    
    // Read existing metadata if it exists
    let existingMetadata = {};
    try {
      const existingContent = await fs.readFile(metadataPath, 'utf8');
      existingMetadata = JSON.parse(existingContent);
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
    
    // Merge new metadata with existing (preserves versions, files, distribution)
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


// --- 6d: List Releases ---
// Returns all releases sorted by date (newest first).
// Each release includes its metadata and file counts.

app.get('/releases', async (req, res) => {
  try {
    console.log('📂 Listing releases...');
    
    const folders = await fs.readdir(RELEASES_BASE);
    const releases = [];
    
    for (const folder of folders) {
      // Skip hidden files and non-directories
      if (folder.startsWith('.')) continue;
      
      const folderPath = path.join(RELEASES_BASE, folder);
      const stats = await fs.stat(folderPath);
      
      if (!stats.isDirectory()) continue;
      
      // Try to read metadata.json
      const metadataPath = path.join(folderPath, 'metadata.json');
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        
        // Count files by type
        const fileCounts = {
          audio: 0,
          artwork: 0,
          video: 0
        };
        
        // Count files from all versions
        if (metadata.versions) {
          for (const versionId in metadata.versions) {
            const version = metadata.versions[versionId];
            if (version.files) {
              fileCounts.audio += version.files.audio?.length || 0;
              fileCounts.artwork += version.files.artwork?.length || 0;
              fileCounts.video += version.files.video?.length || 0;
            }
          }
        }
        
        releases.push({
          releaseId: metadata.releaseId || folder,
          artist: metadata.artist,
          title: metadata.title,
          genre: metadata.genre,
          releaseDate: metadata.releaseDate,
          createdAt: metadata.createdAt,
          versionCount: Object.keys(metadata.versions || {}).length,
          fileCounts: fileCounts,
          hasDistribution: !!metadata.distribution
        });
        
      } catch (error) {
        // Metadata file doesn't exist or is invalid
        releases.push({
          releaseId: folder,
          error: 'No metadata.json found',
          createdAt: stats.birthtime
        });
      }
    }
    
    // Sort by releaseDate (newest first)
    releases.sort((a, b) => {
      const dateA = new Date(a.releaseDate || a.createdAt);
      const dateB = new Date(b.releaseDate || b.createdAt);
      return dateB - dateA;
    });
    
    console.log(`✅ Found ${releases.length} releases`);
    
    res.json({
      success: true,
      count: releases.length,
      releases: releases
    });
    
  } catch (error) {
    console.error('❌ Error listing releases:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// --- 6e: Get Single Release ---
// Returns complete details for one specific release.
// Includes metadata, all versions, files, and distribution tracking.

app.get('/releases/:releaseId', async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    // Check if release exists
    try {
      await fs.access(releasePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Release not found: ${releaseId}`
      });
    }
    
    // Read metadata
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    
    res.json({
      success: true,
      release: metadata
    });
    
  } catch (error) {
    console.error('Error getting release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// --- 6f: Update Distribution Tracking ---
// Updates the distribution status for a release.
// Handles all 3 paths: release, submit, promote.
//
// Body format:
// {
//   "path": "release",           // or "submit" or "promote"
//   "platform": "SoundCloud",
//   "status": "package_generated",
//   "versionId": "primary",      // required for release path
//   "label": "Anjunadeep",       // required for submit path
//   ... (any other fields)
// }

app.patch('/releases/:releaseId/distribution', async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const { path: distPath, platform, versionId, label, ...updateData } = req.body;
    
    if (!distPath || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: path and platform'
      });
    }
    
    if (!['release', 'submit', 'promote'].includes(distPath)) {
      return res.status(400).json({
        success: false,
        error: 'path must be one of: release, submit, promote'
      });
    }
    
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');
    
    // Read existing metadata
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    
    // Initialize distribution structure if it doesn't exist
    if (!metadata.distribution) {
      metadata.distribution = {};
    }
    
    if (!metadata.distribution[distPath]) {
      metadata.distribution[distPath] = [];
    }
    
    // Create the distribution entry
    const entry = {
      platform: platform,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Add path-specific required fields
    if (distPath === 'release' && versionId) {
      entry.versionId = versionId;
    }
    
    if (distPath === 'submit' && label) {
      entry.label = label;
    }
    
    // Find existing entry to update
    let existingIndex = -1;
    
    if (distPath === 'release') {
      // For release path: match by platform + versionId
      existingIndex = metadata.distribution[distPath].findIndex(
        e => e.platform === platform && e.versionId === versionId
      );
    } else if (distPath === 'submit') {
      // For submit path: match by platform + label (can have multiple submissions per platform)
      existingIndex = metadata.distribution[distPath].findIndex(
        e => e.platform === platform && e.label === label
      );
    } else {
      // For promote path: match by platform only
      existingIndex = metadata.distribution[distPath].findIndex(
        e => e.platform === platform
      );
    }
    
    if (existingIndex >= 0) {
      // Update existing entry
      metadata.distribution[distPath][existingIndex] = {
        ...metadata.distribution[distPath][existingIndex],
        ...entry
      };
    } else {
      // Add new entry
      metadata.distribution[distPath].push(entry);
    }
    
    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({
      success: true,
      message: `Distribution tracking updated for ${platform} on ${distPath} path`,
      entry: entry
    });
    
  } catch (error) {
    console.error('Error updating distribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// --- 6g: Add Audio Version to Existing Release ---
// Allows adding additional audio versions (Extended Mix, Radio Edit, etc.)
// to an existing release without re-uploading artwork/video.
//
// Query parameters:
//   - releaseId (required): The release identifier
//   - versionName (required): Name of the new version (e.g., "Extended Mix")

app.post('/releases/:releaseId/versions', 
  // Middleware chain: check releaseId → upload files → process
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
      
      // Load existing metadata
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // Check if this version already exists
      if (metadata.versions && metadata.versions[versionId]) {
        return res.status(409).json({
          success: false,
          error: `Version "${versionName}" already exists for this release`,
          existingVersion: metadata.versions[versionId]
        });
      }
      
      const savedFiles = {
        audio: [],
        artwork: [],
        video: []
      };
      
      // Process uploaded files (should only be audio for this endpoint)
      for (const file of req.files) {
        const fileType = classify(file);
        
        if (fileType === 'audio') {
          console.log(`🎵 Validating audio: ${file.originalname}`);
          
          const validation = await validateAudioFile(file.path);
          
          if (!validation.valid) {
            await fs.unlink(file.path);
            return res.status(400).json({
              success: false,
              error: validation.error,
              file: file.originalname
            });
          }
          
          console.log(`✅ Audio valid: ${validation.metadata.duration}s`);
          
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
          // Unexpected file type
          await fs.unlink(file.path);
          return res.status(400).json({
            success: false,
            error: `Only audio files are allowed for adding versions. Received: ${fileType}`,
            file: file.originalname
          });
        }
      }
      
      // Add new version to metadata
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
      
      console.log(`✅ Added version: ${versionName} (${versionId})`);
      
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


// --- 6i: Generate SoundCloud Package ---
// Creates a ZIP file containing audio, artwork, and metadata.txt for SoundCloud upload.
// This is the first step of Mini-MVP 1 (SoundCloud automation).
//
// Query parameters:
//   - releaseId (required): The release identifier
//   - versionId (optional): Which version to package (defaults to "primary")
//   - privacy (optional): "public" or "private" (defaults to "public")

app.post('/distribute/soundcloud/package', async (req, res) => {
  try {
    const releaseId = requireReleaseId(req);
    const versionId = req.query.versionId || 'primary';
    const privacy = req.query.privacy || 'public';
    
    console.log(`\n🎵 Generating SoundCloud package for ${releaseId} (${versionId})`);
    
    // --- STEP 1: Validate release exists ---
    
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
    
    // --- STEP 2: Load metadata ---
    
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);
    
    // --- STEP 3: Validate version exists ---
    
    if (!metadata.versions || !metadata.versions[versionId]) {
      return res.status(404).json({
        success: false,
        error: `Version "${versionId}" not found for this release`,
        availableVersions: Object.keys(metadata.versions || {})
      });
    }
    
    const version = metadata.versions[versionId];
    
    // --- STEP 4: Find audio file ---
    
    if (!version.files || !version.files.audio || version.files.audio.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No audio file found for this version'
      });
    }
    
    const audioFile = version.files.audio[0].filename;
    const audioPath = path.join(releasePath, 'versions', versionId, 'audio', audioFile);
    
    try {
      await fs.access(audioPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Audio file not found: ${audioFile}`
      });
    }
    
    // --- STEP 5: Find artwork file ---
    
    // Artwork is shared across all versions, so check any version for it
    let artworkFile = null;
    let artworkPath = null;
    
    for (const vid in metadata.versions) {
      const v = metadata.versions[vid];
      if (v.files && v.files.artwork && v.files.artwork.length > 0) {
        artworkFile = v.files.artwork[0].filename;
        artworkPath = path.join(releasePath, 'artwork', artworkFile);
        break;
      }
    }
    
    if (!artworkFile) {
      return res.status(400).json({
        success: false,
        error: 'No artwork file found for this release'
      });
    }
    
    try {
      await fs.access(artworkPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Artwork file not found: ${artworkFile}`
      });
    }
    
    // --- STEP 6: Generate metadata.txt content ---
    
    const versionName = version.versionName
                       .split('-')
                       .map(word => 
                         word.charAt(0).toUpperCase() + word.slice(1)
                       ).join(' ');
    
    const displayTitle = versionId === 'primary' 
      ? metadata.title
      : `${metadata.title} (${versionName})`;
    
    const releaseDate = new Date(metadata.releaseDate);
    const monthYear = releaseDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Format release date for SoundCloud (MM/DD/YYYY format required)
    const soundcloudDate = releaseDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    // Generate smart tags using our helper function
    const autoTags = generateSoundCloudTags(metadata.artist, metadata.title, metadata.genre);
    
    const artistTag = metadata.artist.toLowerCase().replace(/\s+/g, '');
    const titleTag = metadata.title.toLowerCase().replace(/\s+/g, '');
    const genreTag = metadata.genre.toLowerCase().replace(/\s+/g, '').replace(/&/g, 'and');
    
    const metadataText = `╔════════════════════════════════════════════════════════════════════╗
║           SOUNDCLOUD UPLOAD METADATA                                ║
║           Generated: ${new Date().toLocaleDateString('en-US')}                               ║
╚════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════
  SECTION 1: BASIC INFO (Playwright will auto-fill these fields)
═══════════════════════════════════════════════════════════════════════

TRACK_TITLE: ${displayTitle}
└─ Character limit: 100 chars

MAIN_ARTIST: ${metadata.artist}
└─ Note: For multiple artists, separate with commas

GENRE: ${metadata.genre}
└─ SoundCloud uses searchable dropdown - Playwright will search and select

TAGS: ${autoTags}
└─ Limit: 30 tags max (comma-separated)
└─ Auto-generated from genre, artist, and track keywords for maximum discoverability

DESCRIPTION:
${metadata.artist} - ${displayTitle}

Genre: ${metadata.genre}
Released: ${monthYear}

${metadata.artist.includes(' ') ? '🎵' : '🎶'} New ${metadata.genre} release

Follow ${metadata.artist}:
→ SoundCloud: [Add your SoundCloud profile URL]
→ Instagram: @[yourusername]
→ Spotify: [Add your Spotify artist link]
→ Beatport: [Add your Beatport artist link]

#${genreTag} #${artistTag} #newmusic #electronicmusic
└─ Character limit: 4,000 chars

PRIVACY: ${privacy.charAt(0).toUpperCase() + privacy.slice(1)}
└─ Options: Public (recommended for reach) | Private (link-only) | Scheduled

RELEASE_DATE: ${soundcloudDate}
└─ Format: MM/DD/YYYY (SoundCloud's required format)

═══════════════════════════════════════════════════════════════════════
  SECTION 2: PERMISSIONS (Defaults recommended - change only if needed)
═══════════════════════════════════════════════════════════════════════

SoundCloud's default permission settings are optimized for public releases.
No changes needed unless you have specific requirements:

✓ Enable direct downloads: OFF (keeps control of distribution)
✓ Offline listening: ON (fans can save for offline play)
✓ Include in RSS feed: ON (enables podcast/blog embedding)
✓ Display embed code: ON (allows website embedding)
✓ Enable app playback: ON (third-party music apps can play)
✓ Allow comments: ON (fan engagement!)
✓ Show comments to public: OFF (you moderate first)
✓ Show track insights to public: ON (transparency)
✓ Geoblocking: Worldwide (no restrictions)

═══════════════════════════════════════════════════════════════════════
  SECTION 3: LICENSING (Default recommended)
═══════════════════════════════════════════════════════════════════════

RECOMMENDED: "All rights reserved" (SoundCloud's default)
└─ Protects your copyright - correct for most producers

ALTERNATIVE: Creative Commons licenses
└─ Only use if you explicitly want to allow remixing/sharing
└─ Options: CC BY, CC BY-NC, CC BY-SA, etc.

═══════════════════════════════════════════════════════════════════════
  SECTION 4: ADVANCED DETAILS (Optional - fill if applicable)
═══════════════════════════════════════════════════════════════════════

BUY_LINK: [Leave empty or add purchase link]
└─ Example: https://yourname.bandcamp.com or Beatport link

BUY_LINK_TITLE: [Default is "Buy"]
└─ Customize: "Download on Beatport" or "Stream on Spotify"

RECORD_LABEL: [Add if releasing under a label]
└─ Leave empty for self-releases

ISRC: [Add if you have one from DistroKid/distributor]
└─ Format: CC-XXX-YY-NNNNN
└─ If you don't have one yet, leave empty

EXPLICIT_CONTENT: [Check on SoundCloud if applicable]
└─ Mark if track contains profanity, sexual content, or violence

PUBLISHER: [Add if you have a publishing deal]
└─ Example: Warner Chappell, Sony ATV

P_LINE: [Phonographic copyright]
└─ Format: ℗ ${releaseDate.getFullYear()} ${metadata.artist}
└─ Example: ℗ ${releaseDate.getFullYear()} ${metadata.artist}

═══════════════════════════════════════════════════════════════════════
  SECTION 5: CHARACTER LIMITS (Quick Reference)
═══════════════════════════════════════════════════════════════════════

✓ Title: 100 characters max
✓ Description: 4,000 characters max  
✓ Tags: 30 tags maximum

═══════════════════════════════════════════════════════════════════════
  PACKAGE CONTENTS
═══════════════════════════════════════════════════════════════════════

This ZIP contains:
1. Audio: ${audioFile}
2. Artwork: ${artworkFile}
3. This metadata guide

Next Steps (Mini-MVP 1 - Step 4):
1. Playwright will open soundcloud.com/upload
2. Playwright will upload the audio file
3. Playwright will fill all SECTION 1 fields automatically
4. YOU review everything and click "Upload" to publish

═══════════════════════════════════════════════════════════════════════

Generated by Music Agent MVP - Mini-MVP 1: SoundCloud
Version: ${versionId} | Privacy: ${privacy}
Artist retains all rights. Review all fields before publishing.
`;

    // --- STEP 7: Create packages folder ---
    
    const packagesDir = path.join(releasePath, 'packages');
    
    try {
      await fs.mkdir(packagesDir, { recursive: true });
    } catch (error) {
      // Folder might already exist, that's okay
    }

    // --- STEP 8: Create the ZIP file ---
    
    const zipFileName = `soundcloud-${versionId}.zip`;
    const zipPath = path.join(packagesDir, zipFileName);
    
    try {
      await fs.unlink(zipPath);
      console.log(`   Deleted old package: ${zipFileName}`);
    } catch {
      // File doesn't exist, that's fine
    }

    console.log(`   Creating ZIP: ${zipFileName}`);

    const output = fsSync.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const zipPromise = new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`✅ ZIP created: ${archive.pointer()} bytes`);
        resolve();
      });
      
      archive.on('error', (err) => {
        console.error(`❌ ZIP creation failed: ${err.message}`);
        reject(err);
      });
    });

    archive.pipe(output);
    archive.file(audioPath, { name: audioFile });
    archive.file(artworkPath, { name: artworkFile });
    archive.append(metadataText, { name: 'soundcloud-metadata.txt' });
    await archive.finalize();
    await zipPromise;

    const stats = await fs.stat(zipPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`📦 Package ready: ${zipFileName} (${fileSizeKB} KB)`);

    // --- STEP 9: Update distribution tracking ---
    
    if (!metadata.distribution) {
      metadata.distribution = {};
    }
    
    if (!metadata.distribution.release) {
      metadata.distribution.release = [];
    }

    const existingIndex = metadata.distribution.release.findIndex(
      e => e.platform === 'SoundCloud' && e.versionId === versionId
    );

    const distributionEntry = {
      platform: 'SoundCloud',
      versionId: versionId,
      status: 'package_generated',
      privacy: privacy,
      packagePath: `packages/${zipFileName}`,
      generatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      metadata.distribution.release[existingIndex] = {
        ...metadata.distribution.release[existingIndex],
        ...distributionEntry
      };
      console.log(`   Updated SoundCloud distribution tracking for ${versionId}`);
    } else {
      metadata.distribution.release.push(distributionEntry);
      console.log(`   Added SoundCloud to distribution tracking for ${versionId}`);
    }

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

// --- STEP 10: Success response ---
    
res.json({
  success: true,
  message: `SoundCloud package generated for ${versionId}`,
  packagePath: `${releaseId}/packages/${zipFileName}`,  // Added this line for frontend
  package: {
    fileName: zipFileName,
    path: zipPath,
    sizeKB: parseFloat(fileSizeKB),
    contents: [
      audioFile,
      artworkFile,
      'soundcloud-metadata.txt'
    ]
  },
  nextSteps: [
    '1. Download the ZIP file from the packages folder',
    '2. Extract the ZIP',
    '3. Playwright will open soundcloud.com/upload (Step 4)',
    '4. Playwright will upload audio and fill all fields',
    '5. YOU review and click "Upload" button to publish'
  ]
});

  } catch (error) {
    console.error('❌ SoundCloud package error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// --- 6h: Storage Status ---
// Reports disk space usage for the Releases drive.
// Warns if less than 10GB free (important with large WAV files ~50-100MB each).

app.get('/storage/status', async (req, res) => {
  try {
    const diskSpace = await checkDiskSpace(RELEASES_BASE);
    
    // Convert bytes to gigabytes for readability
    const totalGB = (diskSpace.size / (1024 ** 3)).toFixed(2);
    const freeGB = (diskSpace.free / (1024 ** 3)).toFixed(2);
    const usedGB = (totalGB - freeGB).toFixed(2);
    const usedPercent = ((usedGB / totalGB) * 100).toFixed(1);
    
    // Warning threshold: less than 10GB free
    const isLowSpace = diskSpace.free < (10 * 1024 ** 3);
    
    console.log(`💾 Disk space check: ${freeGB}GB free (${usedPercent}% used)`);
    
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
    console.error('❌ Error checking disk space:', error);
    res.status(500).json({ error: 'Failed to check disk space' });
  }
});


// =============================================================================
// SECTION 7: ERROR HANDLER (Catch-all for unhandled errors)
// =============================================================================

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});


// =============================================================================
// SECTION 8: START THE SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`✅ File-handler server running on port ${PORT}`);
});
