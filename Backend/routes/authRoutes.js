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
  uploadProfilePicture,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { uploadProfilePic } from '../middleware/uploadMiddleware.js';

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

// ── Error wrapper for async middleware ───────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('❌ Async handler error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  });
};

// ── Profile picture upload (with robust multer error handling) ───────────────
router.post('/upload-profile-picture', authenticateToken, (req, res, next) => {
  uploadProfilePic(req, res, function(err) {
    if (err) {
      console.error('❌ Multer upload error:', err.name, err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }
    console.log('✅ File uploaded successfully: ', req.file?.filename);
    next();
  });
}, asyncHandler(uploadProfilePicture));

export default router;