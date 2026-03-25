// Backend/controllers/notificationController.js
import { sql } from '../config/db.js';
import fetch from 'node-fetch'; // Make sure to: npm install node-fetch

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Helper: Send push notification via Expo API
 */
async function sendExpoPushNotification(expoPushToken, title, message, data = {}) {
  if (!expoPushToken) {
    console.log('⚠️ No Expo push token available for this user');
    return null;
  }

  const notificationPayload = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: message,
    data: {
      type: 'announcement',
      ...data,
    },
    badge: 1,
    priority: 'high',
  };

  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Expo API error:', responseData);
      return null;
    }

    console.log('✅ Push notification sent to Expo:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return null;
  }
}

/**
 * Send notification to all or specific users
 * Also sends push notification if user has registered Expo token
 */
export const sendNotification = async (req, res) => {
  try {
    const { title, message, alert_type, severity, target_all, target_city, send_push, send_sms } = req.body;

    // Validation
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

    // Create notification record in database
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

    const notificationRecord = result[0];

    // If send_push is true, send push notifications to users with Expo tokens
    if (send_push) {
      console.log('📱 Sending push notifications...');

      // Get users to send to based on target_all / target_city
      let targetUsers;

      if (target_all) {
        // Send to all users with Expo tokens
        targetUsers = await sql`
          SELECT user_id, expo_push_token 
          FROM users 
          WHERE expo_push_token IS NOT NULL
        `;
      } else {
        // Send to users in specific city with Expo tokens
        targetUsers = await sql`
          SELECT u.user_id, u.expo_push_token
          FROM users u
          LEFT JOIN user_profiles up ON u.user_id = up.user_id
          WHERE u.expo_push_token IS NOT NULL
            AND up.city ILIKE ${target_city?.trim()}
        `;
      }

      console.log(`🎯 Found ${targetUsers.length} users to send push notifications to`);

      // Send push notifications in parallel
      const pushPromises = targetUsers.map((user) =>
        sendExpoPushNotification(
          user.expo_push_token,
          title,
          message,
          {
            notificationId: notificationRecord.notification_id,
            alertType: alert_type,
            severity: severity,
          }
        )
      );

      const pushResults = await Promise.allSettled(pushPromises);
      const successCount = pushResults.filter((r) => r.status === 'fulfilled' && r.value).length;
      const failureCount = pushResults.filter((r) => r.status === 'rejected' || !r.value).length;

      console.log(`✅ Push notifications: ${successCount} sent, ${failureCount} failed`);

      return res.status(201).json({
        success: true,
        message: 'Notification sent successfully',
        data: notificationRecord,
        pushStats: {
          total: targetUsers.length,
          sent: successCount,
          failed: failureCount,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully (push disabled)',
      data: notificationRecord,
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get notifications for the current user
 */
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
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a notification (admin only)
 */
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

/**
 * Register/update user's Expo push token
 * Called by client on login or app startup
 */
export const registerExpoToken = async (req, res) => {
  try {
    const { expo_push_token } = req.body;
    const userId = req.user.user_id;

    if (!expo_push_token || !expo_push_token.trim()) {
      return res.status(400).json({ success: false, message: 'Expo push token is required' });
    }

    // Update user with new token
    await sql`
      UPDATE users
      SET expo_push_token = ${expo_push_token.trim()}
      WHERE user_id = ${userId}
    `;

    res.status(200).json({ 
      success: true, 
      message: 'Expo push token registered successfully' 
    });
  } catch (error) {
    console.error('❌ Error registering expo token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};