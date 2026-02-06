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


// =============================================================================
// SECTION 4: HELPER FUNCTIONS
// =============================================================================
// These are reusable tools that our routes call upon.
// Keeping them separate makes the code cleaner and easier to maintain.

// --- 4a: requireReleaseId ---
// Extracts and validates the releaseId from the URL query string.
// Example URL: /upload?releaseId=2026-02-05_SophieJoe_TellMe
// This function grabs "2026-02-05_SophieJoe_TellMe" from that URL.
// Throws an error if no releaseId is provided.

function requireReleaseId(req) {
  const releaseId = (req.query.releaseId || '').trim();
  if (!releaseId) {
    const err = new Error('Missing releaseId. Use /upload?releaseId=YOUR_RELEASE_ID');
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
// 5. THEN your route handler runs with req.files populated

const storage = multer.diskStorage({
  // WHERE to save each file
  // Creates folder structure: Releases/<releaseId>/<audio|artwork|video>/
  destination: function (req, file, cb) {
    try {
      const releaseId = requireReleaseId(req);
      const subfolder = classify(file);  // "audio", "artwork", or "video"
      const fullPath = path.join(RELEASES_BASE, releaseId, subfolder);
      fsSync.mkdirSync(fullPath, { recursive: true });  // Create folders if they don't exist
      cb(null, fullPath);  // Tell Multer to save here
    } catch (e) {
      cb(e);  // Pass error to Multer
    }
  },
  // WHAT to name each file (keep original filename)
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Create the upload middleware using our storage configuration
// .any() means accept files from ANY form field name
const upload = multer({ storage });


// =============================================================================
// SECTION 6: API ROUTES
// =============================================================================
// These are the endpoints that handle incoming requests.
// Each route has: HTTP method (GET/POST), URL path, and handler function.
//
// Current routes:
//   GET  /health          → Server status check
//   POST /upload          → Upload files for a release (with duplicate detection + audio validation)
//   POST /metadata        → Save metadata.json for a release
//   GET  /releases        → List all releases (sorted newest first)
//   GET  /storage/status  → Check disk space
//
// Milestone 5 routes (to be added below):
//   GET  /releases/:releaseId              → Get one specific release
//   PATCH /releases/:releaseId/distribution → Update distribution tracking
//   POST /distribute/youtube               → Upload to YouTube via API
//   POST /distribute/soundcloud/package    → Generate SoundCloud upload package
//   POST /distribute/distrokid/package     → Generate DistroKid submission package
//   POST /distribute/labelradar            → Submit to LabelRadar
//   POST /marketing/captions               → Generate social media captions


// --- 6a: Health Check ---
// Simple endpoint to verify the server is running.
// Used by: startup verification, n8n connection tests

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'File handler is running' });
});


// --- 6b: File Upload ---
// Receives files from n8n Form Trigger (or curl for testing).
// This route has TWO middleware functions chained together:
//   1. First function: checks for duplicates BEFORE uploading
//   2. upload.any(): Multer saves the files to disk
//   3. Second function (async): validates audio files AFTER saving
//
// URL format: POST /upload?releaseId=...&artist=...&title=...&genre=...
// The query parameters are passed through from n8n so metadata can reference them.

app.post('/upload', (req, res, next) => {
  // --- STEP 1: Duplicate Detection (runs BEFORE file upload) ---
  const releaseId = req.query.releaseId;
  
  if (!releaseId) {
    return res.status(400).json({
      success: false,
      error: 'Missing releaseId parameter'
    });
  }
  
  const releasePath = path.join(RELEASES_BASE, releaseId);
  
  // Check if a folder with this releaseId already exists
  if (fsSync.existsSync(releasePath)) {
    console.log(`🚫 Duplicate upload attempt blocked: ${releaseId} already exists`);
    return res.status(409).json({  // 409 = Conflict (resource already exists)
      success: false,
      error: 'Duplicate release detected',
      message: `Release "${releaseId}" already exists. Use a different release name or delete the existing release first.`,
      existingPath: releasePath
    });
  }
  
  next();  // No duplicate found → continue to Multer upload
  
}, upload.any(), async (req, res) => {
  // --- STEP 2: Post-Upload Processing (runs AFTER files are saved) ---
  const releaseId = req.query.releaseId;
  const artist = req.query.artist;
  const title = req.query.title;
  const genre = req.query.genre;
  
  console.log(`📥 Upload received: ${req.files?.length || 0} files for ${releaseId}`);
  
  // --- STEP 3: Audio Validation ---
  // Find all audio files that were uploaded and validate each one
  const audioFiles = req.files?.filter(f => classify(f) === 'audio') || [];
  const validationResults = [];
  
  for (const audioFile of audioFiles) {
    console.log(`🎵 Validating audio: ${audioFile.originalname}...`);
    const validation = await validateAudioFile(audioFile.path);
    
    if (!validation.valid) {
      console.error(`❌ Audio validation failed: ${audioFile.originalname}`);
      console.error(`   Error: ${validation.error}`);
      
      // Delete the invalid file (it was already saved by Multer)
      fsSync.unlinkSync(audioFile.path);
      
      return res.status(422).json({  // 422 = Unprocessable Entity (file is invalid)
        success: false,
        error: 'Audio file validation failed',
        file: audioFile.originalname,
        reason: validation.error
      });
    }
    
    console.log(`✅ Audio valid: ${audioFile.originalname} (${validation.metadata.duration}s, ${validation.metadata.codec})`);
    validationResults.push({
      file: audioFile.originalname,
      ...validation.metadata
    });
  }
  
  // Log where each file was saved
  req.files?.forEach(f => {
    console.log(`   → ${f.originalname} saved to ${path.basename(path.dirname(f.path))}/ folder`);
  });

  // --- STEP 4: Send Success Response ---
  // Returns all file info + query params so n8n can use them for metadata generation
  res.json({
    success: true,
    releaseId,
    artist,
    title,
    genre,
    filesUploaded: (req.files || []).map(f => ({
      originalName: f.originalname,
      savedTo: f.path,
      size: f.size,
      mimetype: f.mimetype,
    })),
    audioValidation: validationResults
  });
});


