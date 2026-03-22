
import express from 'express';
import {
    applyAsVolunteer,
    getMyVolunteerStatus,
    cancelVolunteerApplication
} from '../controllers/volunteerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// User volunteer routes (all protected)
router.post('/apply', authenticateToken, applyAsVolunteer);
router.get('/my-status', authenticateToken, getMyVolunteerStatus);
router.delete('/cancel-application', authenticateToken, cancelVolunteerApplication);

export default router;