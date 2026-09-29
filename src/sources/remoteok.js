// RemoteOK's public JSON API — no auth, no key required.
// https://remoteok.com/api

async function fetchRemoteOK() {
  const res = await fetch('https://remoteok.com/api', {
    headers: {
      'User-Agent': 'job-alert-bot/1.0 (personal job search tool)'
    }
  });

  if (!res.ok) {
    throw new Error(`RemoteOK responded with status ${res.status}`);
  }

  const data = await res.json();

  // The first item in the array is always a legal/meta notice, not a job — skip it.
  return data
    .filter((item) => item && item.id)
    .map((item) => ({
      id: `remoteok-${item.id}`,
      title: item.position || item.title || 'Untitled role',
      company: item.company || '',
      url: item.url || item.apply_url || `https://remoteok.com/remote-jobs/${item.id}`,
      postedAt: item.date || null,
      source: 'RemoteOK',
      searchText: [
        item.position,
        item.company,
        ...(Array.isArray(item.tags) ? item.tags : []),
        item.description
      ]
        .filter(Boolean)
        .join(' ')
    }));
}

module.exports = { fetchRemoteOK };
