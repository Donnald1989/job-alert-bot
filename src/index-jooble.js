// Runs every 6 hours via GitHub Actions. Covers Jooble (free tier capped at
// 500 requests) and Jobicy (no hard cap, but asks for infrequent polling) —
// both are rate/fair-use sensitive, which is why they're kept off the
// 15-minute schedule that RemoteOK + WWR use (see index.js).

const config = require('./config');
const { fetchJooble } = require('./sources/jooble');
const { fetchJobicy } = require('./sources/jobicy');
const { run } = require('./runner');

async function fetchAllJobs() {
  let jobs = [];

  const joobleKey = process.env.JOOBLE_API_KEY;
  if (!joobleKey) {
    console.error('[Jooble] Skipped: missing JOOBLE_API_KEY environment variable.');
  } else {
    try {
      const joobleJobs = await fetchJooble(joobleKey, config.jooble.searches);
      console.log(`[Jooble] fetched ${joobleJobs.length} jobs`);
      jobs = jobs.concat(joobleJobs);
    } catch (err) {
      console.error('[Jooble] fetch failed:', err.message);
    }
  }

  try {
    const jobicyJobs = await fetchJobicy(config.jobicy.searches);
    console.log(`[Jobicy] fetched ${jobicyJobs.length} jobs`);
    jobs = jobs.concat(jobicyJobs);
  } catch (err) {
    console.error('[Jobicy] fetch failed:', err.message);
  }

  return jobs;
}

run(fetchAllJobs, 'Jooble+Jobicy').catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
