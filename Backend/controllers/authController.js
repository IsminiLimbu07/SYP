import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { full_name, email, phone_number, password } = req.body;

        // Validate required fields
        if (!full_name || !email || !phone_number || !password) {
            return res.status(400).json({ 
                success: false,
                message: "All fields are required" 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format" 
            });
        }

        // Validate phone number (Nepal format)
        const phoneRegex = /^98\d{8}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid phone number. Use format: 98XXXXXXXX" 
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: "Password must be at least 6 characters" 
            });
        }

        // Check if user already exists
        const existingUser = await sql`
            SELECT * FROM users 
            WHERE email = ${email} OR phone_number = ${phone_number}
        `;

        if (existingUser.length > 0) {
            return res.status(409).json({ 
                success: false,
                message: "User with this email or phone already exists" 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await sql`
            INSERT INTO users (full_name, email, phone_number, password_hash)
            VALUES (${full_name}, ${email}, ${phone_number}, ${password_hash})
            RETURNING user_id, full_name, email, phone_number, is_admin, created_at
        `;

        // Create empty profile for user
        await sql`
            INSERT INTO user_profiles (user_id)
            VALUES (${newUser[0].user_id})
        `;

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: newUser[0].user_id,
                email: newUser[0].email,
                is_admin: newUser[0].is_admin
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: newUser[0],
                token
            }
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email and password are required" 
            });
        }

        // Find user by email
        const users = await sql`
            SELECT * FROM users WHERE email = ${email}
        `;

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        const user = users[0];

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false,
                message: "Your account has been deactivated" 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id,
                email: user.email,
                is_admin: user.is_admin
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get user profile
        const profile = await sql`
            SELECT * FROM user_profiles WHERE user_id = ${user.user_id}
        `;

        // Remove password hash from response
        delete user.password_hash;

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    ...user,
                    profile: profile[0] || null
                },
                token
            }
        });

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        // Get user details
        const users = await sql`
            SELECT user_id, full_name, email, phone_number, is_admin, is_verified, is_active, created_at
            FROM users WHERE user_id = ${req.user.user_id}
        `;

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Get user profile
        const profile = await sql`
            SELECT * FROM user_profiles WHERE user_id = ${req.user.user_id}
        `;

        res.status(200).json({
            success: true,
            data: {
                ...users[0],
                profile: profile[0] || null
            }
        });

    } catch (error) {
        console.error("Error getting profile:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const {
            full_name,
            phone_number,
            date_of_birth,
            gender,
            address,
            city,
            blood_group,
            willing_to_donate_blood,
            last_donation_date,
            available_to_donate,
            willing_to_volunteer,
            volunteer_skills,
            volunteer_availability,
            emergency_contact_name,
            emergency_contact_phone,
            medical_conditions,
            allergies,
            location_lat,
            location_lng
        } = req.body;

        // Update basic user info if provided
        if (full_name || phone_number) {
            await sql`
                UPDATE users 
                SET 
                    full_name = COALESCE(${full_name}, full_name),
                    phone_number = COALESCE(${phone_number}, phone_number),
                    updated_at = NOW()
                WHERE user_id = ${req.user.user_id}
            `;
        }

        // Update user profile
        await sql`
            UPDATE user_profiles
            SET 
                date_of_birth = COALESCE(${date_of_birth}, date_of_birth),
                gender = COALESCE(${gender}, gender),
                address = COALESCE(${address}, address),
                city = COALESCE(${city}, city),
                blood_group = COALESCE(${blood_group}, blood_group),
                willing_to_donate_blood = COALESCE(${willing_to_donate_blood}, willing_to_donate_blood),
                last_donation_date = COALESCE(${last_donation_date}, last_donation_date),
                available_to_donate = COALESCE(${available_to_donate}, available_to_donate),
                willing_to_volunteer = COALESCE(${willing_to_volunteer}, willing_to_volunteer),
                volunteer_skills = COALESCE(${volunteer_skills}, volunteer_skills),
                volunteer_availability = COALESCE(${volunteer_availability}, volunteer_availability),
                emergency_contact_name = COALESCE(${emergency_contact_name}, emergency_contact_name),
                emergency_contact_phone = COALESCE(${emergency_contact_phone}, emergency_contact_phone),
                medical_conditions = COALESCE(${medical_conditions}, medical_conditions),
                allergies = COALESCE(${allergies}, allergies),
                location_lat = COALESCE(${location_lat}, location_lat),
                location_lng = COALESCE(${location_lng}, location_lng),
                updated_at = NOW()
            WHERE user_id = ${req.user.user_id}
        `;

        // Get updated profile
        const updatedUser = await sql`
            SELECT user_id, full_name, email, phone_number, is_admin, created_at
            FROM users WHERE user_id = ${req.user.user_id}
        `;

        const updatedProfile = await sql`
            SELECT * FROM user_profiles WHERE user_id = ${req.user.user_id}
        `;

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                ...updatedUser[0],
                profile: updatedProfile[0]
            }
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ 
                success: false,
                message: "Current password and new password are required" 
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: "New password must be at least 6 characters" 
            });
        }

        // Get user
        const users = await sql`
            SELECT * FROM users WHERE user_id = ${req.user.user_id}
        `;

        // Verify current password
        const isPasswordValid = await bcrypt.compare(current_password, users[0].password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Current password is incorrect" 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(new_password, salt);

        // Update password
        await sql`
            UPDATE users 
            SET password_hash = ${new_password_hash}, updated_at = NOW()
            WHERE user_id = ${req.user.user_id}
        `;

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};
