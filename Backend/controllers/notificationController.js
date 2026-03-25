// Backend/controllers/notificationController.js
import { sql } from '../config/db.js';
// notificationController.js — top of sendNotification
export const sendNotification = async (req, res) => {
  try {
    const {
      title, message, alert_type, severity,
      target_all, target_city, send_push, send_sms,
      safe_location_lat, safe_location_lng, safe_location_label,
    } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });
    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });
    if (!['sos', 'general'].includes(alert_type))
      return res.status(400).json({ success: false, message: "alert_type must be 'sos' or 'general'" });
    if (!['critical', 'warning', 'info'].includes(severity))
      return res.status(400).json({ success: false, message: "severity must be 'critical', 'warning', or 'info'" });
    if (!target_all && (!target_city || !target_city.trim()))
      return res.status(400).json({ success: false, message: 'target_city is required when target_all is false' });

    const result = await sql`
      INSERT INTO notifications
        (sender_id, title, message, alert_type, severity, target_all, target_city,
         send_push, send_sms, safe_location_lat, safe_location_lng, safe_location_label)
      VALUES
        (
          ${req.user.user_id},
          ${title.trim()},
          ${message.trim()},
          ${alert_type},
          ${severity},
          ${target_all ?? true},
          ${target_city?.trim() || null},
          ${send_push ?? true},
          ${send_sms ?? false},
          ${safe_location_lat || null},
          ${safe_location_lng || null},
          ${safe_location_label?.trim() || null}
        )
      RETURNING
        notification_id, sender_id, title, message, alert_type, severity,
        target_all, target_city, send_push, send_sms,
        safe_location_lat, safe_location_lng, safe_location_label,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
    `;

    // ── Send push notifications ──────────────────────────────────────────
    try {
      const tokenRows = target_all
        ? await sql`SELECT push_token FROM user_profiles WHERE push_token IS NOT NULL`
        : await sql`
            SELECT push_token FROM user_profiles
            WHERE push_token IS NOT NULL
            AND city ILIKE ${target_city}`;

      const messages = tokenRows
        .map(r => r.push_token)
        .filter(Boolean)
        .map(token => ({
          to:       token,
          title:    title.trim(),
          body:     message.trim(),
          sound:    'default',
          priority: alert_type === 'sos' ? 'high' : 'normal',
          data: {
            alert_type,
            notification_id: result[0].notification_id,
          },
        }));

      // Expo allows max 100 per request
      for (let i = 0; i < messages.length; i += 100) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(messages.slice(i, i + 100)),
        });
      }
      console.log(`✅ Push sent to ${messages.length} device(s)`);
    } catch (pushError) {
      console.error('Push notification error (non-fatal):', pushError);
    }
    // ── End push block ───────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: result[0],
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// GET /notifications — includes is_read and safe location per user
export const getNotifications = async (req, res) => {
  try {
    const profileRows = await sql`
      SELECT city FROM user_profiles WHERE user_id = ${req.user.user_id}
    `;
    const userCity = profileRows[0]?.city || null;

    const cityFilter = userCity
      ? sql`(n.target_all = true OR n.target_city ILIKE ${userCity})`
      : sql`n.target_all = true`;

    const notifications = await sql`
      SELECT
        n.notification_id, n.sender_id, n.title, n.message, n.alert_type,
        n.severity, n.target_all, n.target_city, n.send_push, n.send_sms,
        n.safe_location_lat, n.safe_location_lng, n.safe_location_label,
        to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
        u.full_name AS sender_name,
        CASE WHEN nr.user_id IS NOT NULL THEN true ELSE false END AS is_read
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      LEFT JOIN notification_reads nr
        ON nr.notification_id = n.notification_id AND nr.user_id = ${req.user.user_id}
      WHERE ${cityFilter}
      ORDER BY n.created_at DESC
      LIMIT 100
    `;

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /notifications/mark-read
export const markNotificationsRead = async (req, res) => {
  try {
    await sql`
      INSERT INTO notification_reads (user_id, notification_id)
      SELECT ${req.user.user_id}, n.notification_id
      FROM notifications n
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_reads nr
        WHERE nr.user_id = ${req.user.user_id}
          AND nr.notification_id = n.notification_id
      )
      ON CONFLICT DO NOTHING
    `;
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const profileRows = await sql`
      SELECT city FROM user_profiles WHERE user_id = ${req.user.user_id}
    `;
    const userCity = profileRows[0]?.city || null;

    const cityFilter = userCity
      ? sql`(n.target_all = true OR n.target_city ILIKE ${userCity})`
      : sql`n.target_all = true`;

    const result = await sql`
      SELECT COUNT(*) AS count
      FROM notifications n
      WHERE ${cityFilter}
        AND NOT EXISTS (
          SELECT 1 FROM notification_reads nr
          WHERE nr.notification_id = n.notification_id
            AND nr.user_id = ${req.user.user_id}
        )
    `;

    res.status(200).json({ success: true, count: parseInt(result[0].count, 10) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await sql`
      SELECT notification_id FROM notifications WHERE notification_id = ${id}
    `;
    if (existing.length === 0)
      return res.status(404).json({ success: false, message: 'Notification not found' });

    await sql`DELETE FROM notifications WHERE notification_id = ${id}`;

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};