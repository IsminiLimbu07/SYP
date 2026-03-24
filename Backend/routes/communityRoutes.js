// backend/routes/communityRoutes.js
import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getAllCampaigns } from '../controllers/campaignController.js';

const router = express.Router();

// ═══════════════════════════════════════════════════
// GET /api/community/my-status
// Returns current user's volunteer status
// NEW endpoint — called by CommunityHomeScreen on load
// ═══════════════════════════════════════════════════
router.get('/my-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [userRow] = await sql`
            SELECT user_id, full_name, is_volunteer, volunteer_since, events_organized
            FROM users
            WHERE user_id = ${userId}
        `;

        if (!userRow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            data: {
                user_id:          userRow.user_id,
                full_name:        userRow.full_name,
                is_volunteer:     userRow.is_volunteer,
                volunteer_since:  userRow.volunteer_since,
                events_organized: userRow.events_organized,
            },
        });
    } catch (error) {
        console.error('Error fetching volunteer status:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/community/campaigns (redirect to campaigns route)
// ═══════════════════════════════════════════════════
router.get('/campaigns', authenticateToken, getAllCampaigns);

// ═══════════════════════════════════════════════════
// POST /api/community/become-volunteer
// ═══════════════════════════════════════════════════
router.post('/become-volunteer', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [existingUser] = await sql`
            SELECT is_volunteer FROM users WHERE user_id = ${userId}
        `;

        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (existingUser.is_volunteer) {
            // Return success so frontend still updates state correctly
            return res.status(200).json({
                success: true,
                message: 'You are already a volunteer',
                already_volunteer: true,
            });
        }

        const [result] = await sql`
            UPDATE users
            SET is_volunteer    = true,
                volunteer_since = CURRENT_TIMESTAMP,
                updated_at      = CURRENT_TIMESTAMP
            WHERE user_id = ${userId}
            RETURNING user_id, full_name, is_volunteer, volunteer_since
        `;

        return res.status(200).json({
            success: true,
            message: 'You are now a volunteer! You can create events.',
            user: result,
        });
    } catch (error) {
        console.error('Error becoming volunteer:', error);
        return res.status(500).json({ success: false, message: 'Failed to register as volunteer' });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/community/events
// ═══════════════════════════════════════════════════
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const { status, city, organizer_id } = req.query;

        let events;

        if (status && city && organizer_id) {
            events = await sql`
                SELECT e.*,
                    u.full_name         AS organizer_name,
                    u.is_volunteer      AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.status = ${status}
                  AND e.city ILIKE ${'%' + city + '%'}
                  AND e.organizer_id = ${parseInt(organizer_id)}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (status && city) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.status = ${status}
                  AND e.city ILIKE ${'%' + city + '%'}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (status && organizer_id) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.status = ${status}
                  AND e.organizer_id = ${parseInt(organizer_id)}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (city && organizer_id) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.city ILIKE ${'%' + city + '%'}
                  AND e.organizer_id = ${parseInt(organizer_id)}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (status) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.status = ${status}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (city) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.city ILIKE ${'%' + city + '%'}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else if (organizer_id) {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                WHERE e.organizer_id = ${parseInt(organizer_id)}
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        } else {
            events = await sql`
                SELECT e.*,
                    u.full_name    AS organizer_name,
                    u.is_volunteer AS organizer_is_volunteer,
                    (SELECT COUNT(*) FROM event_participants
                     WHERE event_id = e.event_id AND status = 'registered') AS current_participants
                FROM donation_events e
                JOIN users u ON e.organizer_id = u.user_id
                ORDER BY e.event_date ASC, e.start_time ASC
                LIMIT ${limit}
            `;
        }

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/community/events/:eventId
// ═══════════════════════════════════════════════════
router.get('/events/:eventId', authenticateToken, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const [event] = await sql`
            SELECT
                e.*,
                u.full_name      AS organizer_name,
                u.phone_number   AS organizer_phone,
                u.is_volunteer   AS organizer_is_volunteer,
                (SELECT COUNT(*) FROM event_participants
                 WHERE event_id = e.event_id AND status = 'registered') AS current_participants
            FROM donation_events e
            JOIN users u ON e.organizer_id = u.user_id
            WHERE e.event_id = ${eventId}
        `;

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error('Error fetching event:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
});

// ═══════════════════════════════════════════════════
// POST /api/community/events  (volunteers only)
// ═══════════════════════════════════════════════════
router.post('/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            title,
            description    = null,
            event_date,
            start_time,
            end_time,
            location,
            city,
            address        = null,
            contact_number = null,
            image_url      = null,
            max_participants = null,
        } = req.body;

        const [userRow] = await sql`
            SELECT is_volunteer FROM users WHERE user_id = ${userId}
        `;
        if (!userRow?.is_volunteer) {
            return res.status(403).json({ success: false, message: 'Only volunteers can create events' });
        }

        if (!title || !event_date || !start_time || !end_time || !location || !city) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, event_date, start_time, end_time, location, city',
            });
        }

        const [result] = await sql`
            INSERT INTO donation_events (
                organizer_id, title, description,
                event_date, start_time, end_time,
                location, city, address,
                contact_number, image_url, max_participants
            )
            VALUES (
                ${userId}, ${title}, ${description},
                ${event_date}, ${start_time}, ${end_time},
                ${location}, ${city}, ${address},
                ${contact_number}, ${image_url},
                ${max_participants ? parseInt(max_participants) : null}
            )
            RETURNING *
        `;

        try {
            await sql`
                UPDATE users
                SET events_organized = COALESCE(events_organized, 0) + 1
                WHERE user_id = ${userId}
            `;
        } catch (_) { /* non-fatal */ }

        return res.status(201).json({ success: true, message: 'Event created successfully', data: result });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ success: false, message: 'Failed to create event' });
    }
});

