// Backend/routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  refreshToken,          // ← NEW
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);
router.get('/verify-email', verifyEmail);   // clicked from email link

// ── Protected routes ──────────────────────────────────────────────────────────
router.get('/profile',         authenticateToken, getProfile);
router.put('/profile',         authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Email verification
router.post('/send-verification-email', authenticateToken, sendVerificationEmail);

// Refresh token — returns a brand-new JWT with current is_admin from DB
// Call this after admin rights are granted so the app updates without logout
router.post('/refresh-token', authenticateToken, refreshToken);  // ← NEW

export default router;