// Backend/controllers/notificationController.js
import { sql } from '../config/db.js';

export const sendNotification = async (req, res) => {
  try {
    const { title, message, alert_type, severity, target_all, target_city, send_push, send_sms } = req.body;

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
        (sender_id, title, message, alert_type, severity, target_all, target_city, send_push, send_sms)
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
          ${send_sms ?? false}
        )
      RETURNING
        notification_id,
        sender_id,
        title,
        message,
        alert_type,
        severity,
        target_all,
        target_city,
        send_push,
        send_sms,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
    `;

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

export const getNotifications = async (req, res) => {
  try {
    const profileRows = await sql`
      SELECT city FROM user_profiles WHERE user_id = ${req.user.user_id}
    `;
    const userCity = profileRows[0]?.city || null;

    let notifications;

    if (userCity) {
      notifications = await sql`
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
          to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
          u.full_name AS sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.target_all = true OR n.target_city ILIKE ${userCity}
        ORDER BY n.created_at DESC
        LIMIT 100
      `;
    } else {
      notifications = await sql`
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
          to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
          u.full_name AS sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.target_all = true
        ORDER BY n.created_at DESC
        LIMIT 100
      `;
    }

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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