// ═══════════════════════════════════════════════════
// PUT /api/community/events/:eventId  (organizer only)
// ═══════════════════════════════════════════════════
router.put('/events/:eventId', authenticateToken, async (req, res) => {
    try {
        const userId  = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const [event] = await sql`
            SELECT organizer_id FROM donation_events WHERE event_id = ${eventId}
        `;
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.organizer_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the organiser can update this event' });
        }

        const allowed = [
            'title', 'description', 'event_date', 'start_time', 'end_time',
            'location', 'city', 'address', 'contact_number', 'image_url',
            'max_participants', 'status',
        ];
        const body   = req.body;
        const fields = Object.keys(body).filter((k) => allowed.includes(k));

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const setClauses = fields.map((field) => sql`${sql(field)} = ${body[field]}`);
        let setFragment  = setClauses[0];
        for (let i = 1; i < setClauses.length; i++) {
            setFragment = sql`${setFragment}, ${setClauses[i]}`;
        }

        const [updated] = await sql`
            UPDATE donation_events
            SET ${setFragment}, updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ${eventId}
            RETURNING *
        `;

        return res.status(200).json({ success: true, message: 'Event updated successfully', data: updated });
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ success: false, message: 'Failed to update event' });
    }
});

// ═══════════════════════════════════════════════════
// POST /api/community/events/:eventId/register
// ═══════════════════════════════════════════════════
router.post('/events/:eventId/register', authenticateToken, async (req, res) => {
    try {
        const userId  = req.user.user_id;
        const eventId = parseInt(req.params.eventId);
        const { blood_group = null } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const [event] = await sql`
            SELECT * FROM donation_events
            WHERE event_id = ${eventId} AND status = 'upcoming'
        `;
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or not available for registration',
            });
        }

        const [existing] = await sql`
            SELECT participant_id, status FROM event_participants
            WHERE event_id = ${eventId} AND user_id = ${userId}
        `;
        if (existing) {
            if (existing.status === 'registered') {
                return res.status(400).json({ success: false, message: 'You are already registered for this event' });
            }
            const [reactivated] = await sql`
                UPDATE event_participants
                SET status = 'registered', registered_at = CURRENT_TIMESTAMP
                WHERE event_id = ${eventId} AND user_id = ${userId}
                RETURNING *
            `;
            return res.status(200).json({ success: true, message: 'Registration reactivated', data: reactivated });
        }

        if (event.max_participants) {
            const [countRow] = await sql`
                SELECT COUNT(*) AS cnt FROM event_participants
                WHERE event_id = ${eventId} AND status = 'registered'
            `;
            if (parseInt(countRow.cnt) >= parseInt(event.max_participants)) {
                return res.status(400).json({ success: false, message: 'Event is full' });
            }
        }

        const [result] = await sql`
            INSERT INTO event_participants (event_id, user_id, blood_group)
            VALUES (${eventId}, ${userId}, ${blood_group})
            RETURNING *
        `;

        return res.status(201).json({ success: true, message: 'Successfully registered for event', data: result });
    } catch (error) {
        console.error('Error registering for event:', error);
        return res.status(500).json({ success: false, message: 'Failed to register for event' });
    }
});

// ═══════════════════════════════════════════════════
// DELETE /api/community/events/:eventId/register
// ═══════════════════════════════════════════════════
router.delete('/events/:eventId/register', authenticateToken, async (req, res) => {
    try {
        const userId  = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const [result] = await sql`
            UPDATE event_participants
            SET status = 'cancelled'
            WHERE event_id = ${eventId}
              AND user_id   = ${userId}
              AND status    = 'registered'
            RETURNING *
        `;

        if (!result) {
            return res.status(404).json({ success: false, message: 'Active registration not found' });
        }

        return res.status(200).json({ success: true, message: 'Registration cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling registration:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel registration' });
    }
});

// ═══════════════════════════════════════════════════
// GET /api/community/events/:eventId/participants
// ═══════════════════════════════════════════════════
router.get('/events/:eventId/participants', authenticateToken, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        if (isNaN(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const participants = await sql`
            SELECT
                ep.participant_id,
                ep.event_id,
                ep.user_id,
                ep.blood_group,
                ep.status,
                ep.registered_at,
                u.full_name,
                u.phone_number,
                u.is_volunteer
            FROM event_participants ep
            JOIN users u ON ep.user_id = u.user_id
            WHERE ep.event_id = ${eventId}
              AND ep.status   = 'registered'
            ORDER BY ep.registered_at DESC
        `;

        return res.status(200).json({ success: true, data: participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch participants' });
    }
});

export default router;