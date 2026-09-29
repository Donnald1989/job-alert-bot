// Jooble aggregates listings from many job boards. Free API key:
// https://jooble.org/api/about
// Optional source: if JOOBLE_API_KEY isn't set, this is skipped.

async function searchOne(apiKey, search) {
  const res = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: search.keywords,
      location: search.location || '',
      page: 1
    })
  });

  if (!res.ok) {
    throw new Error(`Jooble responded with status ${res.status} for "${search.keywords}"`);
  }

  const data = await res.json();
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return jobs.map((j) => ({
    id: `jooble-${j.id || j.link}`,
    title: j.title || 'Untitled role',
    company: j.company || '',
    url: j.link,
    postedAt: j.updated || null,
    source: `Jooble${j.source ? ' / ' + j.source : ''}`,
    salary: j.salary || '',
    // The search itself already matched on keywords, so skip the local keyword filter.
    prefiltered: true,
    searchText: [j.title, j.company, j.snippet].filter(Boolean).join(' ')
  }));
}

async function fetchJooble(apiKey, searches) {
  const all = [];
  for (const search of searches) {
    try {
      all.push(...(await searchOne(apiKey, search)));
    } catch (err) {
      console.error(`[Jooble] ${err.message}`);
    }
  }
  return all.filter((j) => j.url);
}

module.exports = { fetchJooble };
