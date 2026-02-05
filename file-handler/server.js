const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
  // First try mimetype
  if (file.mimetype?.startsWith('audio/')) return 'audio';
  if (file.mimetype?.startsWith('image/')) return 'artwork';
  if (file.mimetype?.startsWith('video/')) return 'video';
  
  // Fallback: check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.wav', '.mp3', '.flac', '.aiff', '.m4a', '.ogg'].includes(ext)) return 'audio';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'artwork';
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  
  return 'other';
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const releaseId = requireReleaseId(req);
      const subfolder = classify(file);
      const fullPath = path.join(RELEASES_BASE, releaseId, subfolder);
      fs.mkdirSync(fullPath, { recursive: true });
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

app.post('/upload', upload.any(), (req, res) => {
  const releaseId = req.query.releaseId;
  const artist = req.query.artist;
  const title = req.query.title;
  const genre = req.query.genre;
  
  console.log(`📥 Upload received: ${req.files?.length || 0} files for ${releaseId}`);
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
  });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
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
    if (!fs.existsSync(releasePath)) {
      fs.mkdirSync(releasePath, { recursive: true });
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
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
app.listen(PORT, () => {
  console.log(`✅ File-handler server running on port ${PORT}`);
});