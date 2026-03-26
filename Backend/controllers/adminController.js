import { sql } from '../config/db.js';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { search, role, verified } = req.query;

        let users = await sql`
            SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                u.phone_number, 
                u.is_admin, 
                u.is_verified, 
                u.is_active, 
                u.created_at,
                p.blood_group,
                p.city,
                p.gender
            FROM users u
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            ORDER BY u.created_at DESC
        `;

        // Filter in JS (simpler and avoids dynamic SQL issues)
        if (search) {
            const q = search.toLowerCase();
            users = users.filter(u =>
                u.full_name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone_number?.includes(q)
            );
        }

        if (role === 'admin') users = users.filter(u => u.is_admin);
        if (role === 'user') users = users.filter(u => !u.is_admin);
        if (verified === 'true') users = users.filter(u => u.is_verified);
        if (verified === 'false') users = users.filter(u => !u.is_verified);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

// Get single user
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const users = await sql`
            SELECT 
                u.user_id, u.full_name, u.email, u.phone_number,
                u.is_admin, u.is_verified, u.is_active, u.created_at,
                p.blood_group, p.city, p.gender, p.date_of_birth,
                p.emergency_contact_name, p.emergency_contact_phone,
                p.medical_conditions, p.allergies
            FROM users u
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            WHERE u.user_id = ${userId}
        `;

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get activity stats from tables that actually exist
        const bloodRequests = await sql`
            SELECT COUNT(*) as count FROM blood_requests WHERE requester_id = ${userId}
        `;
        const donationResponses = await sql`
            SELECT COUNT(*) as count FROM donation_responses WHERE donor_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            data: {
                ...users[0],
                stats: {
                    total_blood_requests: parseInt(bloodRequests[0].count),
                    total_donation_responses: parseInt(donationResponses[0].count),
                }
            }
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await sql`
            SELECT user_id, full_name, is_admin FROM users WHERE user_id = ${userId}
        `;

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (parseInt(userId) === req.user.user_id) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        // Delete from tables that actually exist, in correct order
        await sql`DELETE FROM event_ratings WHERE user_id = ${userId}`;
        await sql`DELETE FROM event_participants WHERE user_id = ${userId}`;
        await sql`DELETE FROM chat_messages WHERE sender_id = ${userId}`;
        await sql`DELETE FROM donation_responses WHERE donor_id = ${userId}`;
        await sql`DELETE FROM blood_requests WHERE requester_id = ${userId}`;
        await sql`DELETE FROM donation_events WHERE organizer_id = ${userId}`;
        await sql`DELETE FROM user_profiles WHERE user_id = ${userId}`;
        await sql`DELETE FROM users WHERE user_id = ${userId}`;

        res.status(200).json({
            success: true,
            message: `User ${user[0].full_name} deleted successfully`
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;

        const user = await sql`
            SELECT user_id, full_name FROM users WHERE user_id = ${userId}
        `;

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (parseInt(userId) === req.user.user_id) {
            return res.status(400).json({ success: false, message: "Cannot change your own status" });
        }

        await sql`
            UPDATE users SET is_active = ${is_active}, updated_at = NOW()
            WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: `User ${is_active ? 'activated' : 'suspended'} successfully`
        });

    } catch (error) {
        console.error("Error toggling user status:", error);
        res.status(500).json({ success: false, message: "Failed to update user status" });
    }
};

// Dashboard stats
export const getDashboardStats = async (req, res) => {
    try {
        const userStats = await sql`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_admin = true THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_users_week
            FROM users
        `;

        const bloodStats = await sql`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_requests,
                SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_requests
            FROM blood_requests
        `;

        const eventStats = await sql`
            SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming_events
            FROM donation_events
        `;

        res.status(200).json({
            success: true,
            data: {
                users: userStats[0],
                blood_requests: bloodStats[0],
                events: eventStats[0],
            }
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics" });
    }
};

// Get all pending volunteer applications
export const getPendingVolunteerApplications = async (req, res) => {
    try {
        const applications = await sql`
            SELECT
                va.*,
                u.full_name,
                u.email,
                u.phone_number,
                up.blood_group,
                up.city
            FROM volunteer_applications va
            JOIN users u ON va.user_id = u.user_id
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE va.status = 'pending'
            ORDER BY va.created_at DESC
        `;

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error('Error fetching pending applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
};

// Get all volunteers (approved)
export const getAllVolunteers = async (req, res) => {
    try {
        const volunteers = await sql`
            SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                up.blood_group,
                up.city,
                up.volunteer_status,
                up.volunteer_approved_at,
                va.skills,
                va.reason
            FROM users u
            JOIN user_profiles up ON u.user_id = up.user_id
            LEFT JOIN volunteer_applications va ON u.user_id = va.user_id AND va.status = 'approved'
            WHERE up.volunteer_status = 'approved'
            ORDER BY up.volunteer_approved_at DESC
        `;

        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers
        });

    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch volunteers'
        });
    }
};

