// Backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

// ─── Authenticate JWT token ───────────────────────────────────────────────────
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing',
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Check admin role — queries the DATABASE, not just the JWT ───────────────
// Why: A user could be granted admin AFTER they logged in.
// Their JWT still has is_admin: false, but the DB has is_admin: true.
// Checking the DB means the change takes effect immediately without
// requiring the user to log out and back in.
export const isAdmin = async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT is_admin FROM users
      WHERE user_id = ${req.user.user_id}
        AND is_active = true
    `;
    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: 'User not found or inactive' });
    }
    if (!rows[0].is_admin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user.is_admin = true;
    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
