import express from 'express';
import dotenv from 'dotenv';
import { sql } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Middleware
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
            health: "/"
        }
    });
});

app.use("/api/auth", authRoutes);

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API Base URL: http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/`);
    });
});