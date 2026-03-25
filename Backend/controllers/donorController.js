import { sql } from '../config/db.js';

export const getAllDonors = async (req, res) => {
  try {
    const donors = await sql`
      SELECT
        u.user_id,
        u.full_name,
        p.blood_group,
        p.city,
        p.profile_picture_url,
        p.available_to_donate,
        p.willing_to_donate_blood
      FROM users u
      JOIN user_profiles p ON p.user_id = u.user_id
      WHERE u.is_active = true
      ORDER BY u.created_at DESC
    `;

    res.status(200).json({ success: true, data: donors });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};