import { sql } from '../config/db.js';

// Apply to become a volunteer
export const applyAsVolunteer = async (req, res) => {
    try {
        const { skills, reason } = req.body;
        const userId = req.user.user_id;

        // Validation
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one skill'
            });
        }

        if (!reason || reason.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason (minimum 20 characters)'
            });
        }

        // Check if user already has pending or approved application
        const existingApp = await sql`
            SELECT * FROM volunteer_applications 
            WHERE user_id = ${userId} 
            AND status IN ('pending', 'approved')
        `;

        if (existingApp.length > 0) {
            const status = existingApp[0].status;
            return res.status(400).json({
                success: false,
                message: status === 'approved' 
                    ? 'You are already an approved volunteer'
                    : 'You already have a pending application'
            });
        }

        // Create application
        const application = await sql`
            INSERT INTO volunteer_applications (user_id, skills, reason)
            VALUES (${userId}, ${skills}, ${reason})
            RETURNING *
        `;

        // Update user profile status
        await sql`
            UPDATE user_profiles 
            SET volunteer_status = 'pending',
                volunteer_requested_at = NOW()
            WHERE user_id = ${userId}
        `;

        res.status(201).json({
            success: true,
            message: 'Volunteer application submitted successfully',
            data: application[0]
        });

    } catch (error) {
        console.error('Error applying as volunteer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application'
        });
    }
};

// Get user's volunteer status
export const getMyVolunteerStatus = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const profile = await sql`
            SELECT volunteer_status, volunteer_requested_at, 
                   volunteer_approved_at, volunteer_rejection_reason
            FROM user_profiles 
            WHERE user_id = ${userId}
        `;

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Get application details if exists
        const application = await sql`
            SELECT * FROM volunteer_applications 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 1
        `;

        res.status(200).json({
            success: true,
            data: {
                status: profile[0].volunteer_status,
                requested_at: profile[0].volunteer_requested_at,
                approved_at: profile[0].volunteer_approved_at,
                rejection_reason: profile[0].volunteer_rejection_reason,
                application: application[0] || null
            }
        });

    } catch (error) {
        console.error('Error getting volunteer status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get volunteer status'
        });
    }
};

// Cancel volunteer application
export const cancelVolunteerApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Check if pending application exists
        const application = await sql`
            SELECT * FROM volunteer_applications 
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        if (application.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending application found'
            });
        }

        // Delete application
        await sql`
            DELETE FROM volunteer_applications 
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        // Reset profile status
        await sql`
            UPDATE user_profiles 
            SET volunteer_status = 'none',
                volunteer_requested_at = NULL
            WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: 'Application cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel application'
        });
    }
};
