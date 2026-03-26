// Run from project root: node check_events.js
// Diagnoses why events are not showing up
import { sql } from './Backend/config/db.js';

async function checkEvents() {
  try {
    console.log('\n📊 ── EVENT DIAGNOSTICS ──────────────────────────────\n');

    // 1. Total count
    const [total] = await sql`SELECT COUNT(*) AS count FROM donation_events`;
    console.log(`Total events in DB: ${total.count}`);

    if (parseInt(total.count) === 0) {
      console.log('\n❌ NO EVENTS IN DATABASE. Create one via the app first.\n');
      return;
    }

    // 2. DB server date vs your local date
    const [dbDate] = await sql`SELECT CURRENT_DATE AS today, NOW() AS now`;
    console.log(`\nDB server date : ${dbDate.today}`);
    console.log(`DB server time : ${dbDate.now}`);

    // 3. All events with their dates + status
    const events = await sql`
      SELECT event_id, title, event_date, status, city, organizer_id
      FROM donation_events
      ORDER BY event_date DESC
      LIMIT 20
    `;
    console.log('\nAll events (latest 20):');
    events.forEach(e => {
      const isPast = new Date(e.event_date) < new Date(dbDate.today);
      console.log(
        `  [${e.event_id}] "${e.title}" | date: ${e.event_date} | status: ${e.status} | city: ${e.city} ${isPast ? '⚠️  PAST DATE' : '✅ future'}`
      );
    });

    // 4. How many would the current query return?
    const upcomingNoDate = await sql`
      SELECT COUNT(*) AS count FROM donation_events WHERE status = 'upcoming'
    `;
    const upcomingWithDate = await sql`
      SELECT COUNT(*) AS count FROM donation_events
      WHERE status = 'upcoming' AND event_date >= CURRENT_DATE
    `;
    const upcomingRelaxed = await sql`
      SELECT COUNT(*) AS count FROM donation_events
      WHERE status = 'upcoming' AND event_date >= (CURRENT_DATE - INTERVAL '1 day')
    `;

    console.log('\n📊 Query comparison:');
    console.log(`  status='upcoming' only               : ${upcomingNoDate[0].count} rows`);
    console.log(`  status='upcoming' + date >= TODAY    : ${upcomingWithDate[0].count} rows  ← this is what the OLD code used`);
    console.log(`  status='upcoming' + date >= YESTERDAY: ${upcomingRelaxed[0].count} rows  ← new code uses this`);

    if (parseInt(upcomingWithDate[0].count) === 0 && parseInt(upcomingNoDate[0].count) > 0) {
      console.log('\n🎯 ROOT CAUSE CONFIRMED: Your events have past dates but status is still "upcoming".');
      console.log('   Fix: Update their dates OR run the SQL below to set them to future dates.\n');
      console.log('   Quick fix SQL (sets all upcoming events to 7 days from now):');
      console.log("   UPDATE donation_events SET event_date = CURRENT_DATE + INTERVAL '7 days' WHERE status = 'upcoming';\n");
    } else if (parseInt(upcomingNoDate[0].count) === 0) {
      console.log('\n🎯 ROOT CAUSE CONFIRMED: No events with status="upcoming" at all.');
      console.log('   The event was probably created with a different status or the status column has a typo.\n');
    } else {
      console.log('\n✅ Events look correct — they should be visible.');
      console.log('   Check that the city filter matches exactly (case-insensitive ILIKE is used).\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkEvents();