const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
const path = require('path');

/**
 * Upload a track to SoundCloud (semi-automated)
 */
async function uploadToSoundCloud(metadata) {
  console.log('🎵 Starting SoundCloud automation...');
  console.log('📦 Track:', metadata.title);
  console.log('🎤 Artist:', metadata.artist);
  
  const userDataDir = path.join(process.env.HOME, '.playwright-soundcloud');
  console.log('💾 Using browser profile:', userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 100
  });

  const page = context.pages()[0] || await context.newPage();
  
  try {
    console.log('\n📍 STEP 1: Navigation');
    await navigateToUpload(page);
    
    console.log('\n📍 STEP 2: Audio Upload');
    await uploadAudioFile(page, metadata.audioPath);
    
    console.log('\n📍 STEP 3: Basic Information');
    await fillBasicInfo(page, metadata);
    
    console.log('\n📍 STEP 4: Advanced Settings');
    await fillAdvancedInfo(page, metadata);
    
    console.log('\n📍 STEP 5: Artwork Upload');
    await uploadArtwork(page, metadata.artworkPath);
    
    console.log('\n✅ FORM READY FOR REVIEW');
    console.log('👀 Please review all fields in the browser');
    console.log('🔴 When ready, click the "Upload" button yourself');
    console.log('⏰ Browser will stay open for 5 minutes...\n');
    
    await page.waitForTimeout(300000);
    
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    console.log('💡 You can still complete the upload manually in the browser');
    await page.waitForTimeout(300000);
    
  } finally {
    await context.close();
    console.log('👋 Browser closed (session saved)');
  }
}

/**
 * Navigate to SoundCloud upload page
 */
async function navigateToUpload(page) {
  console.log('🌐 Opening SoundCloud...');
  
  await page.goto('https://soundcloud.com/upload', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  console.log('✅ Page loaded');
  await handleCookiePopup(page);
  
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
    console.log('🔐 Login required!');
    console.log('👉 Please log into SoundCloud in the browser window');
    console.log('🧩 If you see CAPTCHA, please solve it');
    console.log('⏰ Waiting up to 10 minutes for you to log in...\n');
    
    try {
      await Promise.race([
        page.waitForURL('**/upload', { timeout: 600000 }),
        page.waitForSelector('input[type="file"]', { timeout: 600000 })
      ]);
      
      console.log('✅ Login successful!');
      await page.waitForTimeout(2000);
      await handleCookiePopup(page);
      
    } catch (error) {
      throw new Error('Login timeout');
    }
  }
  
  console.log('⏳ Waiting for upload form...');
  
  const possibleSelectors = [
    'input[type="file"]',
    'button:has-text("Choose files")',
    '[class*="uploadButton"]'
  ];
  
  for (const selector of possibleSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'attached' });
      console.log(`✅ Upload form ready (found: ${selector})`);
      return;
    } catch (e) {
      continue;
    }
  }
  
  console.log('✅ Upload page loaded');
}

/**
 * Handle cookie consent popup
 */
async function handleCookiePopup(page) {
  console.log('🍪 Checking for cookie popup...');
  
  try {
    await page.waitForTimeout(2000);
    
    const rejectButton = page.locator('button:has-text("Reject All"), button:has-text("Reject")').first();
    const acceptButton = page.locator('button:has-text("I Accept"), button:has-text("Accept")').first();
    
    if (await rejectButton.isVisible({ timeout: 3000 })) {
      console.log('  🚫 Clicking "Reject All"...');
      await rejectButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Cookie popup dismissed');
      return;
    }
    
    if (await acceptButton.isVisible({ timeout: 3000 })) {
      console.log('  ✅ Clicking "I Accept"...');
      await acceptButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Cookie popup dismissed');
      return;
    }
    
    console.log('  ℹ️  No cookie popup found (or already dismissed)');
    
  } catch (error) {
    console.log('  ℹ️  Cookie popup handling skipped');
  }
}

/**
 * Upload audio file (manual selection by user)
 */
