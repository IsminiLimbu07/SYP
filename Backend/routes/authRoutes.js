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
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/register',   register);
router.post('/login',      login);
router.get('/verify-email', verifyEmail);

// ── Forgot password — all public (user is not logged in) ─────────────────────
router.post('/forgot-password',  forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password',   resetPassword);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get('/profile',         authenticateToken, getProfile);
router.put('/profile',         authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

router.post('/send-verification-email', authenticateToken, sendVerificationEmail);
router.post('/refresh-token',           authenticateToken, refreshToken);

export default router;