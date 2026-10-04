require('dotenv').config();

const config = require('./config');
const { loadSeen, saveSeen } = require('./store');
const { sendTelegram } = require('./notify');
const { looksLocationRestricted } = require('./locationFilter');

function isFresh(job) {
  if (!job.postedAt) return true;
  const t = new Date(job.postedAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t <= config.maxAgeDays * 24 * 60 * 60 * 1000;
}

function matchesKeywords(job) {
  if (job.prefiltered) return true;
  const haystack = (job.searchText || job.title || '').toLowerCase();
  return config.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMessage(job) {
  const lines = [
    `🆕 <b>${escapeHtml(job.title)}</b>`,
    job.company ? `🏢 ${escapeHtml(job.company)}` : null,
    `📍 ${job.source}`,
    job.location ? `🌍 ${escapeHtml(job.location)}` : null,
    job.salary ? `💰 ${escapeHtml(job.salary)}` : null,
    `🔗 ${job.url}`
  ].filter(Boolean);
  return lines.join('\n');
}

// fetchAllJobs: an async function returning an array of normalized job objects.
// label: short name for this run, used only in the console log line.
async function run(fetchAllJobs, label) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables.');
    console.error('Copy .env.example to .env (locally) or set them as GitHub Actions secrets.');
    process.exit(1);
  }

  const seen = loadSeen();
  const jobs = await fetchAllJobs();

  let droppedForLocation = 0;
  const seenThisRun = new Set();
  const newMatches = jobs
    .filter((job) => {
      if (seen[job.id] || seenThisRun.has(job.id)) return false;
      seenThisRun.add(job.id);
      if (!isFresh(job) || !matchesKeywords(job)) return false;
      if (looksLocationRestricted(job)) {
        droppedForLocation += 1;
        return false;
      }
      return true;
    })
    .slice(0, config.maxAlertsPerRun);

  console.log(
    `[${label}] Checked ${jobs.length} total jobs -> ${newMatches.length} new matches` +
    (droppedForLocation ? ` (${droppedForLocation} dropped as country-restricted)` : '') + '.'
  );

  for (const job of newMatches) {
    try {
      await sendTelegram(token, chatId, formatMessage(job));
      console.log(`Notified: [${job.source}] ${job.title}`);
      seen[job.id] = Date.now();
    } catch (err) {
      console.error(`Failed to notify for "${job.title}": ${err.message}`);
      // Don't mark as seen — we'll retry it on the next run.
    }
  }

  // Prune old entries so the store file doesn't grow forever.
  const retentionMs = config.seenRetentionDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const id of Object.keys(seen)) {
    if (now - seen[id] > retentionMs) delete seen[id];
  }

  saveSeen(seen);
}

module.exports = { run };
