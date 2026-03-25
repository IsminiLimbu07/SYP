import express from 'express';
import {
  sendNotification,
  getNotifications,
  deleteNotification,
  markNotificationsRead,
  getUnreadCount,
} from '../controllers/notificationController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Timestamp normalisation helper
// PostgreSQL can return timestamps without a 'Z' suffix depending on the server
// timezone setting, which causes JS to parse them as local time instead of UTC.
// This ensures every timestamp field in notification payloads is a guaranteed
// UTC ISO-8601 string (e.g. "2026-03-19T08:30:00.000Z") before it reaches the
// client, so the Nepal timezone conversion in the frontend always works correctly.
// ─────────────────────────────────────────────────────────────────────────────
const TS_FIELDS = ['created_at', 'updated_at', 'sent_at', 'scheduled_at'];

const normaliseTimestamps = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normaliseTimestamps);
  const out = { ...obj };
  for (const field of TS_FIELDS) {
    if (out[field]) {
      const raw = typeof out[field] === 'string' ? out[field] : out[field].toISOString();
      // Append 'Z' if the string has no timezone info so Date() parses it as UTC
      out[field] = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
    }
  }
  return out;
};

// Wraps res.json to intercept and normalise all outgoing notification payloads
const withNormalisedTimestamps = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object') {
      if (Array.isArray(body.data)) {
        body = { ...body, data: body.data.map(normaliseTimestamps) };
      } else if (body.data && typeof body.data === 'object') {
        body = { ...body, data: normaliseTimestamps(body.data) };
      }
    }
    return originalJson(body);
  };
  next();
};

// ── Any authenticated user ────────────────────────────────────────────────────
// GET  /api/notifications          — fetch notifications relevant to this user
router.get('/', authenticateToken, withNormalisedTimestamps, getNotifications);

// ── Admin only ────────────────────────────────────────────────────────────────
// POST /api/notifications          — send a new notification
router.post('/', authenticateToken, isAdmin, withNormalisedTimestamps, sendNotification);

// DELETE /api/notifications/:id    — delete a notification
router.delete('/:id', authenticateToken, isAdmin, deleteNotification);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/mark-read', authenticateToken, markNotificationsRead);

export default router;