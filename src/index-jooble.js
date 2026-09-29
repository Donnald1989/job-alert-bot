// Runs every 6 hours via GitHub Actions — separate from index.js because
// Jooble's free tier has a 500-request cap and we don't yet know whether
// that's per day, per month, or a one-time total. With 3 searches per run
// and 4 runs/day, this uses 12 requests/day (360/month) — safe even if
// the cap turns out to be monthly. Loosen the schedule or add back more
// searches in config.js once Jooble confirms the limit period.

const config = require('./config');
const { fetchJooble } = require('./sources/jooble');
const { run } = require('./runner');

async function fetchAllJobs() {
  const joobleKey = process.env.JOOBLE_API_KEY;

  if (!joobleKey) {
    console.log('[Jooble] skipped (no JOOBLE_API_KEY set)');
    return [];
  }

  try {
    const jobs = await fetchJooble(joobleKey, config.jooble.searches);
    console.log(`[Jooble] fetched ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error('[Jooble] fetch failed:', err.message);
    return [];
  }
}

run(fetchAllJobs, 'Jooble').catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
