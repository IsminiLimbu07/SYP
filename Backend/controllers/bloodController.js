import { sql } from '../config/db.js';

// Create a new blood request
export const createBloodRequest = async (req, res) => {
    try {
        const {
            blood_group,
            units_needed,
            urgency_level,
            patient_name,
            hospital_name,
            hospital_address,
            hospital_city,
            hospital_contact,
            needed_by_date,
            description,
            location_lat,
            location_lng
        } = req.body;

        // Validate required fields
        if (!blood_group || !units_needed || !urgency_level || !patient_name || !hospital_name || !needed_by_date) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: blood_group, units_needed, urgency_level, patient_name, hospital_name, needed_by_date"
            });
        }

        // Validate blood group
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(blood_group)) {
            return res.status(400).json({
                success: false,
                message: "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"
            });
        }

        // Validate urgency level
        const validUrgencyLevels = ['critical', 'urgent', 'normal'];
        if (!validUrgencyLevels.includes(urgency_level)) {
            return res.status(400).json({
                success: false,
                message: "Invalid urgency level. Must be one of: critical, urgent, normal"
            });
        }

        // Validate units_needed
        if (units_needed < 1 || units_needed > 20) {
            return res.status(400).json({
                success: false,
                message: "Units needed must be between 1 and 20"
            });
        }

        // Create blood request
        const newRequest = await sql`
            INSERT INTO blood_requests (
                requester_id,
                blood_group,
                units_needed,
                urgency_level,
                patient_name,
                hospital_name,
                hospital_address,
                hospital_city,
                hospital_contact,
                needed_by_date,
                description,
                location_lat,
                location_lng
            )
            VALUES (
                ${req.user.user_id},
                ${blood_group},
                ${units_needed},
                ${urgency_level},
                ${patient_name},
                ${hospital_name},
                ${hospital_address || null},
                ${hospital_city || null},
                ${hospital_contact || null},
                ${needed_by_date},
                ${description || null},
                ${location_lat || null},
                ${location_lng || null}
            )
            RETURNING *
        `;

        // Get requester details
        const requester = await sql`
            SELECT user_id, full_name, email, phone_number
            FROM users
            WHERE user_id = ${req.user.user_id}
        `;

        res.status(201).json({
            success: true,
            message: "Blood request created successfully",
            data: {
                ...newRequest[0],
                requester: requester[0]
            }
        });

    } catch (error) {
        console.error("Error creating blood request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all blood requests (with filters)
export const getAllBloodRequests = async (req, res) => {
    try {
        const { 
            blood_group, 
            urgency_level, 
            status, 
            city,
            limit = 50,
            offset = 0
        } = req.query;

        let query = sql`
            SELECT 
                br.*,
                u.full_name as requester_name,
                u.email as requester_email,
                u.phone_number as requester_phone,
                (
                    SELECT COUNT(*)::int 
                    FROM donation_responses 
                    WHERE request_id = br.request_id AND status != 'cancelled'
                ) as total_responses,
                (
                    SELECT COUNT(*)::int 
                    FROM donation_responses 
                    WHERE request_id = br.request_id AND status = 'confirmed'
                ) as confirmed_donors
            FROM blood_requests br
            JOIN users u ON br.requester_id = u.user_id
            WHERE 1=1
        `;

        // Apply filters
        if (blood_group) {
            query = sql`${query} AND br.blood_group = ${blood_group}`;
        }
        if (urgency_level) {
            query = sql`${query} AND br.urgency_level = ${urgency_level}`;
        }
        if (status) {
            query = sql`${query} AND br.status = ${status}`;
        }
        if (city) {
            query = sql`${query} AND br.hospital_city ILIKE ${'%' + city + '%'}`;
        }

        query = sql`
            ${query}
            ORDER BY 
                CASE br.urgency_level
                    WHEN 'critical' THEN 1
                    WHEN 'urgent' THEN 2
                    WHEN 'normal' THEN 3
                END,
                br.created_at DESC
            LIMIT ${parseInt(limit)}
            OFFSET ${parseInt(offset)}
        `;

        const requests = await query;

        // Get total count
        let countQuery = sql`
            SELECT COUNT(*)::int as total
            FROM blood_requests br
            WHERE 1=1
        `;

        if (blood_group) {
            countQuery = sql`${countQuery} AND br.blood_group = ${blood_group}`;
        }
        if (urgency_level) {
            countQuery = sql`${countQuery} AND br.urgency_level = ${urgency_level}`;
        }
        if (status) {
            countQuery = sql`${countQuery} AND br.status = ${status}`;
        }
        if (city) {
            countQuery = sql`${countQuery} AND br.hospital_city ILIKE ${'%' + city + '%'}`;
        }

        const totalCount = await countQuery;

        res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                total: totalCount[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalCount[0].total
            }
        });

    } catch (error) {
        console.error("Error getting blood requests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get single blood request by ID
export const getBloodRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await sql`
            SELECT 
                br.*,
                u.full_name as requester_name,
                u.email as requester_email,
                u.phone_number as requester_phone
            FROM blood_requests br
            JOIN users u ON br.requester_id = u.user_id
            WHERE br.request_id = ${id}
        `;

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood request not found"
            });
        }

        // Get donation responses for this request
        const responses = await sql`
            SELECT 
                dr.*,
                u.full_name as donor_name,
                u.email as donor_email,
                u.phone_number as donor_phone,
                up.blood_group as donor_blood_group
            FROM donation_responses dr
            JOIN users u ON dr.donor_id = u.user_id
            LEFT JOIN user_profiles up ON dr.donor_id = up.user_id
            WHERE dr.request_id = ${id}
            ORDER BY dr.created_at DESC
        `;

        res.status(200).json({
            success: true,
            data: {
                ...request[0],
                donation_responses: responses
            }
        });

    } catch (error) {
        console.error("Error getting blood request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update blood request
export const updateBloodRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists and belongs to user
        const existingRequest = await sql`
            SELECT * FROM blood_requests WHERE request_id = ${id}
        `;

        if (existingRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood request not found"
            });
        }

        // Check ownership (unless admin)
        if (existingRequest[0].requester_id !== req.user.user_id && !req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this request"
            });
        }

        const {
            blood_group,
            units_needed,
            urgency_level,
            patient_name,
            hospital_name,
            hospital_address,
            hospital_city,
            hospital_contact,
            needed_by_date,
            description,
            status,
            location_lat,
            location_lng
        } = req.body;

        // Validate blood group if provided
        if (blood_group) {
            const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            if (!validBloodGroups.includes(blood_group)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid blood group"
                });
            }
        }

        // Validate urgency level if provided
        if (urgency_level) {
            const validUrgencyLevels = ['critical', 'urgent', 'normal'];
            if (!validUrgencyLevels.includes(urgency_level)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid urgency level"
                });
            }
        }

        // Validate status if provided
        if (status) {
            const validStatuses = ['active', 'fulfilled', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status"
                });
            }
        }

        // Update request
        const updatedRequest = await sql`
            UPDATE blood_requests
            SET
                blood_group = COALESCE(${blood_group}, blood_group),
                units_needed = COALESCE(${units_needed}, units_needed),
                urgency_level = COALESCE(${urgency_level}, urgency_level),
                patient_name = COALESCE(${patient_name}, patient_name),
                hospital_name = COALESCE(${hospital_name}, hospital_name),
                hospital_address = COALESCE(${hospital_address}, hospital_address),
                hospital_city = COALESCE(${hospital_city}, hospital_city),
                hospital_contact = COALESCE(${hospital_contact}, hospital_contact),
                needed_by_date = COALESCE(${needed_by_date}, needed_by_date),
                description = COALESCE(${description}, description),
                status = COALESCE(${status}, status),
                location_lat = COALESCE(${location_lat}, location_lat),
                location_lng = COALESCE(${location_lng}, location_lng),
                updated_at = NOW()
            WHERE request_id = ${id}
            RETURNING *
        `;

        res.status(200).json({
            success: true,
            message: "Blood request updated successfully",
            data: updatedRequest[0]
        });

    } catch (error) {
        console.error("Error updating blood request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Delete blood request
export const deleteBloodRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists
        const existingRequest = await sql`
            SELECT * FROM blood_requests WHERE request_id = ${id}
        `;

        if (existingRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood request not found"
            });
        }

        // Check ownership (unless admin)
        if (existingRequest[0].requester_id !== req.user.user_id && !req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this request"
            });
        }

        // Delete request (cascade will delete donation responses)
        await sql`
            DELETE FROM blood_requests WHERE request_id = ${id}
        `;

        res.status(200).json({
            success: true,
            message: "Blood request deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting blood request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get user's own blood requests
export const getMyBloodRequests = async (req, res) => {
    try {
        const requests = await sql`
            SELECT 
                br.*,
                (
                    SELECT COUNT(*)::int 
                    FROM donation_responses 
                    WHERE request_id = br.request_id AND status != 'cancelled'
                ) as total_responses,
                (
                    SELECT COUNT(*)::int 
                    FROM donation_responses 
                    WHERE request_id = br.request_id AND status = 'confirmed'
                ) as confirmed_donors
            FROM blood_requests br
            WHERE br.requester_id = ${req.user.user_id}
            ORDER BY br.created_at DESC
        `;

        res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error("Error getting user's blood requests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};