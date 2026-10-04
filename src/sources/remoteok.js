// RemoteOK public API — no key needed.
// https://remoteok.com/api

async function fetchRemoteOK() {
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': 'job-alert-bot (personal use)' }
  });

  if (!res.ok) {
    throw new Error(`RemoteOK API error ${res.status}`);
  }

  const data = await res.json();

  // The first item in RemoteOK's response is always a legal notice, not a job.
  const jobs = Array.isArray(data) ? data.slice(1) : [];

  return jobs.map((job) => ({
    id: `remoteok-${job.id}`,
    source: 'RemoteOK',
    title: job.position || job.title || 'Untitled role',
    company: job.company || null,
    // RemoteOK jobs are remote by definition of the site, but some are
    // tagged with a specific region restriction in job.location.
    location: job.location || 'Remote (worldwide unless noted)',
    url: job.url || job.apply_url || `https://remoteok.com/remote-jobs/${job.id}`,
    postedAt: job.date || null,
    salary: job.salary_min && job.salary_max
      ? `$${job.salary_min} - $${job.salary_max}`
      : null,
    searchText: `${job.position || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`,
    prefiltered: false
  }));
}

module.exports = { fetchRemoteOK };
