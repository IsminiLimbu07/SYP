import { sql } from '../config/db.js';

// Create a new campaign
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
            return res.status(400).json({ success: false, message: 'Target amount must be at least Rs. 1,000' });
        }

        const newCampaign = await sql`
            INSERT INTO campaigns (
                creator_id, patient_name, age, condition, hospital_name,
                city, target_amount, deadline, story, image_url
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
                ${image_url || null}
            )
            RETURNING *
        `;

        const creator = await sql`
            SELECT user_id, full_name, phone_number FROM users WHERE user_id = ${req.user.user_id}
        `;

        res.status(201).json({
            success: true,
            message: 'Campaign created successfully. It will be reviewed before going live.',
            data: { ...newCampaign[0], creator: creator[0] },
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all active campaigns
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

// Get single campaign by ID
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

// Get user's own campaigns
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

// Record a donation (without real payment — marks as pending)
export const recordDonation = async (req, res) => {
    try {
        const { campaign_id, amount, donor_name } = req.body;

        if (!campaign_id || !amount || amount < 10) {
            return res.status(400).json({ success: false, message: 'campaign_id and amount (min Rs. 10) are required' });
        }

        const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaign_id}`;
        if (campaign.length === 0) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
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