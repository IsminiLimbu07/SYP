
import express from 'express';
import {
  getAllUsers,
  getUserById,
  deleteUser,
  toggleUserStatus,
  getDashboardStats,
  // Add new volunteer management imports
  getPendingVolunteerApplications,
  getAllVolunteers,
  approveVolunteer,
  rejectVolunteer,
  revokeVolunteerStatus,
} from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Existing user management routes
router.get('/users', authenticateToken, isAdmin, getAllUsers);
router.get('/users/:id', authenticateToken, isAdmin, getUserById);
router.delete('/users/:id', authenticateToken, isAdmin, deleteUser);
router.patch('/users/:id/status', authenticateToken, isAdmin, toggleUserStatus);
router.get('/dashboard/stats', authenticateToken, isAdmin, getDashboardStats);

// NEW: Volunteer management routes
router.get('/volunteers/pending', authenticateToken, isAdmin, getPendingVolunteerApplications);
router.get('/volunteers/all', authenticateToken, isAdmin, getAllVolunteers);
router.put('/volunteers/:userId/approve', authenticateToken, isAdmin, approveVolunteer);
router.put('/volunteers/:userId/reject', authenticateToken, isAdmin, rejectVolunteer);
router.delete('/volunteers/:userId/revoke', authenticateToken, isAdmin, revokeVolunteerStatus);

export default router;
