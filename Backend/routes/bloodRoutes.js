import express from 'express';
import {
    createBloodRequest,
    getAllBloodRequests,
    getBloodRequestById,
    updateBloodRequest,
    deleteBloodRequest,
    getMyBloodRequests
} from '../controllers/bloodController.js';
import {
    createDonationResponse,
    getDonationResponsesByRequestId,
    updateDonationResponse,
    getMyDonationResponses,
    deleteDonationResponse
} from '../controllers/donationController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== BLOOD REQUEST ROUTES =====

// Create new blood request (Protected)
router.post('/request', authenticateToken, createBloodRequest);

// Get all blood requests with filters (Protected)
router.get('/requests', authenticateToken, getAllBloodRequests);

// Get user's own blood requests (Protected)
router.get('/my-requests', authenticateToken, getMyBloodRequests);

// Get single blood request by ID (Protected)
router.get('/request/:id', authenticateToken, getBloodRequestById);

// Update blood request (Protected - Owner or Admin)
router.put('/request/:id', authenticateToken, updateBloodRequest);

// Delete blood request (Protected - Owner or Admin)
router.delete('/request/:id', authenticateToken, deleteBloodRequest);

// ===== DONATION RESPONSE ROUTES =====

// Create donation response (Protected)
router.post('/respond', authenticateToken, createDonationResponse);

// Get all donation responses for a request (Protected - Requester or Admin)
router.get('/respond/:requestId', authenticateToken, getDonationResponsesByRequestId);

// Get user's own donation responses (Protected)
router.get('/my-responses', authenticateToken, getMyDonationResponses);

// Update donation response status (Protected - Requester, Donor or Admin)
router.put('/respond/:donationId', authenticateToken, updateDonationResponse);

// Delete donation response (Protected - Donor or Admin)
router.delete('/respond/:donationId', authenticateToken, deleteDonationResponse);

export default router;