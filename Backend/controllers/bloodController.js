import { sql } from '../config/db.js';

/**
 * Calculate deadline based on urgency level
 * @param {string} urgencyLevel - 'critical' | 'urgent' | 'moderate'
 * @returns {Date} deadline timestamp
 */
const calculateDeadline = (urgencyLevel) => {
  const now = new Date();
  let hoursToAdd = 24; // default: critical

  switch (urgencyLevel) {
    case 'critical':
      hoursToAdd = 24; // 1 day
      break;
    case 'urgent':
      hoursToAdd = 72; // 3 days
      break;
    case 'moderate':
      hoursToAdd = 168; // 7 days
      break;
    default:
      hoursToAdd = 24;
  }

  const deadline = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  return deadline;
};

/**
 * Helper: Format time remaining for display
 * @param {Date} deadline
 * @returns {Object} { value, unit, isExpired }
 */
const getTimeRemaining = (deadline) => {
  const now = new Date();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return { value: 0, unit: 'expired', isExpired: true };
  }

  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return { value: diffHours, unit: 'hour', isExpired: false };
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { value: diffDays, unit: 'day', isExpired: false };
};

// ============================================
// CREATE BLOOD REQUEST (with automatic deadline)
// ============================================
export const createBloodRequest = async (req, res) => {
  try {
    const {
      blood_group,
      units_needed,
      urgency_level,
      patient_name,
      hospital_name,
      hospital_address,
      contact_number,
      description,
      location_lat,
      location_lng,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (
      !blood_group ||
      !units_needed ||
      !urgency_level ||
      !patient_name ||
      !hospital_name ||
      !contact_number
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: blood_group, units_needed, urgency_level, patient_name, hospital_name, contact_number',
      });
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(blood_group)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-',
      });
    }

    // Validate urgency level
    const validUrgencyLevels = ['critical', 'urgent', 'moderate'];
    if (!validUrgencyLevels.includes(urgency_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency level. Must be one of: critical, urgent, moderate',
      });
    }

    // Validate units
    if (units_needed < 1 || units_needed > 20) {
      return res.status(400).json({
        success: false,
        message: 'Units needed must be between 1 and 20',
      });
    }

    // ── Calculate deadline automatically ────────────────────────────────────
    const deadline = calculateDeadline(urgency_level);

    // ── Create blood request ────────────────────────────────────────────────
    const newRequest = await sql`
      INSERT INTO blood_requests (
        requester_id,
        patient_name,
        blood_group,
        units_needed,
        urgency_level,
        hospital_name,
        hospital_address,
        contact_number,
        description,
        location_lat,
        location_lng,
        deadline,
        status
      )
      VALUES (
        ${req.user.user_id},
        ${patient_name},
        ${blood_group},
        ${units_needed},
        ${urgency_level},
        ${hospital_name},
        ${hospital_address || null},
        ${contact_number},
        ${description || null},
        ${location_lat || null},
        ${location_lng || null},
        ${deadline},
        'active'
      )
      RETURNING *
    `;

    // Get requester details
    const requester = await sql`
      SELECT user_id, full_name, email, phone_number
      FROM users
      WHERE user_id = ${req.user.user_id}
    `;

    const timeRemaining = getTimeRemaining(newRequest[0].deadline);

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        ...newRequest[0],
        requester: requester[0],
        time_remaining: timeRemaining,
      },
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// GET ALL BLOOD REQUESTS (only active ones)
// ============================================
export const getAllBloodRequests = async (req, res) => {
  try {
    const { blood_group, urgency_level, limit = 50, offset = 0 } = req.query;

    // Build WHERE clause dynamically
    let whereConditions = 'br.status = \'active\' AND br.deadline > NOW()';

    if (blood_group) {
      whereConditions += ` AND br.blood_group = ${sql.unsafe(`'${blood_group}'`)}`;
    }
    if (urgency_level) {
      whereConditions += ` AND br.urgency_level = ${sql.unsafe(`'${urgency_level}'`)}`;
    }

    // Fetch requests with response counts
    const requests = await sql`
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
      WHERE ${sql.unsafe(whereConditions)}
      ORDER BY 
        CASE br.urgency_level
          WHEN 'critical' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'moderate' THEN 3
        END,
        br.deadline ASC,
        br.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM blood_requests br
      WHERE ${sql.unsafe(whereConditions)}
    `;

    // Attach time remaining to each request
    const enrichedRequests = requests.map((req) => ({
      ...req,
      time_remaining: getTimeRemaining(req.deadline),
    }));

    res.status(200).json({
      success: true,
      data: enrichedRequests,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < countResult[0].total,
      },
    });
  } catch (error) {
    console.error('Error getting blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// GET SINGLE BLOOD REQUEST BY ID
// ============================================
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
        message: 'Blood request not found',
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
        time_remaining: getTimeRemaining(request[0].deadline),
        donation_responses: responses,
      },
    });
  } catch (error) {
    console.error('Error getting blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// UPDATE BLOOD REQUEST
// ============================================
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
        message: 'Blood request not found',
      });
    }

    // Check ownership (unless admin)
    if (
      existingRequest[0].requester_id !== req.user.user_id &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this request",
      });
    }

    const {
      blood_group,
      units_needed,
      urgency_level,
      patient_name,
      hospital_name,
      hospital_address,
      contact_number,
      description,
      status,
      location_lat,
      location_lng,
    } = req.body;

    // Validate inputs if provided
    if (blood_group) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(blood_group)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid blood group',
        });
      }
    }

    if (urgency_level) {
      const validUrgencyLevels = ['critical', 'urgent', 'moderate'];
      if (!validUrgencyLevels.includes(urgency_level)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid urgency level',
        });
      }
    }

    if (status) {
      const validStatuses = ['active', 'fulfilled', 'cancelled', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
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
        contact_number = COALESCE(${contact_number}, contact_number),
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
      message: 'Blood request updated successfully',
      data: {
        ...updatedRequest[0],
        time_remaining: getTimeRemaining(updatedRequest[0].deadline),
      },
    });
  } catch (error) {
    console.error('Error updating blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// DELETE BLOOD REQUEST
// ============================================
export const deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest = await sql`
      SELECT * FROM blood_requests WHERE request_id = ${id}
    `;

    if (existingRequest.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    // Check ownership (unless admin)
    if (
      existingRequest[0].requester_id !== req.user.user_id &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this request",
      });
    }

    // Delete request (cascade will delete donation responses)
    await sql`
      DELETE FROM blood_requests WHERE request_id = ${id}
    `;

    res.status(200).json({
      success: true,
      message: 'Blood request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// GET USER'S OWN BLOOD REQUESTS
// ============================================
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

    const enrichedRequests = requests.map((req) => ({
      ...req,
      time_remaining: getTimeRemaining(req.deadline),
    }));

    res.status(200).json({
      success: true,
      data: enrichedRequests,
    });
  } catch (error) {
    console.error('Error getting user blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// MARK REQUEST AS FULFILLED
// ============================================
export const markRequestFulfilled = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest = await sql`
      SELECT * FROM blood_requests WHERE request_id = ${id}
    `;

    if (existingRequest.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    // Only requester or admin can mark as fulfilled
    if (
      existingRequest[0].requester_id !== req.user.user_id &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this request",
      });
    }

    const updatedRequest = await sql`
      UPDATE blood_requests
      SET 
        status = 'fulfilled',
        fulfilled_at = NOW(),
        updated_at = NOW()
      WHERE request_id = ${id}
      RETURNING *
    `;

    res.status(200).json({
      success: true,
      message: 'Blood request marked as fulfilled',
      data: {
        ...updatedRequest[0],
        time_remaining: getTimeRemaining(updatedRequest[0].deadline),
      },
    });
  } catch (error) {
    console.error('Error marking request as fulfilled:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};