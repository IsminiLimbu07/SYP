import express from 'express';
import {
  getAllUsers,
  getUserById,
  deleteUser,
  toggleUserStatus,
  toggleAdminRole,
} from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
// GET    /api/admin/users           — list all users with profile info
router.get('/users', authenticateToken, isAdmin, getAllUsers);

// GET    /api/admin/users/:id       — single user detail
router.get('/users/:id', authenticateToken, isAdmin, getUserById);

// DELETE /api/admin/users/:id       — delete user (cascades)
router.delete('/users/:id', authenticateToken, isAdmin, deleteUser);

// PATCH  /api/admin/users/:id/status — toggle active/suspended
router.patch('/users/:id/status', authenticateToken, isAdmin, toggleUserStatus);

// PATCH  /api/admin/users/:id/role   — promote/demote admin
router.patch('/users/:id/role', authenticateToken, isAdmin, toggleAdminRole);

export default router;