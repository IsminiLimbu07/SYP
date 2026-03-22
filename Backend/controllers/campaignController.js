import { sql } from '../config/db.js';

// ─── Create a new campaign (any logged-in user, starts as pending) ────────────
export const createCampaign = async (req, res) => {
    try {
        const {
            patient_name,
            age,
            condition,
            hospital_name,
            city,
            target_amount,
            deadline,
            story,
            image_url,
        } = req.body;

        if (!patient_name || !condition || !hospital_name || !city || !target_amount || !deadline || !story) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: patient_name, condition, hospital_name, city, target_amount, deadline, story',
            });
        }

        if (target_amount < 1000) {
            return res.status(400).json({
                success: false,
                message: 'Target amount must be at least Rs. 1,000',
            });
        }

        // status defaults to 'pending' — admin must approve before it goes live
        const newCampaign = await sql`
            INSERT INTO campaigns (
                creator_id, patient_name, age, condition, hospital_name,
                city, target_amount, deadline, story, image_url, status
            )
            VALUES (
                ${req.user.user_id},
                ${patient_name},
                ${age || null},
                ${condition},
                ${hospital_name},
                ${city},
                ${target_amount},
                ${deadline},
                ${story},
                ${image_url || null},
                'pending'
            )
            RETURNING *
        `;

        const creator = await sql`
            SELECT user_id, full_name, phone_number FROM users WHERE user_id = ${req.user.user_id}
        `;

        res.status(201).json({
            success: true,
            message: 'Campaign submitted successfully! It will go live after admin review.',
            data: { ...newCampaign[0], creator: creator[0] },
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Get all APPROVED campaigns (public feed) ─────────────────────────────────
export const getAllCampaigns = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const campaigns = await sql`
            SELECT
                c.*,
                u.full_name AS creator_name,
                u.phone_number AS creator_phone,
                COALESCE(SUM(d.amount), 0)::int AS raised_amount,
                COUNT(d.donation_id)::int AS donor_count
            FROM campaigns c
            JOIN users u ON c.creator_id = u.user_id
            LEFT JOIN campaign_donations d ON c.campaign_id = d.campaign_id AND d.status = 'completed'
            WHERE c.status = 'active'
            GROUP BY c.campaign_id, u.full_name, u.phone_number
            ORDER BY c.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
        console.error('Error getting campaigns:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Get single campaign by ID ────────────────────────────────────────────────
export const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await sql`
            SELECT
                c.*,
                u.full_name AS creator_name,
                u.phone_number AS creator_phone,
                COALESCE(SUM(d.amount), 0)::int AS raised_amount,
                COUNT(d.donation_id)::int AS donor_count
            FROM campaigns c
            JOIN users u ON c.creator_id = u.user_id
            LEFT JOIN campaign_donations d ON c.campaign_id = d.campaign_id AND d.status = 'completed'
            WHERE c.campaign_id = ${id}
            GROUP BY c.campaign_id, u.full_name, u.phone_number
        `;

        if (campaign.length === 0) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        res.status(200).json({ success: true, data: campaign[0] });
    } catch (error) {
        console.error('Error getting campaign:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Get the logged-in user's own campaigns (all statuses) ───────────────────
export const getMyCampaigns = async (req, res) => {
    try {
        const campaigns = await sql`
            SELECT
                c.*,
                COALESCE(SUM(d.amount), 0)::int AS raised_amount,
                COUNT(d.donation_id)::int AS donor_count
            FROM campaigns c
            LEFT JOIN campaign_donations d ON c.campaign_id = d.campaign_id AND d.status = 'completed'
            WHERE c.creator_id = ${req.user.user_id}
            GROUP BY c.campaign_id
            ORDER BY c.created_at DESC
        `;

        res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
        console.error('Error getting my campaigns:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── ADMIN: Get all pending campaigns ────────────────────────────────────────
export const getPendingCampaigns = async (req, res) => {
    try {
        const campaigns = await sql`
            SELECT
                c.*,
                u.full_name AS creator_name,
                u.phone_number AS creator_phone,
                u.email AS creator_email
            FROM campaigns c
            JOIN users u ON c.creator_id = u.user_id
            WHERE c.status = 'pending'
            ORDER BY c.created_at DESC
        `;

        res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
        console.error('Error getting pending campaigns:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── ADMIN: Get all campaigns (all statuses) ──────────────────────────────────
export const getAllCampaignsAdmin = async (req, res) => {
    try {
        const campaigns = await sql`
            SELECT
                c.*,
                u.full_name AS creator_name,
                u.phone_number AS creator_phone,
                u.email AS creator_email,
                COALESCE(SUM(d.amount), 0)::int AS raised_amount,
                COUNT(d.donation_id)::int AS donor_count
            FROM campaigns c
            JOIN users u ON c.creator_id = u.user_id
            LEFT JOIN campaign_donations d ON c.campaign_id = d.campaign_id AND d.status = 'completed'
            GROUP BY c.campaign_id, u.full_name, u.phone_number, u.email
            ORDER BY c.created_at DESC
        `;

        res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
        console.error('Error getting all campaigns (admin):', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── ADMIN: Approve a campaign ────────────────────────────────────────────────
export const approveCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${id}`;
        if (campaign.length === 0) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        if (campaign[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: `Campaign is already ${campaign[0].status}` });
        }

        const updated = await sql`
            UPDATE campaigns
            SET
                status = 'active',
                reviewed_by = ${req.user.user_id},
                reviewed_at = CURRENT_TIMESTAMP,
                admin_notes = ${admin_notes || null}
            WHERE campaign_id = ${id}
            RETURNING *
        `;

        res.status(200).json({
            success: true,
            message: 'Campaign approved and is now live!',
            data: updated[0],
        });
    } catch (error) {
        console.error('Error approving campaign:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── ADMIN: Reject a campaign ─────────────────────────────────────────────────
export const rejectCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason, admin_notes } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ success: false, message: 'rejection_reason is required' });
        }

        const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${id}`;
        if (campaign.length === 0) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        if (campaign[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: `Campaign is already ${campaign[0].status}` });
        }

        const updated = await sql`
            UPDATE campaigns
            SET
                status = 'rejected',
                reviewed_by = ${req.user.user_id},
                reviewed_at = CURRENT_TIMESTAMP,
                rejection_reason = ${rejection_reason},
                admin_notes = ${admin_notes || null}
            WHERE campaign_id = ${id}
            RETURNING *
        `;

        res.status(200).json({
            success: true,
            message: 'Campaign rejected.',
            data: updated[0],
        });
    } catch (error) {
        console.error('Error rejecting campaign:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Record a donation (payment placeholder) ──────────────────────────────────
export const recordDonation = async (req, res) => {
    try {
        const { campaign_id, amount, donor_name } = req.body;

        if (!campaign_id || !amount || amount < 10) {
            return res.status(400).json({
                success: false,
                message: 'campaign_id and amount (min Rs. 10) are required',
            });
        }

        const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaign_id}`;
        if (campaign.length === 0) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        if (campaign[0].status !== 'active') {
            return res.status(400).json({ success: false, message: 'Donations are only accepted for active campaigns' });
        }

        const donation = await sql`
            INSERT INTO campaign_donations (campaign_id, donor_id, donor_name, amount, status)
            VALUES (
                ${campaign_id},
                ${req.user.user_id},
                ${donor_name || null},
                ${amount},
                'pending'
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            message: 'Donation recorded. Complete payment to finalise.',
            data: donation[0],
        });
    } catch (error) {
        console.error('Error recording donation:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};