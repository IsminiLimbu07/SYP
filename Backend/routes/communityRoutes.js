// backend/routes/communityRoutes.js
import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getAllCampaigns } from '../controllers/campaignController.js';

const router = express.Router();

// ═══════════════════════════════════════════════════
// GET /api/community/my-status
// Returns current user's volunteer status
// ═══════════════════════════════════════════════════
router.get('/my-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [userRow] = await sql`
            SELECT u.user_id,
                   u.full_name,
                   u.is_volunteer,
                   u.volunteer_since,
                   u.events_organized,
                   COALESCE(p.volunteer_status, 'none') AS volunteer_status
            FROM users u
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            WHERE u.user_id = ${userId}
        `;

        if (!userRow) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isVolunteer = !!userRow.is_volunteer || userRow.volunteer_status === 'approved';

        return res.status(200).json({
            success: true,
            data: {
                user_id:          userRow.user_id,
                full_name:        userRow.full_name,
                is_volunteer:     isVolunteer,
                volunteer_since:  userRow.volunteer_since,
                events_organized: userRow.events_organized,
                volunteer_status: userRow.volunteer_status,
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

        // 'include_past' query param lets the frontend opt-in to seeing past events (e.g. organizer's history)
        const includePast = req.query.include_past === 'true';

        console.log('GET /api/community/events - query:', { status, city, organizer_id, limit, includePast });

        // ── Build a single dynamic query instead of a combinatorial if/else tree ──
        // postgres.js supports conditional sql fragments via sql([]) and sql``
        const statusFilter     = status      ? sql`AND e.status = ${status}`                           : sql``;
        const cityFilter       = city        ? sql`AND e.city ILIKE ${'%' + city + '%'}`               : sql``;
        const organizerFilter  = organizer_id ? sql`AND e.organizer_id = ${parseInt(organizer_id)}`   : sql``;

        // ⚠️  KEY FIX: Only apply the date filter when NOT asking for past events.
        //     When status='upcoming' is passed, use status filter (already 'upcoming' in DB).
        //     The hard date cutoff was silently dropping rows whose event_date was today or
        //     stored in a different timezone than the DB server.
        const dateFilter = includePast ? sql`` : sql`AND e.event_date >= (CURRENT_DATE - INTERVAL '1 day')`;

        const events = await sql`
            SELECT
                e.*,
                u.full_name    AS organizer_name,
                u.is_volunteer AS organizer_is_volunteer,
                (SELECT COUNT(*) FROM event_participants
                 WHERE event_id = e.event_id) AS current_participants
            FROM donation_events e
            JOIN users u ON e.organizer_id = u.user_id
            WHERE 1=1
            ${statusFilter}
            ${cityFilter}
            ${organizerFilter}
            ${dateFilter}
            ORDER BY e.event_date ASC, e.start_time ASC
            LIMIT ${limit}
        `;

        console.log('Events fetched:', events.length);

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// ═══════════════════════════════════════════════════
// ✅ NEW: POST /api/community/events - Create a new event
// ═══════════════════════════════════════════════════
router.post('/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            title, description, event_date, start_time, end_time,
            location, city, address, contact_number, image_url, max_participants
        } = req.body;

        // Validation
        if (!title || !event_date || !start_time || !end_time || !location || !city) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, event_date, start_time, end_time, location, city'
            });
        }

        console.log(`📝 Creating event: "${title}" by organizer ${userId}`);

        const [event] = await sql`
            INSERT INTO donation_events (
                organizer_id, title, description, event_date, start_time, end_time,
                location, city, address, contact_number, image_url, max_participants, status
            )
            VALUES (
                ${userId}, ${title}, ${description}, ${event_date}, ${start_time}, ${end_time},
                ${location}, ${city}, ${address || null}, ${contact_number || null},
                ${image_url || null}, ${max_participants || null}, 'upcoming'
            )
            RETURNING *
        `;

        // Update events_organized counter
        await sql`
            UPDATE users 
            SET events_organized = events_organized + 1
            WHERE user_id = ${userId}
        `;

        console.log(`✅ Event created: ID=${event.event_id}, title="${event.title}"`);

        return res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        });
    } catch (error) {
        console.error('❌ Error creating event:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create event'
        });
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
                u.is_volunteer   AS organizer_is_volunteer,
                (SELECT COUNT(*) FROM event_participants
                 WHERE event_id = e.event_id) AS current_participants
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
// ✅ NEW: PUT /api/community/events/:eventId - Update an event
// ═══════════════════════════════════════════════════
router.put('/events/:eventId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Check if event exists and user is organizer
        const [event] = await sql`
            SELECT organizer_id FROM donation_events WHERE event_id = ${eventId}
        `;

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this event'
            });
        }

        const {
            title, description, event_date, start_time, end_time,
            location, city, address, contact_number, image_url, max_participants
        } = req.body;

        console.log(`✏️ Updating event ${eventId} by organizer ${userId}`);

        const [updatedEvent] = await sql`
            UPDATE donation_events
            SET
                title = COALESCE(${title || null}, title),
                description = COALESCE(${description || null}, description),
                event_date = COALESCE(${event_date || null}, event_date),
                start_time = COALESCE(${start_time || null}, start_time),
                end_time = COALESCE(${end_time || null}, end_time),
                location = COALESCE(${location || null}, location),
                city = COALESCE(${city || null}, city),
                address = COALESCE(${address || null}, address),
                contact_number = COALESCE(${contact_number || null}, contact_number),
                image_url = COALESCE(${image_url || null}, image_url),
                max_participants = COALESCE(${max_participants || null}, max_participants),
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ${eventId}
            RETURNING *
        `;

        console.log(`✅ Event updated: ID=${eventId}`);

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent
        });
    } catch (error) {
        console.error('❌ Error updating event:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update event'
        });
    }
});

// ═══════════════════════════════════════════════════
// DELETE /api/community/events/:eventId - Delete an event
// ═══════════════════════════════════════════════════
router.delete('/events/:eventId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Check if event exists and user is organizer
        const [event] = await sql`
            SELECT organizer_id FROM donation_events WHERE event_id = ${eventId}
        `;

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this event'
            });
        }

        await sql`
            DELETE FROM donation_events WHERE event_id = ${eventId}
        `;

        // Decrement events_organized counter
        await sql`
            UPDATE users 
            SET events_organized = GREATEST(events_organized - 1, 0)
            WHERE user_id = ${userId}
        `;

        console.log(`🗑️ Event deleted: ID=${eventId}`);

        return res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete event'
        });
    }
});

// ═══════════════════════════════════════════════════
// POST /api/community/events/:eventId/register
// Register for an event
// ═══════════════════════════════════════════════════
router.post('/events/:eventId/register', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Check if event exists
        const [event] = await sql`
            SELECT event_id, title, max_participants FROM donation_events WHERE event_id = ${eventId}
        `;

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user already registered
        const [existing] = await sql`
            SELECT participant_id FROM event_participants
            WHERE event_id = ${eventId} AND user_id = ${userId}
        `;

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }

        // Check capacity if max_participants is set
        if (event.max_participants) {
            const [count] = await sql`
                SELECT COUNT(*) as participants FROM event_participants
                WHERE event_id = ${eventId} AND registration_status = 'registered'
            `;

            if (count.participants >= event.max_participants) {
                return res.status(400).json({
                    success: false,
                    message: 'Event is full'
                });
            }
        }

        // Register for event
        try {
            await sql`
                INSERT INTO event_participants (event_id, user_id, registration_status)
                VALUES (${eventId}, ${userId}, 'registered')
            `;

            console.log(`✅ User ${userId} registered for event ${eventId}`);

            return res.status(201).json({
                success: true,
                message: 'Successfully registered for event'
            });
        } catch (insertError) {
            console.error('❌ Database error inserting registration:', {
                error: insertError.message,
                eventId,
                userId,
                code: insertError.code
            });
            
            // Check if table exists
            if (insertError.message.includes('event_participants') || insertError.code === '42P1') {
                return res.status(500).json({
                    success: false,
                    message: 'Database table not properly initialized'
                });
            }
            
            throw insertError;
        }
    } catch (error) {
        console.error('❌ Error registering for event:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to register for event',
            error: error.message.substring(0, 100)
        });
    }
});

// ═══════════════════════════════════════════════════
// DELETE /api/community/events/:eventId/unregister
// Unregister from an event
// ═══════════════════════════════════════════════════
router.delete('/events/:eventId/unregister', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Remove registration
        const [result] = await sql`
            DELETE FROM event_participants
            WHERE event_id = ${eventId} AND user_id = ${userId}
            RETURNING participant_id
        `;

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        console.log(`✅ User ${userId} unregistered from event ${eventId}`);

        return res.status(200).json({
            success: true,
            message: 'Successfully unregistered from event'
        });
    } catch (error) {
        console.error('Error unregistering from event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unregister from event'
        });
    }
});

export default router;