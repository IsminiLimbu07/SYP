import { sql } from '../config/db.js';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  savePushToken,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Multer Configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path to avoid confusion
    const dir = path.join(process.cwd(), 'uploads/profiles'); 
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  // ...

  filename: (req, file, cb) => {
    const userId = req.user?.user_id || 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `user_${userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// ── Routes ───────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// ── THE UPLOAD ROUTE ────────────────────────────────────────────────────────
// authRoutes.js - replace the upload route section with this:

// ── THE UPLOAD ROUTE ────────────────────────────────────────────────────────
router.post('/upload-profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    console.log("📸 Upload request received for User ID:", req.user?.user_id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.user_id;
    // Use the same NGROK_URL that works for all your other endpoints
    const baseUrl = process.env.BASE_URL || 'https://tularaemic-electroneutral-ozella.ngrok-free.dev';
    const publicUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    console.log("🔗 Attempting DB Save for URL:", publicUrl);

    // Update or insert the profile picture
    const updated = await sql`
      UPDATE user_profiles
      SET profile_picture_url = ${publicUrl},
          updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING profile_picture_url
    `;

    if (updated.length === 0) {
      console.log("ℹ️ Creating new profile row...");
      await sql`
        INSERT INTO user_profiles (user_id, profile_picture_url, updated_at)
        VALUES (${userId}, ${publicUrl}, NOW())
      `;
    }

    // Return success with the new URL
    return res.status(200).json({
      success: true,
      data: { profile_picture_url: publicUrl }
    });

  } catch (error) {
    console.error('❌ UPLOAD ERROR:', error);
    // Always return JSON, never HTML
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
});
// ── Other Auth Routes ────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.post('/send-verification', authenticateToken, sendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh-token', refreshToken);
router.put('/users/push-token', authenticateToken, savePushToken);

export default router;