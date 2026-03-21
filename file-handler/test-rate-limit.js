/**
 * test-rate-limit.js
 *
 * Tests the in-memory rate limiter from auth.js.
 * Uses the exact same createRateLimiter function — no mocking.
 *
 * Strategy: set a tiny limit (3 requests) so we can hit it quickly,
 * then confirm the 4th request is blocked with a 429.
 * Also verifies the window resets after it expires.
 *
 * Run with: node test-rate-limit.js
 */

'use strict'

const express = require('express')
const http    = require('http')

const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const BOLD  = '\x1b[1m'

let passed = 0
let failed = 0

function ok(msg)   { console.log(`  ${GREEN}✓${RESET} ${msg}`); passed++ }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`);   failed++ }
function info(msg) { console.log(`  ${YELLOW}→${RESET} ${msg}`) }

// ── Exact copy of createRateLimiter from auth.js ──────────────────────────────
function createRateLimiter({ windowMs, max, message }) {
  const store = new Map()

  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now - entry.start > windowMs) store.delete(key)
    }
  }, windowMs)

  return function rateLimiter(req, res, next) {
    const ip    = req.ip || req.socket?.remoteAddress || 'unknown'
    const now   = Date.now()
    const entry = store.get(ip)

    if (!entry || now - entry.start > windowMs) {
      store.set(ip, { start: now, count: 1 })
      return next()
    }

    if (entry.count >= max) {
      return res.status(429).json({ error: message })
    }

    entry.count++
    return next()
  }
}

// ── Build a tiny test app ─────────────────────────────────────────────────────

function buildApp({ windowMs, max, message }) {
  const app     = express()
  const limiter = createRateLimiter({ windowMs, max, message })

  app.post('/login', limiter, (req, res) => {
    res.json({ success: true })
  })

  return app
}

function startServer(app) {
  return new Promise(resolve => {
    const server = http.createServer(app)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function post(port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1', port,
      path: '/login', method: 'POST',
      headers: { 'Content-Length': 0 },
    }
    const req = http.request(options, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\n${BOLD}Step 13.1 — Rate Limiter Tests${RESET}\n`)

  // ── Test 1: Requests under the limit pass through ──────────────────────────
  console.log(`${BOLD}Test 1:${RESET} Requests under the limit should return 200`)
  {
    const server = await startServer(buildApp({ windowMs: 5000, max: 3, message: 'Too many requests.' }))
    const port   = server.address().port
    try {
      for (let i = 1; i <= 3; i++) {
        const r = await post(port)
        if (r.status === 200) {
          ok(`Request ${i}/3: status 200 — allowed`)
        } else {
          fail(`Request ${i}/3: expected 200 but got ${r.status}`)
        }
      }
    } finally { server.close() }
  }

  console.log()

  // ── Test 2: Request over the limit gets 429 ────────────────────────────────
  console.log(`${BOLD}Test 2:${RESET} Request over the limit should return 429`)
  {
    const MESSAGE = 'Too many login attempts. Please try again in 15 minutes.'
    const server  = await startServer(buildApp({ windowMs: 5000, max: 3, message: MESSAGE }))
    const port    = server.address().port
    try {
      // Use up the 3 allowed requests
      await post(port); await post(port); await post(port)
      // 4th request should be blocked
      const r = await post(port)
      if (r.status === 429) {
        ok(`Status: 429 — correctly blocked`)
      } else {
        fail(`Expected 429 but got ${r.status}`)
      }
      if (r.body?.error === MESSAGE) {
        ok(`Error message correct: "${r.body.error}"`)
      } else {
        fail(`Wrong message. Got: "${r.body?.error}"`)
      }
    } finally { server.close() }
  }

  console.log()

  // ── Test 3: Window reset allows requests again ─────────────────────────────
  console.log(`${BOLD}Test 3:${RESET} After window expires, requests should be allowed again`)
  {
    const server = await startServer(buildApp({ windowMs: 300, max: 2, message: 'Blocked.' }))
    const port   = server.address().port
    try {
      // Use up limit
      await post(port); await post(port)
      const blocked = await post(port)
      if (blocked.status === 429) {
        ok(`Confirmed blocked before window reset (429)`)
      } else {
        fail(`Expected 429 before reset, got ${blocked.status}`)
      }

      // Wait for window to expire
      info(`Waiting 350ms for window to expire...`)
      await sleep(350)

      // Should be allowed again
      const allowed = await post(port)
      if (allowed.status === 200) {
        ok(`Status: 200 — allowed again after window reset`)
      } else {
        fail(`Expected 200 after reset but got ${allowed.status}`)
      }
    } finally { server.close() }
  }

  console.log()

  // ── Test 4: Different IPs tracked independently ────────────────────────────
  // Express assigns req.ip based on the socket — in loopback tests it's always
  // the same IP, so we test independent tracking by using two separate server
  // instances each with their own store.
  console.log(`${BOLD}Test 4:${RESET} Rate limit store is per-server instance (independent stores)`)
  {
    const app1   = buildApp({ windowMs: 5000, max: 1, message: 'Blocked.' })
    const app2   = buildApp({ windowMs: 5000, max: 1, message: 'Blocked.' })
    const s1     = await startServer(app1)
    const s2     = await startServer(app2)
    try {
      // Use up limit on server 1
      await post(s1.address().port)
      const r1 = await post(s1.address().port)

      // Server 2 has its own fresh store — should still allow
      const r2 = await post(s2.address().port)

      if (r1.status === 429) {
        ok(`Server 1: blocked after limit (429) ✓`)
      } else {
        fail(`Server 1: expected 429 but got ${r1.status}`)
      }
      if (r2.status === 200) {
        ok(`Server 2: independent store, request allowed (200) ✓`)
      } else {
        fail(`Server 2: expected 200 but got ${r2.status}`)
      }
    } finally { s1.close(); s2.close() }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
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
