const { uploadToSoundCloud } = require('./soundcloud-upload');
const path = require('path');

// Test with your real release
const testMetadata = {
  audioPath: path.join(process.env.HOME, 'Documents/Music Agent/Releases/2026-02-08_SophieJoe_TellMe/versions/primary/audio/Sophie Joe - Tell Me (Vocal Mix).wav'),
  artworkPath: path.join(process.env.HOME, 'Documents/Music Agent/Releases/2026-02-08_SophieJoe_TellMe/artwork/Tell Me - Sophie Joe.png'),
  title: 'Tell Me',
  artist: 'Sophie Joe',
  genre: 'Melodic House & Techno',
  tags: 'melodic, house, techno, sophiejoe, tell, electronic music, new music',
  description: 'New release from Sophie Joe - Melodic House & Techno vibes',
  privacy: 'private',  // Use private for testing!
  releaseDate: '02/15/2026'
};

console.log('🧪 Testing SoundCloud automation...\n');
uploadToSoundCloud(testMetadata);