// Backend/server.js  — COMPLETE SELF-CONTAINED VERSION
// Notifications + Admin routes are defined INLINE here
// so there are no separate files to forget to copy.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { sql } from './config/db.js';

// ── Existing route files (unchanged) ─────────────────────────────────────────
import authRoutes      from './routes/authRoutes.js';
import bloodRoutes     from './routes/bloodRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import chatRoutes      from './routes/chatRoutes.js';
import donorRoutes     from './routes/donorRoutes.js';
import uploadRoutes    from './routes/uploadRoutes.js';
import campaignRoutes  from './routes/campaignRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 9000;

const __filename    = fileURLToPath(import.meta.url);
const __dirname     = path.dirname(__filename);
const eventsUploads = path.join(__dirname, 'uploads', 'events');
fs.mkdirSync(eventsUploads, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ══════════════════════════════════════════════════════════════════════════════
// INLINE AUTH MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token is missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// IMPORTANT: checks the DATABASE for is_admin, not the JWT
// This means it works even if the token was created before admin was granted
const isAdmin = async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT is_admin FROM users
      WHERE user_id = ${req.user.user_id} AND is_active = true
    `;
    if (rows.length === 0) return res.status(403).json({ success: false, message: 'User not found or inactive' });
    if (!rows[0].is_admin) return res.status(403).json({ success: false, message: 'Admin access required' });
    req.user.is_admin = true;
    next();
  } catch (error) {
    console.error('isAdmin error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// INLINE NOTIFICATION ROUTES
// POST /api/notifications  — admin sends notification
// GET  /api/notifications  — any user fetches their notifications
// DELETE /api/notifications/:id — admin deletes
// ══════════════════════════════════════════════════════════════════════════════

const notifRouter = express.Router();

// GET — fetch notifications for current user
notifRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const profileRows = await sql`SELECT city FROM user_profiles WHERE user_id = ${req.user.user_id}`;
    const userCity = profileRows[0]?.city || null;

    const notifications = userCity
      ? await sql`
          SELECT
            n.notification_id, n.sender_id, n.title, n.message,
            n.alert_type, n.severity, n.target_all, n.target_city,
            n.send_push, n.send_sms,
            to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            u.full_name AS sender_name
          FROM notifications n
          LEFT JOIN users u ON n.sender_id = u.user_id
          WHERE n.target_all = true OR n.target_city ILIKE ${userCity}
          ORDER BY n.created_at DESC LIMIT 100`
      : await sql`
          SELECT
            n.notification_id, n.sender_id, n.title, n.message,
            n.alert_type, n.severity, n.target_all, n.target_city,
            n.send_push, n.send_sms,
            to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
            u.full_name AS sender_name
          FROM notifications n
          LEFT JOIN users u ON n.sender_id = u.user_id
          WHERE n.target_all = true
          ORDER BY n.created_at DESC LIMIT 100`;

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST — admin sends a new notification
notifRouter.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, message, alert_type, severity, target_all, target_city, send_push, send_sms } = req.body;

    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
    if (!['sos', 'general'].includes(alert_type)) return res.status(400).json({ success: false, message: "alert_type must be 'sos' or 'general'" });
    if (!['critical', 'warning', 'info'].includes(severity)) return res.status(400).json({ success: false, message: "severity must be 'critical', 'warning', or 'info'" });
    if (!target_all && !target_city?.trim()) return res.status(400).json({ success: false, message: 'target_city required when target_all is false' });

    const result = await sql`
      INSERT INTO notifications (sender_id, title, message, alert_type, severity, target_all, target_city, send_push, send_sms)
      VALUES (${req.user.user_id}, ${title.trim()}, ${message.trim()}, ${alert_type}, ${severity}, ${target_all ?? true}, ${target_city?.trim() || null}, ${send_push ?? true}, ${send_sms ?? false})
      RETURNING
        notification_id, sender_id, title, message, alert_type, severity,
        target_all, target_city, send_push, send_sms,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at`;

    res.status(201).json({ success: true, message: 'Notification sent successfully', data: result[0] });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE — admin removes a notification
notifRouter.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await sql`SELECT * FROM notifications WHERE notification_id = ${id}`;
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
    await sql`DELETE FROM notifications WHERE notification_id = ${id}`;
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// INLINE ADMIN ROUTES
// GET    /api/admin/users       — list all users
// DELETE /api/admin/users/:id   — delete a user
// PATCH  /api/admin/users/:id/status — toggle active
// PATCH  /api/admin/users/:id/role   — toggle admin
// ══════════════════════════════════════════════════════════════════════════════

const adminRouter = express.Router();

// GET all users with profile info
adminRouter.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await sql`
      SELECT u.user_id, u.full_name, u.email, u.phone_number,
             u.is_admin, u.is_verified, u.is_active, u.is_volunteer, u.created_at,
             up.blood_group, up.city
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      ORDER BY u.created_at DESC`;
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE a user
adminRouter.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.user_id) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    const existing = await sql`SELECT * FROM users WHERE user_id = ${id}`;
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    await sql`DELETE FROM users WHERE user_id = ${id}`;
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH toggle active/suspended
adminRouter.patch('/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.user_id) return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    const existing = await sql`SELECT * FROM users WHERE user_id = ${id}`;
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const updated = await sql`UPDATE users SET is_active = ${!existing[0].is_active}, updated_at = NOW() WHERE user_id = ${id} RETURNING user_id, full_name, is_active`;
    res.status(200).json({ success: true, message: `User ${updated[0].is_active ? 'activated' : 'suspended'}`, data: updated[0] });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH toggle admin role
adminRouter.patch('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.user_id) return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    const existing = await sql`SELECT * FROM users WHERE user_id = ${id}`;
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const updated = await sql`UPDATE users SET is_admin = ${!existing[0].is_admin}, updated_at = NOW() WHERE user_id = ${id} RETURNING user_id, full_name, is_admin`;
    res.status(200).json({ success: true, message: `User ${updated[0].is_admin ? 'promoted to admin' : 'demoted'}`, data: updated[0] });
  } catch (error) {
    console.error('Error toggling role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// KHALTI PAYMENT ROUTES
// POST /api/payment/initiate  — create payment request, get pidx + payment_url
// POST /api/payment/verify    — verify payment after user returns from Khalti
// ══════════════════════════════════════════════════════════════════════════════

const paymentRouter = express.Router();

// INITIATE — called when user taps "Donate Now"
paymentRouter.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { campaign_id, amount, donor_name } = req.body;

    if (!campaign_id || !amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'campaign_id and amount (min Rs. 10) are required' 
      });
    }

    // Check campaign exists
    const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaign_id}`;
    if (campaign.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Create a pending donation record first
    const donation = await sql`
      INSERT INTO campaign_donations (campaign_id, donor_id, donor_name, amount, status)
      VALUES (${campaign_id}, ${req.user.user_id}, ${donor_name || 'Anonymous'}, ${amount}, 'pending')
      RETURNING *
    `;

    const donationId = donation[0].donation_id;
    const amountInPaisa = amount * 100; // Khalti needs paisa

    // Call Khalti initiate API
    const khaltiResponse = await fetch(`${process.env.KHALTI_BASE_URL}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        return_url: `${process.env.NGROK_URL}/api/payment/callback`,
        website_url: process.env.NGROK_URL,
        amount: amountInPaisa,
        purchase_order_id: `DONATION_${donationId}`,
        purchase_order_name: `Donation for ${campaign[0].patient_name}`,
        customer_info: {
          name: donor_name || req.user.email,
          email: req.user.email,
          phone: '9800000000', // use user phone if available
        },
      }),
    });

    const khaltiData = await khaltiResponse.json();

    if (!khaltiResponse.ok || !khaltiData.pidx) {
      // Clean up the pending donation if Khalti fails
      await sql`DELETE FROM campaign_donations WHERE donation_id = ${donationId}`;
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to initiate Khalti payment',
        error: khaltiData 
      });
    }

    // Save pidx to donation record for verification later
    await sql`
      UPDATE campaign_donations 
      SET transaction_id = ${khaltiData.pidx}
      WHERE donation_id = ${donationId}
    `;

    res.status(200).json({
      success: true,
      data: {
        pidx:        khaltiData.pidx,
        payment_url: khaltiData.payment_url,
        expires_at:  khaltiData.expires_at,
        donation_id: donationId,
      },
    });
  } catch (error) {
    console.error('Payment initiate error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// CALLBACK — Khalti redirects here after payment (GET request from browser)
paymentRouter.get('/callback', async (req, res) => {
  try {
    const { pidx, status, transaction_id, amount, purchase_order_id } = req.query;

    if (status === 'Completed') {
      // Mark donation as completed
      await sql`
        UPDATE campaign_donations 
        SET status = 'completed'
        WHERE transaction_id = ${pidx}
      `;
      res.send('<html><body><h2>✅ Payment Successful! Return to the app.</h2></body></html>');
    } else if (status === 'User canceled') {
      await sql`
        UPDATE campaign_donations 
        SET status = 'failed'
        WHERE transaction_id = ${pidx}
      `;
      res.send('<html><body><h2>❌ Payment Cancelled. Return to the app.</h2></body></html>');
    } else {
      res.send('<html><body><h2>⏳ Payment Pending. Return to the app.</h2></body></html>');
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    res.send('<html><body><h2>Something went wrong.</h2></body></html>');
  }
});

// VERIFY — called from app after user returns to confirm payment
paymentRouter.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ success: false, message: 'pidx is required' });
    }

    // Call Khalti lookup API
    const khaltiResponse = await fetch(`${process.env.KHALTI_BASE_URL}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiData.status === 'Completed') {
      // Mark donation as completed in DB
      const updated = await sql`
        UPDATE campaign_donations
        SET status = 'completed'
        WHERE transaction_id = ${pidx}
        RETURNING *
      `;

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: 'completed',
          transaction_id: khaltiData.transaction_id,
          amount: khaltiData.total_amount / 100, // convert back from paisa
          donation: updated[0],
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `Payment status: ${khaltiData.status}`,
        data: { status: khaltiData.status },
      });
    }
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// REGISTER ALL ROUTES
// ══════════════════════════════════════════════════════════════════════════════

