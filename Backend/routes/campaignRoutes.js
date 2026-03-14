import express from 'express';
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    getMyCampaigns,
    recordDonation,
} from '../controllers/campaignController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all active campaigns
router.get('/', authenticateToken, getAllCampaigns);

// GET my campaigns
router.get('/my-campaigns', authenticateToken, getMyCampaigns);

// GET single campaign
router.get('/:id', authenticateToken, getCampaignById);

// POST create campaign
router.post('/', authenticateToken, createCampaign);

// POST record donation (payment placeholder)
router.post('/donate', authenticateToken, recordDonation);

export default router;