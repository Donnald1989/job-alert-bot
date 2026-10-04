// We Work Remotely — public per-category RSS feeds, no key needed.
// Full feed list: https://weworkremotely.com/remote-job-rss-feed

const Parser = require('rss-parser');
const parser = new Parser();

// WWR titles are usually formatted "Company: Job Title", and the category
// feed itself tells us the job is remote, but some postings still restrict
// to one region in the title/description (e.g. "(US Only)").
function splitTitle(rawTitle = '') {
  const idx = rawTitle.indexOf(':');
  if (idx === -1) return { company: null, title: rawTitle.trim() };
  return {
    company: rawTitle.slice(0, idx).trim(),
    title: rawTitle.slice(idx + 1).trim()
  };
}

async function fetchWWR(feedUrls = []) {
  const results = [];

  for (const feedUrl of feedUrls) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items || []) {
        const { company, title } = splitTitle(item.title);
        const description = item.contentSnippet || item.content || '';

        results.push({
          id: `wwr-${item.guid || item.link}`,
          source: 'We Work Remotely',
          title,
          company,
          // WWR doesn't give a structured location field in RSS — any
          // region restriction shows up as plain text in the title or
          // description, which locationFilter.js checks via searchText.
          location: null,
          url: item.link,
          postedAt: item.isoDate || item.pubDate || null,
          salary: null,
          searchText: `${item.title} ${description}`,
          prefiltered: false
        });
      }
    } catch (err) {
      console.error(`[WWR] failed to parse feed ${feedUrl}:`, err.message);
    }
  }

  return results;
}

module.exports = { fetchWWR };
