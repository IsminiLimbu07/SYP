import express from 'express';
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    getMyCampaigns,
    recordDonation,
    getPendingCampaigns,
    getAllCampaignsAdmin,
    approveCampaign,
    rejectCampaign,
} from '../controllers/campaignController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Public (any logged-in user) ──────────────────────────────────────────────

// GET all ACTIVE campaigns (public feed)
router.get('/', authenticateToken, getAllCampaigns);

// GET my own campaigns (all statuses)
router.get('/my-campaigns', authenticateToken, getMyCampaigns);

// GET single campaign by ID
router.get('/:id', authenticateToken, getCampaignById);

// POST create a new campaign (any user — starts as pending)
router.post('/', authenticateToken, createCampaign);

// POST record donation
router.post('/donate', authenticateToken, recordDonation);

// ─── Admin only ───────────────────────────────────────────────────────────────

// GET all pending campaigns awaiting review
router.get('/admin/pending', authenticateToken, isAdmin, getPendingCampaigns);

// GET all campaigns (all statuses) — admin overview
router.get('/admin/all', authenticateToken, isAdmin, getAllCampaignsAdmin);

// PUT approve a campaign
router.put('/admin/:id/approve', authenticateToken, isAdmin, approveCampaign);

// PUT reject a campaign
router.put('/admin/:id/reject', authenticateToken, isAdmin, rejectCampaign);

export default router;