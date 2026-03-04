import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/donors
// Optional filters: ?blood=A+  or  ?city=Dharan
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { blood, city } = req.query;

    // We JOIN users + user_profiles to get all the info we need
    // We only return users who are willing to donate blood
    let donors;

   if (blood && city) {
  donors = await sql`
    SELECT u.user_id, u.full_name, u.phone_number,
      p.blood_group, p.city, p.profile_picture_url
    FROM users u
    LEFT JOIN user_profiles p ON u.user_id = p.user_id
    WHERE p.blood_group = ${blood}
    AND LOWER(p.city) LIKE ${'%' + city.toLowerCase() + '%'}
  `;
} else if (blood) {
  donors = await sql`
    SELECT u.user_id, u.full_name, u.phone_number,
      p.blood_group, p.city, p.profile_picture_url
    FROM users u
    LEFT JOIN user_profiles p ON u.user_id = p.user_id
    WHERE p.blood_group = ${blood}
  `;
} else if (city) {
  donors = await sql`
    SELECT u.user_id, u.full_name, u.phone_number,
      p.blood_group, p.city, p.profile_picture_url
    FROM users u
    LEFT JOIN user_profiles p ON u.user_id = p.user_id
    WHERE LOWER(p.city) LIKE ${'%' + city.toLowerCase() + '%'}
  `;
} else {
  donors = await sql`
    SELECT u.user_id, u.full_name, u.phone_number,
      p.blood_group, p.city, p.profile_picture_url
    FROM users u
    LEFT JOIN user_profiles p ON u.user_id = p.user_id
  `;
}
    return res.status(200).json({ success: true, data: donors });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch donors' });
  }
});
// in donorRoutes.js
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      SELECT u.user_id, u.full_name, u.phone_number, u.email,
        p.blood_group, p.city, p.profile_picture_url
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.user_id = ${id}
    `;
    if (result.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

export default router;