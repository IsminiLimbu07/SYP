import { sql } from '../config/db.js';

export const isApprovedVolunteer = async (req, res, next) => {
    try {
        const userId = req.user.user_id;

        const profile = await sql`
            SELECT volunteer_status 
            FROM user_profiles 
            WHERE user_id = ${userId}
        `;

        if (profile.length === 0 || profile[0].volunteer_status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Only approved volunteers can perform this action'
            });
        }

        next();
    } catch (error) {
        console.error('Volunteer middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

