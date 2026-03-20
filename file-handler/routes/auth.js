const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

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
router.post('/register', async (req, res) => {
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

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
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

module.exports = router;
