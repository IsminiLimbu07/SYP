// Backend/routes/notificationRoutes.js
import express from 'express';
import {
  sendNotification,
  getNotifications,
  deleteNotification,
  markNotificationsRead,
  getUnreadCount,
  registerExpoToken,
} from '../controllers/notificationController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Timestamp normalisation helper
// ─────────────────────────────────────────────────────────────────────────────
const TS_FIELDS = ['created_at', 'updated_at', 'sent_at', 'scheduled_at'];

const normaliseTimestamps = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normaliseTimestamps);
  const out = { ...obj };
  for (const field of TS_FIELDS) {
    if (out[field]) {
      const raw = typeof out[field] === 'string' ? out[field] : out[field].toISOString();
      out[field] = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
    }
  }
  return out;
};

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

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: specific sub-routes MUST be declared before the /:id wildcard
// otherwise Express matches "unread-count" and "mark-read" as IDs.
// ─────────────────────────────────────────────────────────────────────────────

// ── Any authenticated user ────────────────────────────────────────────────────

// GET  /api/notifications              — fetch notifications for this user
router.get('/', authenticateToken, withNormalisedTimestamps, getNotifications);

// GET  /api/notifications/unread-count — number of unread notifications
router.get('/unread-count', authenticateToken, getUnreadCount);

// PUT  /api/notifications/mark-read    — mark all visible notifications as read
router.put('/mark-read', authenticateToken, markNotificationsRead);

// POST /api/notifications/register-token — save / refresh device Expo push token
router.post('/register-token', authenticateToken, registerExpoToken);

// ── Admin only ────────────────────────────────────────────────────────────────

// POST   /api/notifications            — broadcast a new notification
router.post('/', authenticateToken, isAdmin, withNormalisedTimestamps, sendNotification);

// DELETE /api/notifications/:id        — remove a notification
router.delete('/:id', authenticateToken, isAdmin, deleteNotification);

export default router;