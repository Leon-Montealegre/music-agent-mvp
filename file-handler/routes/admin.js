const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const authMiddleware = require('../authMiddleware');

// ─── Admin-only middleware ────────────────────────────────────────────────────
// Runs AFTER authMiddleware so req.user is already populated.
// Rejects anyone whose token doesn't carry isAdmin: true.
function adminMiddleware(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// All routes in this file require: valid JWT + admin flag
router.use(authMiddleware, adminMiddleware);

// ─── GET /admin/users ─────────────────────────────────────────────────────────
// Returns all users: id, name, email, created_at, is_admin, storage_bytes, file_count
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.created_at, u.is_admin,
         COALESCE(SUM(f.size_bytes), 0)::BIGINT AS storage_bytes,
         COUNT(DISTINCT f.id)::INTEGER           AS file_count,
         COUNT(DISTINCT r.id)::INTEGER           AS release_count,
         COUNT(DISTINCT c.id)::INTEGER           AS collection_count
       FROM users u
       LEFT JOIN files       f ON f.user_id = u.id
       LEFT JOIN releases    r ON r.user_id = u.id
       LEFT JOIN collections c ON c.user_id = u.id
       GROUP BY u.id, u.name, u.email, u.created_at, u.is_admin
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── DELETE /admin/users/:userId ──────────────────────────────────────────────
// Permanently deletes a user and all their data.
// Because all child tables (releases, collections, contacts, files, settings)
// have ON DELETE CASCADE on user_id, a single DELETE is enough.
// Admins cannot delete themselves.
router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  // Prevent self-deletion
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account from the admin panel' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('DELETE /admin/users/:userId error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
