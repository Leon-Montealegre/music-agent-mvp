const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const checkDiskSpace = require('check-disk-space').default;
const musicMetadata = require('music-metadata');


const app = express();
const PORT = 3001;


app.use(cors());
app.use(express.json());


const RELEASES_BASE = '/Users/Mathias2/Documents/Music Agent/Releases';


function requireReleaseId(req) {
  const releaseId = (req.query.releaseId || '').trim();
  if (!releaseId) {
    const err = new Error('Missing releaseId. Use /upload?releaseId=YOUR_RELEASE_ID');
    err.statusCode = 400;
    throw err;
  }
  return releaseId;
}


function classify(file) {
  if (file.mimetype?.startsWith('audio/')) return 'audio';
  if (file.mimetype?.startsWith('image/')) return 'artwork';
  if (file.mimetype?.startsWith('video/')) return 'video';
  
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
        error: `Invalid audio duration: ${metadata.format.duration}s (expected 1s - 1 hour)`
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


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const releaseId = requireReleaseId(req);
      const subfolder = classify(file);
      const fullPath = path.join(RELEASES_BASE, releaseId, subfolder);
      fsSync.mkdirSync(fullPath, { recursive: true });
      cb(null, fullPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});


const upload = multer({ storage });


app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'File handler is running' });
});


app.post('/upload', (req, res, next) => {
  const releaseId = req.query.releaseId;
  
  if (!releaseId) {
    return res.status(400).json({
      success: false,
      error: 'Missing releaseId parameter'
    });
  }
  
  const releasePath = path.join(RELEASES_BASE, releaseId);
  
  if (fsSync.existsSync(releasePath)) {
    console.log(`🚫 Duplicate upload attempt blocked: ${releaseId} already exists`);
    return res.status(409).json({
      success: false,
      error: 'Duplicate release detected',
      message: `Release "${releaseId}" already exists. Use a different release name or delete the existing release first.`,
      existingPath: releasePath
    });
  }
  
  next();
}, upload.any(), async (req, res) => {
  const releaseId = req.query.releaseId;
  const artist = req.query.artist;
  const title = req.query.title;
  const genre = req.query.genre;
  
  console.log(`📥 Upload received: ${req.files?.length || 0} files for ${releaseId}`);
  
  const audioFiles = req.files?.filter(f => classify(f) === 'audio') || [];
  const validationResults = [];
  
  for (const audioFile of audioFiles) {
    console.log(`🎵 Validating audio: ${audioFile.originalname}...`);
    const validation = await validateAudioFile(audioFile.path);
    
    if (!validation.valid) {
      console.error(`❌ Audio validation failed: ${audioFile.originalname}`);
      console.error(`   Error: ${validation.error}`);
      
      fsSync.unlinkSync(audioFile.path);
      
      return res.status(422).json({
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
  
  req.files?.forEach(f => {
    console.log(`   → ${f.originalname} saved to ${path.basename(path.dirname(f.path))}/ folder`);
  });

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
    if (!fsSync.existsSync(releasePath)) {
      fsSync.mkdirSync(releasePath, { recursive: true });
    }
    
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


app.get('/releases', async (req, res) => {
  try {
    const releasesFolders = await fs.readdir(RELEASES_BASE, { withFileTypes: true });
    const releaseDirs = releasesFolders.filter(item => item.isDirectory());
    const releases = [];
    
    for (const dir of releaseDirs) {
      const releaseId = dir.name;
      const metadataPath = path.join(RELEASES_BASE, releaseId, 'metadata.json');
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        releases.push(metadata);
      } catch (error) {
        console.warn(`⚠️  Warning: Could not read metadata for ${releaseId}:`, error.message);
      }
    }
    
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


app.get('/storage/status', async (req, res) => {
  try {
    const diskSpace = await checkDiskSpace(RELEASES_BASE);
    
    const totalGB = (diskSpace.size / (1024 ** 3)).toFixed(2);
    const freeGB = (diskSpace.free / (1024 ** 3)).toFixed(2);
    const usedGB = (totalGB - freeGB).toFixed(2);
    const usedPercent = ((usedGB / totalGB) * 100).toFixed(1);
    
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


app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});


app.listen(PORT, () => {
  console.log(`✅ File-handler server running on port ${PORT}`);
});
