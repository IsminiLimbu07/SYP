import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sql } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bloodRoutes from './routes/bloodRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 9000;

// Initialize Database Tables
async function initDB() {
    try {
        // Users table
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

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON blood_requests(requester_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency_level)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_blood_requests_city ON blood_requests(hospital_city)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_request ON donation_responses(request_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_donor ON donation_responses(donor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_donation_responses_status ON donation_responses(status)`;

        console.log("✅ Database initialized successfully.");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}

// Routes
app.get("/", (req, res) => {
    res.json({ 
        message: "AshaSetu API Server is running 🚀",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            blood: "/api/blood",
            health: "/"
        }
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/blood", bloodRoutes);

// Start server
initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API Base URL: http://0.0.0.0:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/`);
        console.log(`📲 From phone: http://192.168.56.1:${PORT}`);
    });
});