// Approve volunteer application
export const approveVolunteer = async (req, res) => {
    try {
        const { userId } = req.params;
        const { admin_notes } = req.body;
        const adminId = req.user.user_id;

        // Check if application exists
        const application = await sql`
            SELECT * FROM volunteer_applications
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        if (application.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending application found for this user'
            });
        }

        // Update application status
        await sql`
            UPDATE volunteer_applications
            SET status = 'approved',
                reviewed_by = ${adminId},
                reviewed_at = NOW(),
                admin_notes = ${admin_notes || null}
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        // Update user profile
        await sql`
            UPDATE user_profiles
            SET volunteer_status = 'approved',
                volunteer_approved_at = NOW(),
                volunteer_approved_by = ${adminId}
            WHERE user_id = ${userId}
        `;

        // Ensure users table volunteer flag is synced for create-event permission checks
        await sql`
            UPDATE users
            SET is_volunteer = true,
                volunteer_since = NOW(),
                updated_at = NOW()
            WHERE user_id = ${userId}
        `;

        // Get user info for response
        const user = await sql`
            SELECT full_name, email FROM users WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: `${user[0].full_name} approved as volunteer`
        });

    } catch (error) {
        console.error('Error approving volunteer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve volunteer'
        });
    }
};

// Reject volunteer application
export const rejectVolunteer = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rejection_reason, admin_notes } = req.body;
        const adminId = req.user.user_id;

        if (!rejection_reason || rejection_reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rejection reason'
            });
        }

        // Check if application exists
        const application = await sql`
            SELECT * FROM volunteer_applications
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        if (application.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending application found for this user'
            });
        }

        // Update application status
        await sql`
            UPDATE volunteer_applications
            SET status = 'rejected',
                reviewed_by = ${adminId},
                reviewed_at = NOW(),
                admin_notes = ${admin_notes || null}
            WHERE user_id = ${userId} AND status = 'pending'
        `;

        // Update user profile
        await sql`
            UPDATE user_profiles
            SET volunteer_status = 'rejected',
                volunteer_rejection_reason = ${rejection_reason}
            WHERE user_id = ${userId}
        `;

        // Get user info for response
        const user = await sql`
            SELECT full_name FROM users WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: `${user[0].full_name}'s application rejected`
        });

    } catch (error) {
        console.error('Error rejecting volunteer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject application'
        });
    }
};

// Revoke volunteer status
export const revokeVolunteerStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Update user profile
        await sql`
            UPDATE user_profiles
            SET volunteer_status = 'none',
                volunteer_approved_at = NULL,
                volunteer_approved_by = NULL,
                volunteer_rejection_reason = ${reason || 'Status revoked by admin'}
            WHERE user_id = ${userId}
        `;

        // Mark user record as non-volunteer too
        await sql`
            UPDATE users
            SET is_volunteer = false,
                updated_at = NOW()
            WHERE user_id = ${userId}
        `;

        // Update latest approved application to revoked status
        await sql`
            UPDATE volunteer_applications
            SET status = 'rejected',
                admin_notes = ${reason || 'Status revoked by admin'}
            WHERE user_id = ${userId} AND status = 'approved'
        `;

        const user = await sql`
            SELECT full_name FROM users WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: `Volunteer status revoked for ${user[0].full_name}`
        });

    } catch (error) {
        console.error('Error revoking volunteer status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke volunteer status'
        });
    }
};