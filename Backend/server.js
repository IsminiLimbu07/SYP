import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bloodRoutes from './routes/bloodRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';


dotenv.config(); // ← moved to top so .env loads before anything uses it

const app = express();

// Make sure the uploads directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const eventsUploadsDir = path.join(uploadsDir, 'events');
fs.mkdirSync(eventsUploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/campaigns', campaignRoutes);

// Static file hosting for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/donors', donorRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 9000;

// Initialize Database Tables
async function initDB() {
    try {
        console.log('🔄 Initializing database...\n');

        // ========== STEP 1: Create users table ==========
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

        // ========== STEP 2: Add volunteer columns to existing table ==========
        console.log('📝 Adding volunteer columns to users table...');
        
        const existingColumns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('is_volunteer', 'volunteer_since', 'events_organized', 'total_donations')
        `;
        
        const existing = existingColumns.map(c => c.column_name);
        
        if (!existing.includes('is_volunteer')) {
            await sql`ALTER TABLE users ADD COLUMN is_volunteer BOOLEAN DEFAULT FALSE`;
            console.log('✅ Added is_volunteer column');
        } else {
            console.log('⚠️  is_volunteer column already exists');
        }

        if (!existing.includes('volunteer_since')) {
            await sql`ALTER TABLE users ADD COLUMN volunteer_since TIMESTAMP DEFAULT NULL`;
            console.log('✅ Added volunteer_since column');
        } else {
            console.log('⚠️  volunteer_since column already exists');
        }

        if (!existing.includes('events_organized')) {
            await sql`ALTER TABLE users ADD COLUMN events_organized INTEGER DEFAULT 0`;
            console.log('✅ Added events_organized column');
        } else {
            console.log('⚠️  events_organized column already exists');
        }

        if (!existing.includes('total_donations')) {
            await sql`ALTER TABLE users ADD COLUMN total_donations INTEGER DEFAULT 0`;
            console.log('✅ Added total_donations column');
        } else {
            console.log('⚠️  total_donations column already exists');
        }

        // ========== STEP 3: Add verification token columns ==========
        const verifyColumns = await sql`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('verification_token', 'verification_token_expires')
        `;
        const existingVerify = verifyColumns.map(c => c.column_name); // ← fixed typo

        if (!existingVerify.includes('verification_token')) {
            await sql`ALTER TABLE users ADD COLUMN verification_token VARCHAR(64)`;
            console.log('✅ Added verification_token column');
        } else {
            console.log('⚠️  verification_token column already exists');
        }

        if (!existingVerify.includes('verification_token_expires')) {
            await sql`ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMPTZ`;
            console.log('✅ Added verification_token_expires column');
        } else {
            console.log('⚠️  verification_token_expires column already exists');
        }

        console.log('');

        // User profiles table
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

        // Blood Requests table
        await sql`
            CREATE TABLE IF NOT EXISTS blood_requests (
                request_id SERIAL PRIMARY KEY,
                requester_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
                units_needed INTEGER NOT NULL CHECK (units_needed >= 1 AND units_needed <= 20),
                urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('critical', 'urgent', 'normal')),
                patient_name VARCHAR(255) NOT NULL,
                hospital_name VARCHAR(255) NOT NULL,
                hospital_address TEXT,
                hospital_city VARCHAR(100),
                hospital_contact VARCHAR(20),
                needed_by_date DATE NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
                location_lat DECIMAL(10, 8),
                location_lng DECIMAL(11, 8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Donation Responses table
        await sql`
            CREATE TABLE IF NOT EXISTS donation_responses (
                donation_id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES blood_requests(request_id) ON DELETE CASCADE,
                donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(request_id, donor_id)
            )
        `;

        // ==================== COMMUNITY FEATURE TABLES ====================
        
        console.log('📝 Creating community tables...');

        await sql`
            CREATE TABLE IF NOT EXISTS donation_events (
                event_id SERIAL PRIMARY KEY,
                organizer_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                location VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                address TEXT,
                contact_number VARCHAR(20),
                image_url TEXT,
                max_participants INTEGER,
                current_participants INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Created donation_events table');

        await sql`
            CREATE TABLE IF NOT EXISTS event_participants (
                participant_id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                blood_group VARCHAR(5),
                status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_id, user_id)
            )
        `;
        console.log('✅ Created event_participants table');

        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                message_text TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'event_share', 'system')),
                image_url TEXT,
                event_id INTEGER REFERENCES donation_events(event_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Created chat_messages table');

        await sql`
            CREATE TABLE IF NOT EXISTS event_ratings (
                rating_id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES donation_events(event_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_id, user_id)
            )
        `;
        console.log('✅ Created event_ratings table\n');

        // ==================== CREATE INDEXES ====================
        console.log('📝 Creating indexes...');

        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON blood_requests(requester_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency_level)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_city ON blood_requests(hospital_city)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_request ON donation_responses(request_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_donor ON donation_responses(donor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_status ON donation_responses(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_events_organizer ON donation_events(organizer_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_events_date ON donation_events(event_date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_events_status ON donation_events(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_events_city ON donation_events(city)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_event_ratings_event ON event_ratings(event_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_event_ratings_user ON event_ratings(user_id)`;

        console.log('✅ All indexes created\n');

  // ==================== CREATE Campaign  ====================
        await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
        campaign_id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        age INTEGER,
        condition VARCHAR(255) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        target_amount INTEGER NOT NULL CHECK (target_amount >= 1000),
        deadline DATE NOT NULL,
        story TEXT NOT NULL,
        image_url TEXT,
        verified BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;
console.log('✅ Created campaigns table');

        await sql`
            CREATE TABLE IF NOT EXISTS campaign_donations (
                donation_id SERIAL PRIMARY KEY,
                campaign_id INTEGER REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
                donor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                donor_name VARCHAR(255),
                amount INTEGER NOT NULL CHECK (amount >= 10),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
                transaction_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Created campaign_donations table');

        await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_campaign_donations_campaign ON campaign_donations(campaign_id)`;

        // ========== VERIFY COLUMNS EXIST ==========
        console.log('🔍 Verifying database structure...');
        
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('is_volunteer', 'volunteer_since', 'events_organized', 'total_donations')
            ORDER BY column_name
        `;
        
        if (columns.length === 4) {
            console.log('✅ All volunteer columns present:');
            columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
        } else {
            console.log('⚠️  Missing columns:', columns.length, '/4 found');
        }

        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('donation_events', 'event_participants', 'chat_messages', 'event_ratings')
            ORDER BY table_name
        `;
        
        if (tables.length === 4) {
            console.log('✅ All community tables present:');
            tables.forEach(t => console.log(`   - ${t.table_name}`));
        } else {
            console.log('⚠️  Missing tables:', tables.length, '/4 found');
        }

        console.log('\n✅ ✅ ✅ DATABASE READY! ✅ ✅ ✅');
        console.log('✨ Community features are enabled!\n');

    } catch (error) {
        console.error("\n❌ Error initializing database:", error);
        console.error("Error details:", error.message);
        
        if (error.message.includes('column') && error.message.includes('already exists')) {
            console.log('\n⚠️  Some columns already exist - this is OK!');
            console.log('✅ Continuing with server startup...\n');
        } else {
            process.exit(1);
        }
    }
}

// Routes
app.get("/", (req, res) => {
    res.json({ 
        message: "AshaSetu API Server is running 🚀",
        version: "2.0.0",
        endpoints: {
            auth: "/api/auth",
            blood: "/api/blood",
            community: "/api/community",
            chat: "/api/chat",
            health: "/"
        },
        features: {
            bloodRequests: "Create and respond to blood requests",
            donationResponses: "Manage donation offers",
            communityEvents: "Organize blood donation events",
            chatroom: "Connect with donors and volunteers"
        }
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/blood", bloodRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
        availableEndpoints: {
            auth: "/api/auth",
            blood: "/api/blood",
            community: "/api/community",
            chat: "/api/chat"
        }
    });
});

// Start server
initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        // console.log(`📲 Ngrok URL: https://tularaemic-electroneutral-ozella.ngrok-free.dev`); // kept for reference
        console.log(`📍 API Base URL: http://0.0.0.0:${PORT}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/`);
        console.log(`✨ Community features enabled!`);
        console.log(`\n🎯 Ready to accept requests!\n`);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});