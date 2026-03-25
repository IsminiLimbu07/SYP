import { sql } from './config/db.js';

async function checkEvents() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM donation_events`;
    console.log('Events in database:', result[0].count);

    if (result[0].count > 0) {
      console.log('Database has existing events. Schema update may be needed.');
      // Show a sample event to see current structure
      const sample = await sql`SELECT * FROM donation_events LIMIT 1`;
      if (sample.length > 0) {
        console.log('Sample event structure:', Object.keys(sample[0]));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkEvents();