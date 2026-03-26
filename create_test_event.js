import { sql } from './Backend/config/db.js';

async function createTestEvent() {
  try {
    const result = await sql`
      INSERT INTO donation_events (
        organizer_id, title, description,
        event_date, start_time, end_time,
        location, city, address,
        contact_number, image_url, max_participants
      )
      VALUES (
        2, 'Test Blood Donation Camp', 'Test event for debugging',
        '2026-04-01', '10:00', '16:00',
        'Test Hospital', 'Kathmandu', 'Test Address',
        '9800000000', null, 50
      )
      RETURNING *
    `;

    console.log('Test event created:', result[0]);

    // Check total events
    const count = await sql`SELECT COUNT(*) as count FROM donation_events`;
    console.log('Total events:', count[0].count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestEvent();