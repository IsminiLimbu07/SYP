// ============================================
// UPDATED server.js - Add volunteer tables to initDB()
// ============================================

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
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js'; // ✅ NEW

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    // ✅ NEW: Add volunteer status columns to user_profiles
    // This uses "ADD COLUMN IF NOT EXISTS" so it won't break if columns already exist
    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_status VARCHAR(20) DEFAULT 'none' 
        CHECK (volunteer_status IN ('none', 'pending', 'approved', 'rejected'))
    `;

    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_requested_at TIMESTAMP
    `;

    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_approved_at TIMESTAMP
    `;

    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_approved_by INTEGER REFERENCES users(user_id)
    `;

    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS volunteer_rejection_reason TEXT
    `;

    // ✅ NEW: Table 3: Volunteer Applications ────────────────────────────────
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

    // ✅ NEW: Create indexes for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status 
      ON volunteer_applications(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_volunteer_applications_user_id 
      ON volunteer_applications(user_id)
    `;

    // ── Table 4: Blood Requests ─────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS blood_requests (
        request_id SERIAL PRIMARY KEY,
        requester_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        blood_group VARCHAR(5) NOT NULL,
        units_needed INTEGER NOT NULL,
        urgency_level VARCHAR(20) CHECK (urgency_level IN ('critical', 'urgent', 'moderate')),
        hospital_name VARCHAR(255),
        hospital_address TEXT,
        contact_number VARCHAR(20) NOT NULL,
        additional_notes TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fulfilled_at TIMESTAMP
      )
    `;

    // ── Table 5: Donation Responses ─────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donation_responses (
        response_id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES blood_requests(request_id) ON DELETE CASCADE,
        donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        response_status VARCHAR(20) DEFAULT 'pending' 
          CHECK (response_status IN ('pending', 'accepted', 'completed', 'declined')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 6: Donation Events ────────────────────────────────────────────
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

    // ── Table 7: Event Participants ─────────────────────────────────────────
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

    // ── Table 8: Event Ratings ──────────────────────────────────────────────
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

    // ── Table 9: Chat Messages ──────────────────────────────────────────────
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

    // ── Table 10: Fundraising Campaigns ─────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS fundraising_campaigns (
        campaign_id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        story TEXT,
        target_amount DECIMAL(10, 2) NOT NULL,
        amount_raised DECIMAL(10, 2) DEFAULT 0,
        medical_documents TEXT[],
        photos TEXT[],
        hospital_name VARCHAR(255),
        deadline TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' 
          CHECK (status IN ('pending_approval', 'active', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 11: Campaign Donations ────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_donations (
        donation_id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES fundraising_campaigns(campaign_id) ON DELETE CASCADE,
        donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        is_anonymous BOOLEAN DEFAULT false,
        message TEXT,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Table 12: Notifications ─────────────────────────────────────────────
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
    console.log('✅ Volunteer application system tables created!');

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
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      blood: '/api/blood',
      donors: '/api/donors',
      community: '/api/community',
      chat: '/api/chat',
      campaigns: '/api/campaigns',
      notifications: '/api/notifications',
      admin: '/api/admin',
      volunteer: '/api/volunteer', // ✅ NEW
      upload: '/api/upload',
    }
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volunteer', volunteerRoutes); // ✅ NEW
app.use('/api/upload', uploadRoutes);

// ============================================
// START SERVER
// ============================================

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/`);
    console.log(`🩸 Blood requests: http://localhost:${PORT}/api/blood/requests`);
    console.log(`👥 Volunteer system: http://localhost:${PORT}/api/volunteer`);
  });
});

export default app;


// ============================================
// EXPLANATION OF HOW THIS WORKS
// ============================================

/*
🔍 Why this approach is better for your team:

1. **Automatic Setup**
   - When teammate clones repo from GitHub
   - Runs `npm install`
   - Runs `npm run dev`
   - Database tables are created automatically!

2. **Version Control**
   - SQL changes are in Git
   - Everyone gets same database structure
   - No manual steps needed

3. **Safe Updates**
   - "ADD COLUMN IF NOT EXISTS" won't break if column exists
   - "CREATE TABLE IF NOT EXISTS" won't break if table exists
   - Can run multiple times safely

4. **Team Collaboration**
   - Person A adds a new table
   - Commits to GitHub
   - Person B pulls the code
   - Their database updates automatically!

5. **No Manual SQL Required**
   - No need to open Neon dashboard
   - No need to copy-paste SQL
   - Just `git pull` and `npm run dev`


🎯 What happens when you start the server:

1. Server starts
2. initDB() runs
3. Creates all tables (if they don't exist)
4. Adds new columns (if they don't exist)
5. Creates indexes
6. Server ready!

Output you'll see:
🔧 Initializing database...
✅ Database initialized successfully!
✅ Volunteer application system tables created!
🚀 Server running on port 9000
📍 API Base URL: http://localhost:9000
👥 Volunteer system: http://localhost:9000/api/volunteer


⚠️ IMPORTANT NOTES:

1. First time running:
   - Creates all tables
   - Takes 2-3 seconds

2. Subsequent runs:
   - Checks if tables exist
   - Adds only missing columns
   - Takes < 1 second

3. If you need to reset:
   - Go to Neon dashboard
   - Delete specific tables
   - Restart server
   - Tables recreate automatically

4. Best practice:
   - Never manually edit database in production
   - Always update server.js
   - Let code manage database structure
*/