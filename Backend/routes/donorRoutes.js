import express from 'express';
import { sql } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/donors?blood=A+&city=Janakpur&search=name
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { blood, city, search } = req.query;
    const term = (city || search || '').toLowerCase().trim();

    const donors = await sql`
      SELECT
        u.user_id,
        u.full_name,
        u.phone_number,
        p.blood_group,
        p.city,
        p.profile_picture_url,
        p.willing_to_donate_blood,
        p.available_to_donate
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.is_active = true
        AND (
          ${blood ? sql`p.blood_group = ${blood}` : sql`true`}
        )
        AND (
          ${term ? sql`(
            LOWER(COALESCE(p.city, '')) LIKE ${'%' + term + '%'}
            OR LOWER(u.full_name) LIKE ${'%' + term + '%'}
          )` : sql`true`}
        )
      ORDER BY u.created_at DESC
    `;

    return res.status(200).json({ success: true, data: donors });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch donors' });
  }
});

// GET /api/donors/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      SELECT
        u.user_id, u.full_name, u.phone_number, u.email,
        p.blood_group,
        p.city,
        p.profile_picture_url,
        p.willing_to_donate_blood,
        p.available_to_donate
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.user_id = ${id}
    `;
    if (result.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error fetching donor by id:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

export default router;