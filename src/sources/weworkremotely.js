// We Work Remotely publishes official public RSS feeds per category — no scraping needed.
// https://weworkremotely.com/remote-job-rss-feed

const Parser = require('rss-parser');
const parser = new Parser();

async function fetchWWR(feedUrls) {
  const all = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items) {
        const id = item.guid || item.link;
        if (!id) continue;

        all.push({
          id: `wwr-${id}`,
          title: item.title || 'Untitled role',
          company: '', // WWR titles are usually "Company: Role"
          url: item.link,
          postedAt: item.isoDate || item.pubDate || null,
          source: 'We Work Remotely',
          searchText: [item.title, item.contentSnippet].filter(Boolean).join(' ')
        });
      }
    } catch (err) {
      // One bad feed shouldn't kill the whole run — log and continue.
      console.error(`[WWR] Failed to fetch ${url}: ${err.message}`);
    }
  }

  return all;
}

module.exports = { fetchWWR };