app.use('/api/auth',          authRoutes);
app.use('/api/blood',         bloodRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/donors',        donorRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/campaigns',     campaignRoutes);
app.use('/api/notifications', notifRouter);   // ← inline
app.use('/api/admin',         adminRouter);   // ← inline
app.use('/api/payment', paymentRouter);


// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'AshaSetu API Server is running 🚀',
    version: '2.1.0',
    endpoints: {
      auth: '/api/auth', blood: '/api/blood', community: '/api/community',
      chat: '/api/chat', campaigns: '/api/campaigns',
      notifications: '/api/notifications', admin: '/api/admin',
    },
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));
app.use((err, req, res, next) => { console.error('❌ Error:', err); res.status(500).json({ success: false, message: 'Internal server error' }); });

// ══════════════════════════════════════════════════════════════════════════════
// DATABASE INIT
// ══════════════════════════════════════════════════════════════════════════════

async function initDB() {
  try {
    console.log('🔄 Initializing database...\n');

    await sql`CREATE TABLE IF NOT EXISTS users (user_id SERIAL PRIMARY KEY, full_name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, phone_number VARCHAR(20) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, is_admin BOOLEAN DEFAULT false, is_verified BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    // volunteer columns
    const volCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('is_volunteer','volunteer_since','events_organized','total_donations')`;
    const ev = volCols.map(c => c.column_name);
    if (!ev.includes('is_volunteer'))    await sql`ALTER TABLE users ADD COLUMN is_volunteer BOOLEAN DEFAULT FALSE`;
    if (!ev.includes('volunteer_since')) await sql`ALTER TABLE users ADD COLUMN volunteer_since TIMESTAMP DEFAULT NULL`;
    if (!ev.includes('events_organized'))await sql`ALTER TABLE users ADD COLUMN events_organized INTEGER DEFAULT 0`;
    if (!ev.includes('total_donations')) await sql`ALTER TABLE users ADD COLUMN total_donations INTEGER DEFAULT 0`;

    // verification columns
    const verifyCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('verification_token','verification_token_expires')`;
    const evc = verifyCols.map(c => c.column_name);
    if (!evc.includes('verification_token'))         await sql`ALTER TABLE users ADD COLUMN verification_token VARCHAR(64)`;
    if (!evc.includes('verification_token_expires')) await sql`ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMPTZ`;

    await sql`CREATE TABLE IF NOT EXISTS user_profiles (profile_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, date_of_birth DATE, gender VARCHAR(20), profile_picture_url TEXT, location_lat DECIMAL(10,8), location_lng DECIMAL(11,8), address TEXT, city VARCHAR(100), blood_group VARCHAR(5), willing_to_donate_blood BOOLEAN DEFAULT false, last_donation_date DATE, available_to_donate BOOLEAN DEFAULT true, willing_to_volunteer BOOLEAN DEFAULT false, volunteer_skills TEXT[], volunteer_availability VARCHAR(20) DEFAULT 'available', emergency_contact_name VARCHAR(255), emergency_contact_phone VARCHAR(20), medical_conditions TEXT, allergies TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await sql`CREATE TABLE IF NOT EXISTS blood_requests (request_id SERIAL PRIMARY KEY, requester_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')), units_needed INTEGER NOT NULL CHECK (units_needed >= 1 AND units_needed <= 20), urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('critical','urgent','normal')), patient_name VARCHAR(255) NOT NULL, hospital_name VARCHAR(255) NOT NULL, hospital_address TEXT, hospital_city VARCHAR(100), hospital_contact VARCHAR(20), needed_by_date DATE NOT NULL, description TEXT, status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','fulfilled','cancelled')), location_lat DECIMAL(10,8), location_lng DECIMAL(11,8), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await sql`CREATE TABLE IF NOT EXISTS donation_responses (donation_id SERIAL PRIMARY KEY, request_id INTEGER REFERENCES blood_requests(request_id) ON DELETE CASCADE, donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, message TEXT, status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(request_id, donor_id))`;

    await sql`CREATE TABLE IF NOT EXISTS donation_events (event_id SERIAL PRIMARY KEY, organizer_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, description TEXT, event_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, location VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, address TEXT, contact_number VARCHAR(20), image_url TEXT, max_participants INTEGER, current_participants INTEGER DEFAULT 0, status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await sql`CREATE TABLE IF NOT EXISTS event_participants (participant_id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, blood_group VARCHAR(5), status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')), registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(event_id, user_id))`;

    await sql`CREATE TABLE IF NOT EXISTS chat_messages (message_id SERIAL PRIMARY KEY, sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, message_text TEXT NOT NULL, message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text','image','event_share','system')), image_url TEXT, event_id INTEGER REFERENCES donation_events(event_id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await sql`CREATE TABLE IF NOT EXISTS event_ratings (rating_id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(event_id, user_id))`;

    await sql`CREATE TABLE IF NOT EXISTS campaigns (campaign_id SERIAL PRIMARY KEY, creator_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, patient_name VARCHAR(255) NOT NULL, age INTEGER, condition VARCHAR(255) NOT NULL, hospital_name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, target_amount INTEGER NOT NULL CHECK (target_amount >= 1000), deadline DATE NOT NULL, story TEXT NOT NULL, image_url TEXT, verified BOOLEAN DEFAULT false, status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','fulfilled','cancelled')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await sql`CREATE TABLE IF NOT EXISTS campaign_donations (donation_id SERIAL PRIMARY KEY, campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE, donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE, donor_name VARCHAR(255), amount INTEGER NOT NULL CHECK (amount >= 10), status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')), transaction_id VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    // ── NOTIFICATIONS TABLE ────────────────────────────────────────────────────
    await sql`CREATE TABLE IF NOT EXISTS notifications (notification_id SERIAL PRIMARY KEY, sender_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, alert_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (alert_type IN ('sos','general')), severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('critical','warning','info')), target_all BOOLEAN NOT NULL DEFAULT true, target_city VARCHAR(100), send_push BOOLEAN NOT NULL DEFAULT true, send_sms BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`;

    // Migrate existing TIMESTAMP column to TIMESTAMPTZ if it exists as plain TIMESTAMP
    await sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notifications'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
        ) THEN
          -- Treat existing stored values as NPT (UTC+5:45) and convert to UTC
          ALTER TABLE notifications
            ALTER COLUMN created_at TYPE TIMESTAMPTZ
            USING created_at AT TIME ZONE 'Asia/Kathmandu';
        END IF;
      END $$
    `.catch(e => console.warn('Migration note:', e.message));
    console.log('✅ notifications table ready');

    // indexes
    const idxList = [
      ['idx_blood_requests_requester',  'blood_requests(requester_id)'],
      ['idx_blood_requests_blood_group','blood_requests(blood_group)'],
      ['idx_blood_requests_urgency',    'blood_requests(urgency_level)'],
      ['idx_blood_requests_status',     'blood_requests(status)'],
      ['idx_blood_requests_city',       'blood_requests(hospital_city)'],
      ['idx_donation_responses_request','donation_responses(request_id)'],
      ['idx_donation_responses_donor',  'donation_responses(donor_id)'],
      ['idx_donation_events_organizer', 'donation_events(organizer_id)'],
      ['idx_donation_events_date',      'donation_events(event_date)'],
      ['idx_donation_events_city',      'donation_events(city)'],
      ['idx_campaigns_creator',         'campaigns(creator_id)'],
      ['idx_campaigns_status',          'campaigns(status)'],
      ['idx_chat_messages_created',     'chat_messages(created_at DESC)'],
      ['idx_notifications_created',     'notifications(created_at DESC)'],
      ['idx_notifications_type',        'notifications(alert_type)'],
      ['idx_notifications_city',        'notifications(target_city)'],
    ];
    for (const [name, cols] of idxList) {
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS ${name} ON ${cols}`);
    }

    console.log('\n✅ ✅ ✅  DATABASE READY  ✅ ✅ ✅');
    console.log('🔔 Notifications route: /api/notifications');
    console.log('🛡️  Admin route:         /api/admin\n');

  } catch (error) {
    console.error('❌ Database init error:', error.message);
    if (!error.message.includes('already exists')) process.exit(1);
  }
}

initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📲 Ngrok URL: https://valery-bridgeless-undesignedly.ngrok-free.dev`); // kept for reference
        console.log(`📍 API Base URL: http://0.0.0.0:${PORT}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/`);
        console.log(`✨ Community features enabled!`);
        console.log(`\n🎯 Ready to accept requests!\n`);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://0.0.0.0:${PORT}\n`);
  });
}).catch(err => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});