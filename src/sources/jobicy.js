// Jobicy — free, keyless public API.
// https://jobicy.com/api/v2/remote-jobs?tag=<tag>
//
// Their own fair-use notice asks for a few checks a day rather than constant
// polling, which is why this source runs on the 6-hour schedule (see
// index-jooble.js), not the 15-minute one.
//
// Jobicy jobs are posted as remote, but many are still scoped to one region
// via their `jobGeo` field (e.g. "USA Only", "UK", "Europe"). We capture
// that field and pass it through as `location` so locationFilter.js and the
// Telegram message can both use it.

async function fetchJobicy(searches = []) {
  const results = [];

  for (const search of searches) {
    try {
      const url = `https://jobicy.com/api/v2/remote-jobs?count=20&tag=${encodeURIComponent(search.tag)}`;
      const res = await fetch(url);

      if (!res.ok) {
        console.error(`[Jobicy] API error ${res.status} for tag "${search.tag}"`);
        continue;
      }

      const data = await res.json();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];

      for (const job of jobs) {
        const salary = job.annualSalaryMin && job.annualSalaryMax
          ? `${job.salaryCurrency || ''} ${job.annualSalaryMin} - ${job.annualSalaryMax}`.trim()
          : null;

        results.push({
          id: `jobicy-${job.id}`,
          source: 'Jobicy',
          title: job.jobTitle || 'Untitled role',
          company: job.companyName || null,
          location: job.jobGeo || null,
          url: job.url,
          postedAt: job.pubDate || null,
          salary,
          searchText: `${job.jobTitle || ''} ${job.jobExcerpt || ''} ${job.jobIndustry || ''} ${job.jobGeo || ''}`,
          prefiltered: false
        });
      }
    } catch (err) {
      console.error(`[Jobicy] fetch failed for tag "${search.tag}":`, err.message);
    }
  }

  return results;
}

module.exports = { fetchJobicy };
