/**
 * test-pages-and-seo.js
 *
 * Tests for Steps 13.2 (ToS + Privacy pages) and 13.3 (SEO metadata).
 * These are static file checks — no server needed.
 *
 * Run with: node test-pages-and-seo.js
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

let passed = 0
let failed = 0

function ok(msg)   { console.log(`  ${GREEN}✓${RESET} ${msg}`); passed++ }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`);   failed++ }

function read(relPath) {
  const abs = path.join(__dirname, relPath)
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null
}

// ── Step 13.2 — ToS & Privacy pages ──────────────────────────────────────────

console.log(`\n${BOLD}Step 13.2 — Terms of Service & Privacy Policy Tests${RESET}\n`)

console.log(`${BOLD}Test 1:${RESET} Page files exist at correct paths`)
{
  const terms   = read('frontend/src/app/terms/page.js')
  const privacy = read('frontend/src/app/privacy/page.js')

  terms   ? ok('frontend/src/app/terms/page.js exists')   : fail('terms/page.js is missing')
  privacy ? ok('frontend/src/app/privacy/page.js exists') : fail('privacy/page.js is missing')
}

console.log()
console.log(`${BOLD}Test 2:${RESET} ToS page has required content`)
{
  const terms = read('frontend/src/app/terms/page.js')
  if (!terms) {
    fail('Cannot check — file missing')
  } else {
    terms.includes('Terms of Service')         ? ok('Has "Terms of Service" heading')           : fail('Missing "Terms of Service" heading')
    terms.includes('Your content')             ? ok('Has "Your content" section')               : fail('Missing "Your content" section')
    terms.includes('Acceptable use')           ? ok('Has "Acceptable use" section')             : fail('Missing "Acceptable use" section')
    terms.includes("href=\"/privacy\"")        ? ok('Links to Privacy Policy')                  : fail('Missing link to Privacy Policy')
    terms.includes('title:')                   ? ok('Has page-level metadata title')            : fail('Missing metadata title')
  }
}

console.log()
console.log(`${BOLD}Test 3:${RESET} Privacy Policy page has required content`)
{
  const privacy = read('frontend/src/app/privacy/page.js')
  if (!privacy) {
    fail('Cannot check — file missing')
  } else {
    privacy.includes('Privacy Policy')         ? ok('Has "Privacy Policy" heading')             : fail('Missing "Privacy Policy" heading')
    privacy.includes('Cloudflare R2')          ? ok('Mentions Cloudflare R2 storage')           : fail('Missing Cloudflare R2 mention')
    privacy.includes('Railway')                ? ok('Mentions Railway database')                : fail('Missing Railway mention')
    privacy.includes('Resend')                 ? ok('Mentions Resend for email')                : fail('Missing Resend mention')
    privacy.includes("href=\"/terms\"")        ? ok('Links to Terms of Service')                : fail('Missing link to Terms of Service')
    privacy.includes('30 days')                ? ok('Mentions 30-day session cookie')           : fail('Missing 30-day cookie mention')
  }
}

console.log()
console.log(`${BOLD}Test 4:${RESET} ToS and Privacy links appear in login page`)
{
  const login = read('frontend/src/app/login/page.js')
  if (!login) {
    fail('Cannot check — login/page.js missing')
  } else {
    login.includes('href="/terms"')   ? ok('Login page links to /terms')   : fail('Login page missing /terms link')
    login.includes('href="/privacy"') ? ok('Login page links to /privacy') : fail('Login page missing /privacy link')
  }
}

console.log()
console.log(`${BOLD}Test 5:${RESET} ToS and Privacy links appear in register page`)
{
  const register = read('frontend/src/app/register/page.js')
  if (!register) {
    fail('Cannot check — register/page.js missing')
  } else {
    register.includes('href="/terms"')         ? ok('Register page links to /terms')            : fail('Register page missing /terms link')
    register.includes('href="/privacy"')       ? ok('Register page links to /privacy')          : fail('Register page missing /privacy link')
    register.includes('agree to our')          ? ok('Register page has consent language')       : fail('Register page missing consent language')
  }
}

console.log()
console.log(`${BOLD}Test 6:${RESET} terms and privacy are in middleware public routes`)
{
  const middleware = read('frontend/src/middleware.js')
  if (!middleware) {
    fail('Cannot check — middleware.js missing')
  } else {
    middleware.includes('terms')   ? ok('terms is in middleware public routes')   : fail('terms missing from middleware public routes')
    middleware.includes('privacy') ? ok('privacy is in middleware public routes') : fail('privacy missing from middleware public routes')
  }
}

// ── Step 13.3 — SEO metadata ──────────────────────────────────────────────────

console.log()
console.log(`\n${BOLD}Step 13.3 — SEO Metadata Tests${RESET}\n`)

console.log(`${BOLD}Test 7:${RESET} layout.js has full metadata object`)
{
  const layout = read('frontend/src/app/layout.js')
  if (!layout) {
    fail('Cannot check — layout.js missing')
  } else {
    layout.includes('metadataBase')                    ? ok('Has metadataBase (required for absolute OG URLs)') : fail('Missing metadataBase')
    layout.includes('openGraph')                       ? ok('Has openGraph block')                              : fail('Missing openGraph block')
    layout.includes('twitter')                         ? ok('Has twitter card block')                           : fail('Missing twitter block')
    layout.includes('musicagentchigui.com')            ? ok('metadataBase points to live domain')               : fail('metadataBase missing live domain')
    layout.includes("url: 'https://musicagentchigui") ? ok('og:url set correctly')                             : fail('og:url missing or wrong')
    layout.includes("images:")                         ? ok('og:image defined')                                 : fail('og:image missing')
    layout.includes("icons:")                          ? ok('favicon/icon defined')                             : fail('favicon/icon missing')
    layout.includes('summary')                         ? ok('Twitter card type set')                            : fail('Twitter card type missing')
  }
}

console.log()
console.log(`${BOLD}Test 8:${RESET} Description is meaningful (not a placeholder)`)
{
  const layout = read('frontend/src/app/layout.js')
  if (!layout) {
    fail('Cannot check — layout.js missing')
  } else {
    const match = layout.match(/description:\s*['"](.+?)['"]/)
    if (!match) {
      fail('No description found in metadata')
    } else {
      const desc = match[1]
      desc.length >= 50 ? ok(`Description is ${desc.length} chars — good length`)    : fail(`Description too short: "${desc}"`)
      !desc.includes('TODO') ? ok('Description has no placeholder TODO text')        : fail('Description contains TODO placeholder')
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log()
console.log('─'.repeat(45))
if (failed === 0) {
  console.log(`${GREEN}${BOLD}All ${passed} tests passed ✓${RESET}`)
} else {
  console.log(`${RED}${BOLD}${failed} test(s) failed, ${passed} passed${RESET}`)
  process.exit(1)
}
console.log()
