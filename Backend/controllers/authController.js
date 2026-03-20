// Backend/controllers/authController.js
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { sql } from '../config/db.js';

// ─── Helper: build a fresh JWT from the DB row ────────────────────────────────
// Always reads is_admin directly from the users table so the token
// is never stale even if admin rights were granted after last login.
const signToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      email:   user.email,
      is_admin: user.is_admin,   // live value from DB
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, password } = req.body;

    if (!full_name || !email || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const phoneRegex = /^98\d{8}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Use format: 98XXXXXXXX',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email} OR phone_number = ${phone_number}
    `;
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await sql`
      INSERT INTO users (full_name, email, phone_number, password_hash)
      VALUES (${full_name}, ${email}, ${phone_number}, ${password_hash})
      RETURNING user_id, full_name, email, phone_number, is_admin, created_at
    `;

    await sql`INSERT INTO user_profiles (user_id) VALUES (${newUser[0].user_id})`;

    const token = signToken(newUser[0]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: newUser[0], token },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Always fetch the FULL user row so is_admin is always fresh
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Sign token with live is_admin from DB — never stale
    const token = signToken(user);

    const profile = await sql`SELECT * FROM user_profiles WHERE user_id = ${user.user_id}`;

    delete user.password_hash;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { ...user, profile: profile[0] || null },
        token,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get current user profile ─────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const users = await sql`
      SELECT user_id, full_name, email, phone_number, is_admin,
             is_verified, is_active, created_at
      FROM users WHERE user_id = ${req.user.user_id}
    `;
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${req.user.user_id}
    `;

    res.status(200).json({
      success: true,
      data: { ...users[0], profile: profile[0] || null },
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── NEW: Refresh token endpoint ──────────────────────────────────────────────
// Call this after admin rights are granted so the app gets a fresh token
// without the user needing to log out. Frontend: GET /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    const users = await sql`
      SELECT user_id, full_name, email, phone_number, is_admin,
             is_verified, is_active, created_at
      FROM users WHERE user_id = ${req.user.user_id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user  = users[0];
    const token = signToken(user);  // fresh token with current is_admin

    const profile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${user.user_id}
    `;

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user:  { ...user, profile: profile[0] || null },
        token,
      },
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const {
      full_name, phone_number, date_of_birth, gender, address, city,
      blood_group, willing_to_donate_blood, last_donation_date,
      available_to_donate, willing_to_volunteer, volunteer_skills,
      volunteer_availability, emergency_contact_name, emergency_contact_phone,
      medical_conditions, allergies, location_lat, location_lng,
    } = req.body;

    if (full_name || phone_number) {
      await sql`
        UPDATE users
        SET full_name    = COALESCE(${full_name},    full_name),
            phone_number = COALESCE(${phone_number}, phone_number),
            updated_at   = NOW()
        WHERE user_id = ${req.user.user_id}
      `;
    }

    await sql`
      UPDATE user_profiles SET
        date_of_birth           = COALESCE(${date_of_birth},           date_of_birth),
        gender                  = COALESCE(${gender},                  gender),
        address                 = COALESCE(${address},                 address),
        city                    = COALESCE(${city},                    city),
        blood_group             = COALESCE(${blood_group},             blood_group),
        willing_to_donate_blood = COALESCE(${willing_to_donate_blood}, willing_to_donate_blood),
        last_donation_date      = COALESCE(${last_donation_date},      last_donation_date),
        available_to_donate     = COALESCE(${available_to_donate},     available_to_donate),
        willing_to_volunteer    = COALESCE(${willing_to_volunteer},    willing_to_volunteer),
        volunteer_skills        = COALESCE(${volunteer_skills},        volunteer_skills),
        volunteer_availability  = COALESCE(${volunteer_availability},  volunteer_availability),
        emergency_contact_name  = COALESCE(${emergency_contact_name},  emergency_contact_name),
        emergency_contact_phone = COALESCE(${emergency_contact_phone}, emergency_contact_phone),
        medical_conditions      = COALESCE(${medical_conditions},      medical_conditions),
        allergies               = COALESCE(${allergies},               allergies),
        location_lat            = COALESCE(${location_lat},            location_lat),
        location_lng            = COALESCE(${location_lng},            location_lng),
        updated_at              = NOW()
      WHERE user_id = ${req.user.user_id}
    `;

    const updatedUser    = await sql`
      SELECT user_id, full_name, email, phone_number, is_admin, created_at
      FROM users WHERE user_id = ${req.user.user_id}
    `;
    const updatedProfile = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${req.user.user_id}
    `;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { ...updatedUser[0], profile: updatedProfile[0] },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const users = await sql`SELECT * FROM users WHERE user_id = ${req.user.user_id}`;
    const isPasswordValid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt            = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    await sql`
      UPDATE users SET password_hash = ${new_password_hash}, updated_at = NOW()
      WHERE user_id = ${req.user.user_id}
    `;

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Send verification email ──────────────────────────────────────────────────
export const sendVerificationEmail = async (req, res) => {
  try {
    const users = await sql`
      SELECT user_id, full_name, email, is_verified
      FROM users WHERE user_id = ${req.user.user_id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      UPDATE users
      SET verification_token         = ${token},
          verification_token_expires = ${expires}
      WHERE user_id = ${user.user_id}
    `;

    const NGROK_URL       = process.env.NGROK_URL || 'https://malachi-inconvertible-lita.ngrok-free.dev';
    const verificationUrl = `${NGROK_URL}/api/auth/verify-email?token=${token}&userId=${user.user_id}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"AshaSetu" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'Verify your email — AshaSetu',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
          <div style="background:#8B0000;padding:28px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">Verify Your Email</h1>
          </div>
          <div style="padding:32px">
            <p style="color:#333;font-size:15px">Hi <strong>${user.full_name}</strong>,</p>
            <p style="color:#555;font-size:14px;line-height:1.6">
              Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${verificationUrl}"
                 style="background:#8B0000;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block">
                Verify Email
              </a>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;margin-top:20px">
              Or copy this link:<br>
              <span style="color:#0066cc;word-break:break-all">${verificationUrl}</span>
            </p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

// ─── Verify email via link click ──────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).send(verifyPage(false, 'Invalid verification link.'));
    }

    const users = await sql`
      SELECT * FROM users
      WHERE user_id = ${userId}
        AND verification_token = ${token}
        AND verification_token_expires > NOW()
    `;

    if (users.length === 0) {
      return res.status(400).send(
        verifyPage(false, 'This link is invalid or has expired. Please request a new one from the app.')
      );
    }

    if (users[0].is_verified) {
      return res.send(verifyPage(true, 'Your email is already verified!'));
    }

    await sql`
      UPDATE users
      SET is_verified               = true,
          verification_token        = NULL,
          verification_token_expires = NULL
      WHERE user_id = ${userId}
    `;

    res.send(verifyPage(true, 'Your email has been verified! You can now return to the app.'));
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send(verifyPage(false, 'Something went wrong. Please try again.'));
  }
};

const verifyPage = (success, message) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>${success ? 'Email Verified' : 'Verification Failed'}</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body{font-family:Arial,sans-serif;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
        .card{background:#fff;border-radius:16px;padding:48px 36px;text-align:center;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,0.1)}
        .icon{font-size:56px;margin-bottom:16px}
        h1{color:${success ? '#4caf50' : '#f44336'};margin:0 0 12px}
        p{color:#555;font-size:15px;line-height:1.6}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${success ? '✅' : '❌'}</div>
        <h1>${success ? 'Email Verified!' : 'Verification Failed'}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>
`;