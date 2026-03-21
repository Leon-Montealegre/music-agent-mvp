/**
 * test-upload-limit.js
 *
 * Tests that the multer file size limit and error handler work correctly.
 *
 * Strategy: spin up a small Express server with the SAME multer config as
 * server.js but with a tiny 1KB limit — so we don't need to create a 1GB
 * file. The logic is identical; only the number differs.
 *
 * Run with:  node test-upload-limit.js
 */

'use strict'

const express = require('express')
const multer  = require('multer')
const http    = require('http')
const path    = require('path')

// ─── Colours for terminal output ─────────────────────────────────────────────
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

let passed = 0
let failed = 0

function ok(msg)   { console.log(`  ${GREEN}✓${RESET} ${msg}`);  passed++ }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`);    failed++ }
function info(msg) { console.log(`  ${YELLOW}→${RESET} ${msg}`) }

// ─── Build a minimal Express app that mirrors our server.js config ────────────

const TEST_LIMIT_BYTES = 1024 // 1 KB — tiny so we don't need a huge file

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TEST_LIMIT_BYTES }
})

const app = express()

// One upload route — same pattern as server.js routes
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file received' })
  }
  res.json({
    success: true,
    filename: req.file.originalname,
    size: req.file.size
  })
})

// ─── Error handler — EXACT COPY from server.js ───────────────────────────────
// This is the code we actually want to test.
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum upload size is 1GB.' })
  }
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer(app)
    server.listen(0, '127.0.0.1', () => {
      resolve(server)
    })
  })
}

/**
 * Send a multipart/form-data POST request with a file buffer.
 * Returns { status, body } — no external packages needed.
 */
function sendFile(port, fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now()
    const CRLF = '\r\n'

    // Build the multipart body manually
    const header = Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: application/octet-stream${CRLF}${CRLF}`
    )
    const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`)
    const body   = Buffer.concat([header, fileBuffer, footer])

    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }

    const req = http.request(options, res => {
      let raw = ''
      res.on('data', chunk => raw += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) })
        } catch {
          resolve({ status: res.statusCode, body: raw })
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\n${BOLD}Step 10 — File Upload Size Limit Tests${RESET}`)
  console.log(`  Limit under test: ${TEST_LIMIT_BYTES} bytes (1 KB)\n`)

  const server = await startServer()
  const port   = server.address().port
  info(`Test server started on port ${port}`)
  console.log()

  // ── Test 1: File under the limit should succeed ──────────────────────────
  console.log(`${BOLD}Test 1:${RESET} Small file (under limit) — should return 200`)
  try {
    const smallFile = Buffer.alloc(512, 'a') // 512 bytes — well under 1 KB
    const result    = await sendFile(port, smallFile, 'small.txt')

    if (result.status === 200 && result.body.success === true) {
      ok(`Status: ${result.status} — upload accepted`)
      ok(`Filename echoed back: "${result.body.filename}"`)
      ok(`Size echoed back: ${result.body.size} bytes`)
    } else {
      fail(`Expected 200/success but got: status=${result.status}, body=${JSON.stringify(result.body)}`)
    }
  } catch (err) {
    fail(`Request threw an error: ${err.message}`)
  }

  console.log()

  // ── Test 2: File over the limit should return 413 ────────────────────────
  console.log(`${BOLD}Test 2:${RESET} Large file (over limit) — should return 413`)
  try {
    const bigFile = Buffer.alloc(TEST_LIMIT_BYTES + 100, 'x') // 1124 bytes — over 1 KB
    const result  = await sendFile(port, bigFile, 'toobig.wav')

    if (result.status === 413) {
      ok(`Status: ${result.status} — correctly rejected`)
    } else {
      fail(`Expected 413 but got status: ${result.status}`)
    }

    if (result.body?.success === false) {
      ok(`Response has success: false`)
    } else {
      fail(`Expected success: false but got: ${JSON.stringify(result.body)}`)
    }

    const expectedMsg = 'File too large. Maximum upload size is 1GB.'
    if (result.body?.message === expectedMsg) {
      ok(`Error message is correct: "${result.body.message}"`)
    } else {
      fail(`Wrong error message. Got: "${result.body?.message}"`)
    }
  } catch (err) {
    fail(`Request threw an error: ${err.message}`)
  }

  console.log()

  // ── Test 3: No file sent at all — should return 400 ─────────────────────
  console.log(`${BOLD}Test 3:${RESET} No file in request — should return 400`)
  try {
    // Send a POST with no body at all
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port,
        path: '/upload',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': 0 }
      }
      const req = http.request(options, res => {
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
          catch { resolve({ status: res.statusCode, body: raw }) }
        })
      })
      req.on('error', reject)
      req.end()
    })

    if (result.status === 400) {
      ok(`Status: ${result.status} — correctly rejected with 400`)
    } else {
      fail(`Expected 400 but got status: ${result.status}`)
    }
  } catch (err) {
    fail(`Request threw an error: ${err.message}`)
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  server.close()
  console.log()
  console.log('─'.repeat(45))
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}All ${passed} tests passed ✓${RESET}`)
  } else {
    console.log(`${RED}${BOLD}${failed} test(s) failed, ${passed} passed${RESET}`)
    process.exit(1)
  }
  console.log()
}

runTests().catch(err => {
  console.error(`${RED}Unexpected error: ${err.message}${RESET}`)
  process.exit(1)
})
