const { chromium } = require('playwright');

async function testSoundCloudAccess() {
  console.log('🌐 Starting browser...');
  
  // Launch browser (headless: false means we can see it)
  const browser = await chromium.launch({ 
    headless: false  // Show the browser window
  });
  
  console.log('✅ Browser opened');
  
  // Create a new page (like opening a new tab)
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📄 New page created');
  
  try {
    // Navigate to SoundCloud upload page
    console.log('🎵 Navigating to SoundCloud...');
    await page.goto('https://soundcloud.com/upload');
    
    console.log('✅ Reached SoundCloud!');
    console.log('👀 Browser will stay open for 10 seconds so you can see it...');
    
    // Wait 10 seconds so you can see the page
    await page.waitForTimeout(10000);
    
    console.log('🎉 Test successful! Closing browser...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Always close the browser
    await browser.close();
    console.log('👋 Browser closed');
  }
}

// Run the test
testSoundCloudAccess();