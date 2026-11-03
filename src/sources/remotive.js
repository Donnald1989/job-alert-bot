// Remotive — free public API, no key.
// https://remotive.com/api/remote-jobs
//
// Why it's here: every job has a structured `candidate_required_location`
// ("Worldwide", "USA Only", "Europe"...), so "worldwide" is a real field
// instead of a guess from text. It also carries 20four7VA listings.
//
// Remotive's rules (from their API docs) that this file follows:
//   - fetch no more than about 4 times a day  -> this runs only on the
//     6-hour schedule (index-jooble.js), and manual "Run workflow" clicks
//     count against the same budget, so don't spam them
//   - more than ~2 requests a minute gets blocked -> requests are spaced
//     REQUEST_GAP_MS apart, and there are only 1 + (number of watched
//     companies) of them per run
//   - listings are delayed 24 hours on their side
//   - link back to the Remotive URL and credit Remotive -> job.url is the
//     Remotive page and the Telegram message names the source
//   - don't re-publish jobs to aggregators or use them to collect
//     signups -> this only sends a private Telegram message to you

const REQUEST_GAP_MS = 31000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(job) {
  const location = job.candidate_required_location || null;
  return {
    id: `remotive-${job.id}`,
    source: 'Remotive',
    title: job.title || 'Untitled role',
    company: job.company_name || null,
    location,
    url: job.url,
    // Remotive gives "2026-10-15T10:23:26" with no timezone; close enough
    // for a 7-day freshness check.
    postedAt: job.publication_date || null,
    salary: job.salary || null,
    // First 3000 chars of the description: enough to catch "US only" style
    // wording without carrying megabytes of HTML around.
    searchText: `${job.title || ''} ${location || ''} ${job.company_name || ''} ${stripHtml(job.description).slice(0, 3000)}`,
    prefiltered: false
  };
}

async function request(params) {
  const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
    headers: { 'User-Agent': 'job-alert-bot (personal use)' }
  });
  if (!res.ok) throw new Error(`Remotive API error ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.jobs) ? data.jobs : [];
}

/**
 * @param {{recentLimit?: number, watchCompanies?: string[]}} options
 *   recentLimit: how many of the newest listings to pull in the main request.
 *   watchCompanies: company names to ask Remotive for directly, so their
 *   jobs are found even if they fall outside the recent window.
 */
async function fetchRemotive({ recentLimit = 500, watchCompanies = [] } = {}) {
  const queries = [new URLSearchParams({ limit: String(recentLimit) })];
  for (const company of watchCompanies) {
    queries.push(new URLSearchParams({ company_name: company, limit: '50' }));
  }

  const byId = new Map();
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await sleep(REQUEST_GAP_MS);
    try {
      for (const job of await request(queries[i])) {
        if (!byId.has(job.id)) byId.set(job.id, normalize(job));
      }
    } catch (err) {
      console.error(`[Remotive] request ${i + 1}/${queries.length} failed:`, err.message);
    }
  }
  return [...byId.values()];
}

module.exports = { fetchRemotive };
