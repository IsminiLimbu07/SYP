import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { sql } from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import bloodRoutes from './routes/bloodRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static files (images, uploads) ─────────────────────────────────────
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

const PORT = process.env.PORT || 9000;

// ============================================
// INITIALIZE DATABASE TABLES
// ============================================
async function initDB() {
  try {
    console.log('🔧 Initializing database...');

    // ── Table 1: Users ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_otp VARCHAR(6),
        reset_otp_expiry TIMESTAMP,
        reset_otp_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 2: User Profiles ──────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        profile_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        date_of_birth DATE,
        gender VARCHAR(20),
        profile_picture_url TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        address TEXT,
        city VARCHAR(100),
        blood_group VARCHAR(5),
        willing_to_donate_blood BOOLEAN DEFAULT false,
        last_donation_date DATE,
        available_to_donate BOOLEAN DEFAULT true,
        willing_to_volunteer BOOLEAN DEFAULT false,
        volunteer_skills TEXT[],
        volunteer_availability VARCHAR(20) DEFAULT 'available',
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        medical_conditions TEXT,
        allergies TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Volunteer status columns
    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_status VARCHAR(20) DEFAULT 'none' 
        CHECK (volunteer_status IN ('none', 'pending', 'approved', 'rejected'))
    `;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS volunteer_requested_at TIMESTAMP`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS volunteer_approved_at TIMESTAMP`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS volunteer_approved_by INTEGER REFERENCES users(user_id)`;
    await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS volunteer_rejection_reason TEXT`;

    // ── Table 3: Volunteer Applications ────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS volunteer_applications (
        application_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        skills TEXT[] NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' 
          CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by INTEGER REFERENCES users(user_id),
        reviewed_at TIMESTAMP,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteer_applications_user_id ON volunteer_applications(user_id)`;

    // ── Table 4: Blood Requests (REDESIGNED - Deadline-based) ───────────────
    // Schema v2.0: Explicit deadline model with automatic expiration
    await sql`
      CREATE TABLE IF NOT EXISTS blood_requests (
        request_id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        blood_group VARCHAR(5) NOT NULL,
        units_needed INTEGER NOT NULL CHECK (units_needed >= 1 AND units_needed <= 20),
        urgency_level VARCHAR(20) NOT NULL 
          CHECK (urgency_level IN ('critical', 'urgent', 'moderate')),
        hospital_name VARCHAR(255) NOT NULL,
        hospital_address TEXT,
        hospital_city VARCHAR(100) NOT NULL,
        hospital_contact VARCHAR(20) NOT NULL,
        description TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        status VARCHAR(20) DEFAULT 'active' 
          CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
        deadline TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fulfilled_at TIMESTAMP
      )
    `;

    // Indexes for efficient querying
    await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_deadline ON blood_requests(deadline)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON blood_requests(requester_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency_level)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_active ON blood_requests(status, deadline) WHERE status = 'active'`;

    // ── Table 5: Donation Responses ──────────────────────────────────────────
    // Renamed from response_status to status for clarity
    await sql`
      CREATE TABLE IF NOT EXISTS donation_responses (
        donation_id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES blood_requests(request_id) ON DELETE CASCADE,
        donor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' 
          CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, donor_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_status ON donation_responses(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_request ON donation_responses(request_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_donor ON donation_responses(donor_id)`;

    // ── Table 6: Donation Events ─────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donation_events (
        event_id SERIAL PRIMARY KEY,
        organizer_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        event_date TIMESTAMP NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        address TEXT,
        max_participants INTEGER,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'upcoming' 
          CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 7: Event Participants ──────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS event_participants (
        participant_id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        registration_status VARCHAR(20) DEFAULT 'registered' 
          CHECK (registration_status IN ('registered', 'attended', 'cancelled')),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `;

    // ── Table 8: Event Ratings ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS event_ratings (
        rating_id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `;

    // ── Table 9: Chat Messages ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        message_id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        channel VARCHAR(100) DEFAULT 'general',
        message_type VARCHAR(20) DEFAULT 'text' 
          CHECK (message_type IN ('text', 'image', 'location', 'document')),
        content TEXT NOT NULL,
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 10: Campaigns ──────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        campaign_id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        age INTEGER,
        condition VARCHAR(255) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        target_amount DECIMAL(10, 2) NOT NULL,
        deadline TIMESTAMP NOT NULL,
        story TEXT NOT NULL,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'active', 'completed', 'rejected', 'cancelled')),
        reviewed_by INTEGER REFERENCES users(user_id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id)`;

    // ── Table 11: Campaign Donations ─────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_donations (
        donation_id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
        donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        donor_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'completed', 'failed')),
        is_anonymous BOOLEAN DEFAULT false,
        message TEXT,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 12: Notifications ──────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Database initialized successfully!');
    console.log('✅ Deadline-based blood request system ready!');
    console.log('✅ Volunteer application system ready!');
    console.log('✅ Campaign approval system ready!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'AshaSetu API Server is running 🚀',
    version: '2.0.0',
    system: 'Deadline-based Blood Request System',
    endpoints: {
      auth:          '/api/auth',
      blood:         '/api/blood',
      donors:        '/api/donors',
      community:     '/api/community',
      chat:          '/api/chat',
      campaigns:     '/api/campaigns',
      payment:       '/api/payment',
      notifications: '/api/notifications',
      admin:         '/api/admin',
      volunteer:     '/api/volunteer',
      upload:        '/api/upload',
    }
  });
});

app.use('/api/auth',          authRoutes);
app.use('/api/blood',         bloodRoutes);
app.use('/api/donors',        donorRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/campaigns',     campaignRoutes);
app.use('/api/payment',       paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/volunteer',     volunteerRoutes);
app.use('/api/upload',        uploadRoutes);

// ============================================
// START SERVER
// ============================================

initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📲 Ngrok URL:  https://tularaemic-electroneutral-ozella.ngrok-free.dev`); 
        console.log(`📍 API Base URL: http://0.0.0.0:${PORT}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/`);
        console.log(`✨ Community features enabled!`);
        console.log(`\n🎯 Ready to accept requests!\n`);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
