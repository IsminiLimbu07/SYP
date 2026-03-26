// Backend/controllers/notificationController.js
import { sql } from '../config/db.js';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// ── Push helper ───────────────────────────────────────────────────────────────
// Sends up to 100 messages per request (Expo batch limit).
async function sendBatchedPushNotifications(messages) {
  if (!messages.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        console.error('❌ Expo API batch error, status:', res.status);
        failed += batch.length;
      } else {
        const data = await res.json();
        // data.data is an array of ticket objects
        const tickets = data?.data ?? [];
        tickets.forEach((t) => (t.status === 'ok' ? sent++ : failed++));
        if (tickets.length === 0) sent += batch.length; // fallback if no tickets
      }
    } catch (err) {
      console.error('❌ Expo push batch request failed:', err.message);
      failed += batch.length;
    }
  }

  return { sent, failed };
}

// ── POST /api/notifications ───────────────────────────────────────────────────
export const sendNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      alert_type,
      severity,
      target_all,
      target_city,
      send_push,
      send_sms,
      safe_location_lat,
      safe_location_lng,
      safe_location_label,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
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

    // ── Insert notification record ──────────────────────────────────────────
    const result = await sql`
      INSERT INTO notifications
        (sender_id, title, message, alert_type, severity,
         target_all, target_city, send_push, send_sms,
         safe_location_lat, safe_location_lng, safe_location_label)
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
          ${safe_location_lat ?? null},
          ${safe_location_lng ?? null},
          ${safe_location_label?.trim() || null}
        )
      RETURNING
        notification_id, sender_id, title, message, alert_type, severity,
        target_all, target_city, send_push, send_sms,
        safe_location_lat, safe_location_lng, safe_location_label,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
    `;

    const notificationRecord = result[0];

    // ── Send push notifications ─────────────────────────────────────────────
    // expo_push_token lives in the users table.
    // City filtering is done via user_profiles.city.
    // De-duplicate tokens to avoid sending multiple notifications to the same user
    let pushStats = { total: 0, sent: 0, failed: 0 };

    if (send_push !== false) {
      try {
        let tokenRows;

        if (target_all) {
          // All users who have an Expo token (de-duplicated by user_id - get most recent)
          tokenRows = await sql`
            SELECT DISTINCT ON (u.user_id) u.user_id, u.expo_push_token
            FROM users u
            WHERE u.expo_push_token IS NOT NULL
              AND u.expo_push_token <> ''
            ORDER BY u.user_id, u.updated_at DESC
          `;
        } else {
          // Users in the target city (de-duplicated by user_id - get most recent)
          tokenRows = await sql`
            SELECT DISTINCT ON (u.user_id) u.user_id, u.expo_push_token
            FROM users u
            INNER JOIN user_profiles up ON up.user_id = u.user_id
            WHERE u.expo_push_token IS NOT NULL
              AND u.expo_push_token <> ''
              AND up.city ILIKE ${target_city.trim()}
            ORDER BY u.user_id, u.updated_at DESC
          `;
        }

        console.log('🔍 Token rows retrieved:', tokenRows.length, 'unique users');
        console.log('📋 Tokens:', tokenRows.map(r => `${r.user_id}:${r.expo_push_token.substring(0, 20)}...`).join(', '));

        // Double-check: deduplicate by token value as well (in case same user has duplicate tokens)
        const uniqueTokens = new Map();
        tokenRows.forEach((r) => {
          if (!uniqueTokens.has(r.expo_push_token)) {
            uniqueTokens.set(r.expo_push_token, r);
          }
        });
        
        if (uniqueTokens.size < tokenRows.length) {
          console.warn(`⚠️ Found duplicate tokens! Had ${tokenRows.length}, deduped to ${uniqueTokens.size}`);
          tokenRows = Array.from(uniqueTokens.values());
        }

        const messages = tokenRows.map((r) => ({
          to:       r.expo_push_token,
          sound:    'default',
          title:    title.trim(),
          body:     message.trim(),
          priority: alert_type === 'sos' ? 'high' : 'normal',
          badge:    1,
          data: {
            alert_type,
            severity,
            notification_id: notificationRecord.notification_id,
            // Include safe location in push data so the app can use it
            ...(safe_location_lat && {
              safe_location_lat,
              safe_location_lng,
              safe_location_label: safe_location_label?.trim() || null,
            }),
          },
        }));

        pushStats.total = messages.length;
        console.log(`📱 Sending push to ${messages.length} device(s)...`);

        const { sent, failed } = await sendBatchedPushNotifications(messages);
        pushStats.sent   = sent;
        pushStats.failed = failed;

        console.log(`✅ Push done — sent: ${sent}, failed: ${failed}`);
      } catch (pushError) {
        console.error('❌ Push notification error (non-fatal):', pushError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notificationRecord,
      pushStats,
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns notifications visible to the requesting user, with is_read flag
// and safe location fields.
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
        n.notification_id,
        n.sender_id,
        n.title,
        n.message,
        n.alert_type,
        n.severity,
        n.target_all,
        n.target_city,
        n.send_push,
        n.send_sms,
        n.safe_location_lat,
        n.safe_location_lng,
        n.safe_location_label,
        to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
        u.full_name AS sender_name,
        CASE WHEN nr.user_id IS NOT NULL THEN true ELSE false END AS is_read
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.user_id
      LEFT JOIN notification_reads nr
        ON nr.notification_id = n.notification_id
       AND nr.user_id = ${req.user.user_id}
      WHERE ${cityFilter}
      ORDER BY n.created_at DESC
      LIMIT 100
    `;

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── PUT /api/notifications/mark-read ─────────────────────────────────────────
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
    console.error('❌ Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── GET /api/notifications/unread-count ──────────────────────────────────────
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
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
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
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── POST /api/notifications/register-token ───────────────────────────────────
// Called by the mobile app on login / startup to store / refresh the Expo token.
// ⚠️ IMPORTANT: Each call replaces the previous token (only 1 token per user)
export const registerExpoToken = async (req, res) => {
  try {
    const { expo_push_token } = req.body;
    const user_id = req.user.user_id;

    if (!expo_push_token || !expo_push_token.trim())
      return res.status(400).json({ success: false, message: 'expo_push_token is required' });

    console.log(`🔑 Registering token for user ${user_id}: ${expo_push_token.substring(0, 30)}...`);

    // Update user's token (automatically replaces old token)
    await sql`
      UPDATE users
      SET expo_push_token = ${expo_push_token.trim()},
          updated_at = NOW()
      WHERE user_id = ${user_id}
    `;

    console.log(`✅ Token registered successfully for user ${user_id}`);

    res.status(200).json({ 
      success: true, 
      message: 'Expo push token registered successfully',
      token_preview: expo_push_token.substring(0, 30) + '...'
    });
  } catch (error) {
    console.error('❌ Error registering expo token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};