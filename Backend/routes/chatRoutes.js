// backend/routes/chatRoutes.js
import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ═══════════════════════════════════════════
// GET /chat/messages
// Returns the last N messages (oldest first)
// Optional ?before=<message_id> for pagination
// ═══════════════════════════════════════════
router.get('/messages', authenticateToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 200);
        const before = req.query.before ? parseInt(req.query.before) : null;

        let messages;

        if (before) {
            messages = await sql`
                SELECT
                    cm.message_id,
                    cm.sender_id,
                    cm.message_text,
                    cm.message_type,
                    cm.image_url,
                    cm.event_id,
                    cm.created_at,
                    u.full_name   AS sender_name,
                    u.is_volunteer AS sender_is_volunteer,
                    u.phone_number AS sender_phone
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.user_id
                WHERE cm.message_id < ${before}
                ORDER BY cm.created_at DESC
                LIMIT ${limit}
            `;
        } else {
            messages = await sql`
                SELECT
                    cm.message_id,
                    cm.sender_id,
                    cm.message_text,
                    cm.message_type,
                    cm.image_url,
                    cm.event_id,
                    cm.created_at,
                    u.full_name   AS sender_name,
                    u.is_volunteer AS sender_is_volunteer,
                    u.phone_number AS sender_phone
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.user_id
                ORDER BY cm.created_at DESC
                LIMIT ${limit}
            `;
        }

        // Reverse so oldest messages appear first in the chat
        const ordered = [...messages].reverse();

        return res.status(200).json({
            success: true,
            data: ordered,
            count: ordered.length,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// ═══════════════════════════════════════════
// POST /chat/send
// Send a new message
// Body: { message_text, message_type?, image_url?, event_id? }
// ═══════════════════════════════════════════
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            message_text,
            message_type = 'text',
            image_url = null,
            event_id = null,
        } = req.body;

        // ── Validation ──
        if (!message_text || message_text.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }
        if (message_text.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Message too long (max 500 characters)',
            });
        }

        const trimmedText = message_text.trim();

        // ── Insert ──
        const [newMessage] = await sql`
            INSERT INTO chat_messages (sender_id, message_text, message_type, image_url, event_id)
            VALUES (${userId}, ${trimmedText}, ${message_type}, ${image_url}, ${event_id})
            RETURNING message_id, sender_id, message_text, message_type, image_url, event_id, created_at
        `;

        // ── Fetch sender info ──
        const [sender] = await sql`
            SELECT full_name, is_volunteer, phone_number
            FROM users
            WHERE user_id = ${userId}
        `;

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                ...newMessage,
                sender_name: sender.full_name,
                sender_is_volunteer: sender.is_volunteer,
                sender_phone: sender.phone_number,
            },
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// ═══════════════════════════════════════════
// DELETE /chat/messages/:messageId
// Delete own message only
// ═══════════════════════════════════════════
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const messageId = parseInt(req.params.messageId);

        if (isNaN(messageId)) {
            return res.status(400).json({ success: false, message: 'Invalid message ID' });
        }

        const [message] = await sql`
            SELECT sender_id FROM chat_messages WHERE message_id = ${messageId}
        `;

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (message.sender_id !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        await sql`DELETE FROM chat_messages WHERE message_id = ${messageId}`;

        return res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

// ═══════════════════════════════════════════
// GET /chat/stats
// Aggregate chatroom statistics
// ═══════════════════════════════════════════
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await sql`
            SELECT
                COUNT(*)              AS total_messages,
                COUNT(DISTINCT sender_id) AS unique_senders,
                MAX(created_at)       AS last_message_at
            FROM chat_messages
        `;

        const [volunteerRow] = await sql`
            SELECT COUNT(*) AS count FROM users WHERE is_volunteer = true
        `;

        return res.status(200).json({
            success: true,
            data: {
                total_messages:  parseInt(stats.total_messages),
                unique_senders:  parseInt(stats.unique_senders),
                last_message_at: stats.last_message_at,
                volunteer_count: parseInt(volunteerRow.count),
            },
        });
    } catch (error) {
        console.error('Error fetching chat stats:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch chat statistics' });
    }
});

// ═══════════════════════════════════════════
// POST /chat/share-event/:eventId
// Share an event card into the chat
// ═══════════════════════════════════════════
router.post('/share-event/:eventId', authenticateToken, async (req, res) => {
    try {
        const userId  = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const [event] = await sql`
            SELECT title FROM donation_events WHERE event_id = ${eventId}
        `;
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const [userRow] = await sql`
            SELECT full_name FROM users WHERE user_id = ${userId}
        `;

        const messageText = `${userRow.full_name} shared an event: "${event.title}"`;

        const [result] = await sql`
            INSERT INTO chat_messages (sender_id, message_text, message_type, event_id)
            VALUES (${userId}, ${messageText}, 'event_share', ${eventId})
            RETURNING message_id, sender_id, message_text, message_type, event_id, created_at
        `;

        return res.status(201).json({
            success: true,
            message: 'Event shared in chat',
            data: {
                ...result,
                sender_name: userRow.full_name,
            },
        });
    } catch (error) {
        console.error('Error sharing event:', error);
        return res.status(500).json({ success: false, message: 'Failed to share event' });
    }
});

export default router;