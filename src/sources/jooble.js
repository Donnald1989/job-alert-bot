// Jooble REST API — needs a free JOOBLE_API_KEY (apply at jooble.org/api/about).
// POST https://jooble.org/api/{key}
//
// IMPORTANT: Jooble's `location` search param matches jobs physically
// located in that place, not jobs open to people there. config.js leaves
// location blank on purpose so this searches worldwide instead of one
// country. We still capture whatever location text Jooble returns per job
// (job.location) and pass it straight through on the normalized object, so
// runner.js's locationFilter can catch per-job country restrictions and the
// Telegram message can show it to you directly.

async function fetchJooble(apiKey, searches = []) {
  const results = [];

  for (const search of searches) {
    try {
      const res = await fetch(`https://jooble.org/api/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: search.keywords || '',
          location: search.location || ''
        })
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Jooble] API error ${res.status} for "${search.keywords}": ${body}`);
        continue;
      }

      const data = await res.json();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];

      for (const job of jobs) {
        results.push({
          id: `jooble-${job.id}`,
          source: 'Jooble',
          title: job.title || 'Untitled role',
          company: job.company || null,
          // This is the field that was missing before: Jooble gives us a
          // free-text location per job (e.g. "United States", "Remote",
          // "Lagos, Nigeria"). We now keep it so the filter + message can
          // use it instead of guessing.
          location: job.location || null,
          url: job.link,
          postedAt: job.updated || null,
          salary: job.salary || null,
          searchText: `${job.title || ''} ${job.snippet || ''} ${job.location || ''}`,
          prefiltered: false
        });
      }
    } catch (err) {
      console.error(`[Jooble] fetch failed for "${search.keywords}":`, err.message);
    }
  }

  return results;
}

module.exports = { fetchJooble };
