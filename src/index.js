// Runs every 15 minutes via GitHub Actions. Only covers sources with no
// request limit — RemoteOK and We Work Remotely. Jooble runs separately
// on a slower schedule (see index-jooble.js) because its free tier has a
// request cap.

const config = require('./config');
const { fetchRemoteOK } = require('./sources/remoteok');
const { fetchWWR } = require('./sources/weworkremotely');
const { run } = require('./runner');

async function fetchAllJobs() {
  let jobs = [];

  try {
    const remoteOkJobs = await fetchRemoteOK();
    console.log(`[RemoteOK] fetched ${remoteOkJobs.length} jobs`);
    jobs = jobs.concat(remoteOkJobs);
  } catch (err) {
    console.error('[RemoteOK] fetch failed:', err.message);
  }

  try {
    const wwrJobs = await fetchWWR(config.weworkremotely.feeds);
    console.log(`[WWR] fetched ${wwrJobs.length} jobs`);
    jobs = jobs.concat(wwrJobs);
  } catch (err) {
    console.error('[WWR] fetch failed:', err.message);
  }

  return jobs;
}

run(fetchAllJobs, 'RemoteOK+WWR').catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
