import { sql } from '../config/db.js';

// Create a donation response (user responds to a blood request)
export const createDonationResponse = async (req, res) => {
    try {
        const { request_id, message } = req.body;

        // Validate required fields
        if (!request_id) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        // Check if blood request exists and is active
        const bloodRequest = await sql`
            SELECT * FROM blood_requests 
            WHERE request_id = ${request_id}
        `;

        if (bloodRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood request not found"
            });
        }

        if (bloodRequest[0].status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "This blood request is no longer active"
            });
        }

        // Check if user is trying to respond to their own request
        if (bloodRequest[0].requester_id === req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: "You cannot respond to your own blood request"
            });
        }

        // Check if user has already responded to this request
        const existingResponse = await sql`
            SELECT * FROM donation_responses 
            WHERE request_id = ${request_id} AND donor_id = ${req.user.user_id}
        `;

        if (existingResponse.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You have already responded to this blood request"
            });
        }

        // Create donation response
        const newResponse = await sql`
            INSERT INTO donation_responses (
                request_id,
                donor_id,
                message
            )
            VALUES (
                ${request_id},
                ${req.user.user_id},
                ${message || null}
            )
            RETURNING *
        `;

        // Get donor details
        const donor = await sql`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                up.blood_group,
                up.last_donation_date
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE u.user_id = ${req.user.user_id}
        `;

        res.status(201).json({
            success: true,
            message: "Donation response submitted successfully",
            data: {
                ...newResponse[0],
                donor: donor[0]
            }
        });

    } catch (error) {
        console.error("Error creating donation response:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all donation responses for a specific blood request
export const getDonationResponsesByRequestId = async (req, res) => {
    try {
        const { requestId } = req.params;

        // Check if blood request exists
        const bloodRequest = await sql`
            SELECT * FROM blood_requests WHERE request_id = ${requestId}
        `;

        if (bloodRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood request not found"
            });
        }

        // Check if user is the requester or admin
        if (bloodRequest[0].requester_id !== req.user.user_id && !req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view these responses"
            });
        }

        // Get all donation responses
        const responses = await sql`
            SELECT 
                dr.*,
                u.full_name as donor_name,
                u.email as donor_email,
                u.phone_number as donor_phone,
                up.blood_group as donor_blood_group,
                up.last_donation_date,
                up.address as donor_address,
                up.city as donor_city
            FROM donation_responses dr
            JOIN users u ON dr.donor_id = u.user_id
            LEFT JOIN user_profiles up ON dr.donor_id = up.user_id
            WHERE dr.request_id = ${requestId}
            ORDER BY 
                CASE dr.status
                    WHEN 'confirmed' THEN 1
                    WHEN 'pending' THEN 2
                    WHEN 'cancelled' THEN 3
                END,
                dr.created_at DESC
        `;

        res.status(200).json({
            success: true,
            data: responses
        });

    } catch (error) {
        console.error("Error getting donation responses:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update donation response status (confirm or cancel)
export const updateDonationResponse = async (req, res) => {
    try {
        const { donationId } = req.params;
        const { status, message } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: pending, confirmed, cancelled"
            });
        }

        // Get donation response
        const donationResponse = await sql`
            SELECT dr.*, br.requester_id
            FROM donation_responses dr
            JOIN blood_requests br ON dr.request_id = br.request_id
            WHERE dr.donation_id = ${donationId}
        `;

        if (donationResponse.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Donation response not found"
            });
        }

        const response = donationResponse[0];

        // Check permissions
        // Requester or admin can confirm donors
        // Donor can cancel their own response
        const isRequester = response.requester_id === req.user.user_id;
        const isDonor = response.donor_id === req.user.user_id;
        const isAdmin = req.user.is_admin;

        if (!isRequester && !isDonor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this response"
            });
        }

        // Donors can only cancel their own responses
        if (isDonor && !isRequester && !isAdmin && status && status !== 'cancelled') {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own donation response"
            });
        }

        // Requesters can only confirm or update pending/confirmed responses
        if (isRequester && !isAdmin && status === 'cancelled' && response.donor_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: "Only the donor can cancel their response"
            });
        }

        // Update donation response
        const updatedResponse = await sql`
            UPDATE donation_responses
            SET
                status = COALESCE(${status}, status),
                message = COALESCE(${message}, message),
                updated_at = NOW()
            WHERE donation_id = ${donationId}
            RETURNING *
        `;

        // Get donor details
        const donor = await sql`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.phone_number,
                up.blood_group
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE u.user_id = ${updatedResponse[0].donor_id}
        `;

        res.status(200).json({
            success: true,
            message: "Donation response updated successfully",
            data: {
                ...updatedResponse[0],
                donor: donor[0]
            }
        });

    } catch (error) {
        console.error("Error updating donation response:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get user's own donation responses
export const getMyDonationResponses = async (req, res) => {
    try {
        const responses = await sql`
            SELECT 
                dr.*,
                br.blood_group,
                br.units_needed,
                br.urgency_level,
                br.patient_name,
                br.hospital_name,
                br.hospital_city,
                br.needed_by_date,
                br.status as request_status,
                u.full_name as requester_name,
                u.phone_number as requester_phone
            FROM donation_responses dr
            JOIN blood_requests br ON dr.request_id = br.request_id
            JOIN users u ON br.requester_id = u.user_id
            WHERE dr.donor_id = ${req.user.user_id}
            ORDER BY dr.created_at DESC
        `;

        res.status(200).json({
            success: true,
            data: responses
        });

    } catch (error) {
        console.error("Error getting user's donation responses:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Delete donation response (cancel before requester sees)
export const deleteDonationResponse = async (req, res) => {
    try {
        const { donationId } = req.params;

        // Get donation response
        const donationResponse = await sql`
            SELECT * FROM donation_responses WHERE donation_id = ${donationId}
        `;

        if (donationResponse.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Donation response not found"
            });
        }

        // Only donor or admin can delete
        if (donationResponse[0].donor_id !== req.user.user_id && !req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this response"
            });
        }

        // Delete response
        await sql`
            DELETE FROM donation_responses WHERE donation_id = ${donationId}
        `;

        res.status(200).json({
            success: true,
            message: "Donation response deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting donation response:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};