// --- 6c: Save Metadata ---
// Receives a JSON body with releaseId + metadata object, saves as metadata.json.
// Called by: n8n "Save Metadata" HTTP Request node after upload.
//
// Expected body: { "releaseId": "2026-02-05_...", "metadata": { artist, title, genre, ... } }

app.post('/metadata', (req, res) => {
  const { releaseId, metadata } = req.body;
  
  if (!releaseId || !metadata) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing releaseId or metadata' 
    });
  }
  
  const releasePath = path.join(RELEASES_BASE, releaseId);
  const metadataPath = path.join(releasePath, 'metadata.json');
  
  try {
    // Create the release folder if it doesn't exist yet
    if (!fsSync.existsSync(releasePath)) {
      fsSync.mkdirSync(releasePath, { recursive: true });
    }
    
    // Write metadata as formatted JSON (null, 2 = pretty-print with 2-space indent)
    fsSync.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Metadata saved successfully',
      path: metadataPath 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// --- 6d: List All Releases ---
// Scans the Releases folder, reads each release's metadata.json,
// and returns them all sorted by creation date (newest first).
// Called by: Future dashboard UI, testing via curl

app.get('/releases', async (req, res) => {
  try {
    // Read all items in the Releases folder
    const releasesFolders = await fs.readdir(RELEASES_BASE, { withFileTypes: true });
    // Filter to only directories (ignore stray files)
    const releaseDirs = releasesFolders.filter(item => item.isDirectory());
    const releases = [];
    
    // Read metadata.json from each release folder
    for (const dir of releaseDirs) {
      const releaseId = dir.name;
      const metadataPath = path.join(RELEASES_BASE, releaseId, 'metadata.json');
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        releases.push(metadata);
      } catch (error) {
        // If a folder has no metadata.json, warn but don't crash
        console.warn(`⚠️  Warning: Could not read metadata for ${releaseId}:`, error.message);
      }
    }
    
    // Sort: newest releases first (by createdAt timestamp)
    releases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📂 Listed ${releases.length} release(s)`);
    
    res.json({
      count: releases.length,
      releases: releases
    });
    
  } catch (error) {
    console.error('❌ Error listing releases:', error);
    res.status(500).json({ error: 'Failed to list releases' });
  }
});


// =============================================================================
// ✏️  ADD NEW MILESTONE 5 ROUTES HERE (between /releases and /storage/status)
// =============================================================================
// Upcoming endpoints:
//   GET  /releases/:releaseId              → Step 1: Get single release details
//   PATCH /releases/:releaseId/distribution → Step 2: Update distribution tracking
//   POST /marketing/captions               → Step 3: Generate social media captions
//   POST /distribute/soundcloud/package    → Step 4: SoundCloud package generator
//   POST /distribute/distrokid/package     → Step 4: DistroKid package generator
//   POST /distribute/labelradar            → Step 4: LabelRadar submission
//   POST /distribute/youtube               → Step 5: YouTube API upload
// =============================================================================
// --- 6f: Get Single Release ---
// Returns the full metadata for one specific release.
// Uses a URL parameter (:releaseId) instead of a query string (?releaseId=...).
// Example: GET /releases/2026-02-05_SophieJoe_TellMe
//
// How URL params work:
//   Route definition:  /releases/:releaseId
//   Actual request:    /releases/2026-02-05_SophieJoe_TellMe
//   req.params.releaseId = "2026-02-05_SophieJoe_TellMe"
//
// This is different from query params (req.query) that use ?key=value format.
// URL params are part of the path itself — cleaner for "get this specific thing" requests.

app.get('/releases/:releaseId', async (req, res) => {
  try {
    const releaseId = req.params.releaseId;
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');

    // Check if the release folder exists
    try {
      await fs.access(releasePath);
    } catch {
      console.log(`🔍 Release not found: ${releaseId}`);
      return res.status(404).json({  // 404 = Not Found
        success: false,
        error: 'Release not found',
        message: `No release found with ID "${releaseId}"`
      });
    }

    // Read and return the metadata
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    console.log(`🔍 Found release: ${releaseId}`);

    res.json({
      success: true,
      release: metadata
    });

  } catch (error) {
    console.error(`❌ Error fetching release ${req.params.releaseId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch release details'
    });
  }
});

