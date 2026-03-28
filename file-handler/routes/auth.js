const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // built-in Node.js — no install needed
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

// ── In-memory rate limiter ────────────────────────────────────────────────────
// No external package needed. Tracks request counts per IP within a time window.
// Resets on server restart — fine for this app's scale.
//
// Usage: apply as middleware before a route handler, e.g.
//   router.post('/login', loginLimiter, async (req, res) => { ... })
//
function createRateLimiter({ windowMs, max, message }) {
  const store = new Map()

  // Purge stale entries once per window so the Map doesn't grow forever
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now - entry.start > windowMs) store.delete(key)
    }
  }, windowMs)

  return function rateLimiter(req, res, next) {
    const ip  = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
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

// 10 login attempts per 15 minutes per IP
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
})

// 5 registrations per hour per IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this IP. Please try again later.',
})

// 5 password reset requests per hour per IP — prevents email spam
const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again in an hour.',
})

// ── Resend helper ─────────────────────────────────────────────────────────────
// Calls the Resend HTTP API directly using built-in fetch (Node 18+).
// No npm package needed.

// Sends a notification to the admin whenever a new user registers.
// Fire-and-forget: errors are logged but never surface to the registering user.
async function sendAdminRegistrationNotification(newUser) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Music Agent <onboarding@resend.dev>',
        to: ['mathias.berthelemot@gmail.com'],
        subject: `🎵 New user registered: ${newUser.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1f2937;border-radius:12px;color:#e5e7eb;">
            <h2 style="color:#fff;margin-top:0;">New user registered 🎉</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#9ca3af;width:80px;">Name</td>
                <td style="padding:8px 0;color:#fff;font-weight:600;">${newUser.name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#9ca3af;">Email</td>
                <td style="padding:8px 0;color:#fff;">${newUser.email}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#9ca3af;">Signed up</td>
                <td style="padding:8px 0;color:#fff;">${new Date(newUser.created_at).toUTCString()}</td>
              </tr>
            </table>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Admin notification email failed (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error('Admin notification email error:', err);
  }
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Music Agent <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Reset your Music Agent password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1f2937;border-radius:12px;color:#e5e7eb;">
          <h2 style="color:#fff;margin-top:0;">Reset your password</h2>
          <p>We received a request to reset your Music Agent password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset password
          </a>
          <p style="color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
          <p style="color:#6b7280;font-size:12px;margin-bottom:0;">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name, isAdmin: user.is_admin || false },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// POST /auth/register
// Body: { email, password, name }
router.post('/register', registerLimiter, async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, email, name, created_at`,
      [email, password_hash, name]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    // Notify admin of new registration — fire-and-forget, never blocks the response
    sendAdminRegistrationNotification(user);

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
// Body: { email, password }
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin || false } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
// Requires Authorization: Bearer <token>
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /auth/me
// Update display name, email, or password.
// Body: { name?, email?, currentPassword?, newPassword? }
// Requires Authorization: Bearer <token>
router.patch('/me', authMiddleware, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Fetch the current user record from DB
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updatedName  = user.name;
    let updatedEmail = user.email;

    // ── Handle name update ──────────────────────────────────────────────────
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ error: 'Name cannot be empty' });
      updatedName = trimmed;
    }

    // ── Handle email update ─────────────────────────────────────────────────
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ error: 'Email cannot be empty' });

      // Make sure nobody else owns that email
      const conflict = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [trimmed, userId]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      updatedEmail = trimmed;
    }

    // ── Handle password update ──────────────────────────────────────────────
    if (currentPassword !== undefined || newPassword !== undefined) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both currentPassword and newPassword are required to change password' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    }

    // ── Save name / email changes ───────────────────────────────────────────
    await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3',
      [updatedName, updatedEmail, userId]
    );

    // Issue a fresh token so the new name/email are reflected immediately.
    // Carry is_admin forward from the DB record so admins don't lose their flag.
    const freshUser = { id: userId, email: updatedEmail, name: updatedName, is_admin: user.is_admin || false };
    const token = generateToken(freshUser);

    res.json({ token, user: freshUser });
  } catch (err) {
    console.error('PATCH /auth/me error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /auth/forgot-password
// Body: { email }
// Generates a secure reset token, stores it in the DB, and emails a link.
// ALWAYS returns 200 regardless of whether the email exists — this prevents
// attackers from discovering which email addresses are registered.
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];

    // Always respond the same way — don't reveal if the email is registered
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate a cryptographically secure random 64-char hex token
    const token = crypto.randomBytes(32).toString('hex');

    // Expire any previous unused tokens for this user (optional tidiness)
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // Store the new token — expires in 1 hour
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, token]
    );

    // Build the reset URL the user will click in their email
    const frontendUrl = process.env.FRONTEND_URL || 'https://music-agent-mvp.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(email.trim().toLowerCase(), resetUrl);

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});


// POST /auth/reset-password
// Body: { token, newPassword }
// Validates the reset token and updates the user's password.
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Look up the token
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    const row = result.rows[0];

    // Token doesn't exist
    if (!row) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    // Token already used
    if (row.used_at) {
      return res.status(400).json({ error: 'This reset link has already been used' });
    }

    // Token expired
    if (new Date() > new Date(row.expires_at)) {
      return res.status(400).json({ error: 'This reset link has expired — please request a new one' });
    }

    // All good — update the password
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, row.user_id]);

    // Mark token as used so it can't be reused
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [row.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('POST /auth/reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});


// GET /auth/me/notifications
// Returns the current email_notifications_enabled value for the authenticated user.
router.get('/me/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT email_notifications_enabled FROM users WHERE id = $1',
      [req.user.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ emailNotificationsEnabled: result.rows[0].email_notifications_enabled })
  } catch (err) {
    console.error('GET /auth/me/notifications error:', err)
    res.status(500).json({ error: 'Failed to fetch notification preference' })
  }
})

// PATCH /auth/me/notifications
// Body: { emailNotificationsEnabled: boolean }
// Lets a user opt in or out of follow-up reminder emails from within the app.
router.patch('/me/notifications', authMiddleware, async (req, res) => {
  const { emailNotificationsEnabled } = req.body
  if (typeof emailNotificationsEnabled !== 'boolean') {
    return res.status(400).json({ error: 'emailNotificationsEnabled must be a boolean' })
  }
  try {
    await pool.query(
      'UPDATE users SET email_notifications_enabled = $1 WHERE id = $2',
      [emailNotificationsEnabled, req.user.id]
    )
    res.json({ success: true, emailNotificationsEnabled })
  } catch (err) {
    console.error('PATCH /auth/me/notifications error:', err)
    res.status(500).json({ error: 'Failed to update notification preference' })
  }
})

// DELETE /auth/me
// Permanently deletes the authenticated user and all their data.
// All related records are removed via ON DELETE CASCADE in the DB schema.
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ success: true, message: 'Account and all associated data have been deleted.' })
  } catch (err) {
    console.error('DELETE /auth/me error:', err)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

module.exports = router;