async function uploadAudioFile(page, audioPath) {
  console.log('🎵 Audio Upload Step');
  console.log('📁 File:', audioPath);
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🤚 MANUAL FILE SELECTION REQUIRED                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 INSTRUCTIONS:');
  console.log('  1. Look at the browser window');
  console.log('  2. Click "Choose files" button');
  console.log('  3. Navigate to and select this file:');
  console.log(`     ${audioPath}`);
  console.log('  4. Wait for upload progress bar to complete');
  console.log('  5. Wait for form fields to appear (Track title, Artist, Genre, etc.)');
  console.log('  6. Once form is fully loaded, come back here and press ENTER\n');
  
  await new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('⏸️  Press ENTER when form is ready... ', () => {
      readline.close();
      resolve();
    });
  });
  
  console.log('\n✅ User confirmed form loaded!');
  console.log('🤖 Starting automation...\n');
  
  await page.waitForTimeout(2000);
  console.log('✅ Form ready for auto-fill');
}

/**
 * Fill in basic track information
 */
/**
 * Fill in basic track information (DEBUG VERSION)
 */
/**
 * Fill in basic track information
 */
async function fillBasicInfo(page, metadata) {
    console.log('📝 Filling basic info...');
    
    try {
      // Check if form is in an iframe
      const frames = page.frames();
      console.log(`🔍 Found ${frames.length} frames on page\n`);
      
      let formFrame = page; // Default to main page
      
      // Look for iframe containing the form
      for (const frame of frames) {
        try {
          const titleInput = frame.locator('#title');
          if (await titleInput.count() > 0) {
            console.log('✅ Found form in iframe!');
            formFrame = frame;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Wait a bit for form to be fully ready
      await page.waitForTimeout(3000);
      
      // Title
      console.log('  ✏️  Title:', metadata.title);
      try {
        const titleInput = formFrame.locator('#title');
        if (await titleInput.isVisible({ timeout: 3000 })) {
          await titleInput.click();
          await titleInput.fill(''); // Clear first
          await page.waitForTimeout(300);
          await titleInput.fill(metadata.title);
          await page.waitForTimeout(500);
          console.log('    ✅ Title filled');
        } else {
          console.log('    ⚠️  Title field not visible');
        }
      } catch (e) {
        console.log('    ⚠️  Could not fill title:', e.message);
      }
      
      // Artist
      console.log('  🎤 Artist:', metadata.artist);
      try {
        // Try different possible IDs/names for artist field
        const artistSelectors = ['#artist', 'input[name="artist"]', '[aria-label*="Artist"]'];
        
        for (const selector of artistSelectors) {
          try {
            const artistInput = formFrame.locator(selector).first();
            if (await artistInput.isVisible({ timeout: 2000 })) {
              await artistInput.click();
              await artistInput.fill('');
              await page.waitForTimeout(300);
              await artistInput.fill(metadata.artist);
              await page.waitForTimeout(500);
              console.log('    ✅ Artist filled');
              break;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log('    ⚠️  Could not fill artist');
      }
      
      // Genre
      console.log('  🎼 Genre:', metadata.genre);
      try {
        const genreSelectors = ['#genre', 'input[name="genre"]', '[aria-label*="Genre"]'];
        
        for (const selector of genreSelectors) {
          try {
            const genreInput = formFrame.locator(selector).first();
            if (await genreInput.isVisible({ timeout: 2000 })) {
              await genreInput.click();
              await page.waitForTimeout(500);
              await genreInput.fill(metadata.genre);
              await page.waitForTimeout(1000);
              
              // Try to select from dropdown
              try {
                const option = formFrame.locator(`text="${metadata.genre}"`).first();
                if (await option.isVisible({ timeout: 2000 })) {
                  await option.click();
                  console.log('    ✅ Genre selected');
                }
              } catch (e) {
                console.log('    ✅ Genre typed');
              }
              break;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log('    ⚠️  Could not select genre');
      }
      
      // Tags
      console.log('  🏷️  Tags:', metadata.tags.substring(0, 50) + '...');
      try {
        const tagsSelectors = ['#tags', 'input[name="tags"]', '[aria-label*="Tag"]'];
        
        for (const selector of tagsSelectors) {
          try {
            const tagsInput = formFrame.locator(selector).first();
            if (await tagsInput.isVisible({ timeout: 2000 })) {
              await tagsInput.click();
              await tagsInput.fill(metadata.tags);
              await page.waitForTimeout(500);
              console.log('    ✅ Tags filled');
              break;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log('    ⚠️  Could not fill tags');
      }
      
      // Description
      console.log('  📄 Description');
      try {
        const descSelectors = ['#description', 'textarea[name="description"]', '[aria-label*="Description"]'];
        
        for (const selector of descSelectors) {
          try {
            const descInput = formFrame.locator(selector).first();
            if (await descInput.isVisible({ timeout: 2000 })) {
              await descInput.click();
              await descInput.fill(metadata.description);
              await page.waitForTimeout(500);
              console.log('    ✅ Description filled');
              break;
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log('    ⚠️  Could not fill description');
      }
      
      console.log('✅ Basic info filled');
      
    } catch (error) {
      console.error('⚠️  Error filling basic info:', error.message);
    }
  }
/**
 * Select genre from dropdown
 */
async function selectGenre(page, genre) {
  try {
    const genreSelectors = [
      'input[placeholder*="genre" i]',
      'input[aria-label*="genre" i]',
      'input[name="genre"]'
    ];
    
    for (const selector of genreSelectors) {
      try {
        const genreInput = page.locator(selector).first();
        if (await genreInput.isVisible({ timeout: 2000 })) {
          await genreInput.click();
          await page.waitForTimeout(500);
          await genreInput.fill(genre);
          await page.waitForTimeout(1000);
          
          try {
            const genreOption = page.locator(`text="${genre}"`).first();
            if (await genreOption.isVisible({ timeout: 2000 })) {
              await genreOption.click();
              await page.waitForTimeout(500);
              console.log('    ✅ Genre selected');
              return;
            }
          } catch (e) {
            console.log('    ⚠️  Genre typed but not selected');
          }
          return;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.log('    ⚠️  Could not select genre');
  }
}

/**
 * Fill advanced settings
 */
async function fillAdvancedInfo(page, metadata) {
  console.log('🔧 Filling advanced info...');
  
  try {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    
    // Privacy
    console.log('  🔒 Privacy:', metadata.privacy);
    try {
      if (metadata.privacy === 'private') {
        const privateRadio = page.locator('label:has-text("Private"), input[value="private"]').first();
        if (await privateRadio.isVisible({ timeout: 3000 })) {
          await privateRadio.click();
          await page.waitForTimeout(500);
          console.log('    ✅ Privacy set to Private');
        }
      } else {
        const publicRadio = page.locator('label:has-text("Public"), input[value="public"]').first();
        if (await publicRadio.isVisible({ timeout: 3000 })) {
          await publicRadio.click();
          await page.waitForTimeout(500);
          console.log('    ✅ Privacy set to Public');
        }
      }
    } catch (e) {
      console.log('    ⚠️  Could not set privacy');
    }
    
    console.log('✅ Advanced info filled');
    
  } catch (error) {
    console.error('⚠️  Error filling advanced info');
  }
}

/**
 * Upload artwork
 */
async function uploadArtwork(page, artworkPath) {
  console.log('🖼️  Uploading artwork...');
  console.log('📁 File:', artworkPath);
  
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    const artworkButton = page.locator('text="Add new artwork"').first();
    
    if (await artworkButton.isVisible({ timeout: 5000 })) {
      console.log('  📎 Found artwork button');
      
      const artworkChooserPromise = page.waitForEvent('filechooser', { timeout: 3000 });
      await artworkButton.click();
      
      try {
        const artworkChooser = await artworkChooserPromise;
        await artworkChooser.setFiles(artworkPath);
        console.log('  ✅ Artwork uploaded automatically!');
        await page.waitForTimeout(2000);
        return;
      } catch (e) {
        // File chooser blocked
      }
    }
    
    console.log('  🤚 MANUAL: Click "Add new artwork" and select:');
    console.log(`     ${artworkPath}`);
    console.log('  ⏳ Waiting 30 seconds for manual upload...\n');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.log('  ⚠️  Artwork section not found');
    console.log('  💡 You can upload artwork manually before final upload\n');
  }
}

module.exports = { uploadToSoundCloud };