// --- 6g: Update Distribution Tracking ---
// Adds or updates a distribution entry in a release's metadata.json.
// This is how the system tracks "where has this track been sent?"
//
// Uses PATCH because we're updating PART of an existing resource (not creating new).
// URL format: PATCH /releases/:releaseId/distribution
//
// Expected body example (adding a YouTube publish entry):
// {
//   "path": "publish",
//   "entry": {
//     "platform": "YouTube",
//     "status": "published",
//     "privacy": "unlisted",
//     "videoId": "abc123",
//     "url": "https://youtube.com/watch?v=abc123"
//   }
// }
//
// Distribution paths: "publish", "labels", "streaming", "marketing"
// Each path holds an array of entries (one per platform action).

app.patch('/releases/:releaseId/distribution', async (req, res) => {
  try {
    const releaseId = req.params.releaseId;
    const { path: distPath, entry } = req.body;

    // --- Validation ---

    // Check that the request body has the required fields
    if (!distPath || !entry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Request body must include "path" (publish/labels/streaming/marketing) and "entry" (object with platform details)'
      });
    }

    // Only allow the 4 valid distribution paths
    const validPaths = ['publish', 'labels', 'streaming', 'marketing'];
    if (!validPaths.includes(distPath)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid distribution path',
        message: `"${distPath}" is not valid. Use one of: ${validPaths.join(', ')}`
      });
    }

    // Every entry must specify which platform it's for
    if (!entry.platform) {
      return res.status(400).json({
        success: false,
        error: 'Missing platform',
        message: 'The entry object must include a "platform" field (e.g., "YouTube", "SoundCloud", "DistroKid")'
      });
    }

    // --- Read existing metadata ---
    const releasePath = path.join(RELEASES_BASE, releaseId);
    const metadataPath = path.join(releasePath, 'metadata.json');

    // Check if the release exists
    try {
      await fs.access(releasePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Release not found',
        message: `No release found with ID "${releaseId}"`
      });
    }

    // Read the current metadata.json
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    // --- Update the distribution section ---

    // Create the distribution object if it doesn't exist yet
    // (old releases from before Milestone 5 won't have it)
    if (!metadata.distribution) {
      metadata.distribution = {};
    }

    // Create the specific path array if it doesn't exist yet
    // e.g., metadata.distribution.publish = []
    if (!metadata.distribution[distPath]) {
      metadata.distribution[distPath] = [];
    }

    // Add a timestamp to the entry automatically
    entry.updatedAt = new Date().toISOString();

    // Check for duplicate: same platform + same path already exists?
    // This prevents accidentally adding "YouTube" to "publish" twice.
    const existingIndex = metadata.distribution[distPath].findIndex(
      e => e.platform === entry.platform
    );

    if (existingIndex >= 0) {
      // Update the existing entry (merge new data on top of old)
      metadata.distribution[distPath][existingIndex] = {
        ...metadata.distribution[distPath][existingIndex],  // Keep existing fields
        ...entry                                             // Overwrite with new fields
      };
      console.log(`📦 Updated ${entry.platform} in ${distPath} for ${releaseId}`);
    } else {
      // Add as a new entry
      metadata.distribution[distPath].push(entry);
      console.log(`📦 Added ${entry.platform} to ${distPath} for ${releaseId}`);
    }

    // --- Save the updated metadata ---
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      message: existingIndex >= 0
        ? `Updated ${entry.platform} in ${distPath}`
        : `Added ${entry.platform} to ${distPath}`,
      distribution: metadata.distribution
    });

  } catch (error) {
    console.error(`❌ Error updating distribution for ${req.params.releaseId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update distribution tracking'
    });
  }
});
// --- 6e: Storage Status ---
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
// If any route throws an error that isn't caught, this middleware catches it
// and sends a proper JSON error response instead of crashing the server.
// IMPORTANT: This must be the LAST app.use() before app.listen().

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});


// =============================================================================
// SECTION 8: START THE SERVER
// =============================================================================
// This must be the very last thing in the file.
// It tells Express to start listening for incoming requests.

app.listen(PORT, () => {
  console.log(`✅ File-handler server running on port ${PORT}`);
});