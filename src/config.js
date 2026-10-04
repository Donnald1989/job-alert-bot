// Edit this file to tune what counts as "a match" for you.
// Everything here is checked as a plain lowercase substring match
// against each job's title + description, so keep phrases short and specific.

module.exports = {
  keywords: [
    // media / content
    'video editor', 'video editing', 'video content', 'multimedia',
    'content creator', 'content writer', 'content writing',
    'social media manager', 'social media content',
    'ghostwriter', 'ghost writer', 'ghostwriting',
    'copywriter', 'copywriting',
    'ugc creator', 'ugc content',

    // marketing
    'digital marketing', 'digital marketer',

    // dev / tech (matches your React/Next.js/Node.js/Python stack)
    'full stack', 'full-stack', 'frontend', 'front-end', 'backend', 'back-end',
    'react developer', 'react.js', 'next.js', 'node.js', 'javascript developer',
    'typescript', 'python developer', 'software developer', 'web developer',

    // admin / data (RemoteOK + WWR only; Jooble/Jobicy use their own searches below)
    'data entry', 'virtual assistant', 'data annotation', 'data analyst',
    'administrative assistant', 'customer support'
  ],

  weworkremotely: {
    // Add or remove WWR category RSS feeds from this list.
    // Full list: https://weworkremotely.com/remote-job-rss-feed
    feeds: [
      'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss',
      'https://weworkremotely.com/categories/remote-design-jobs.rss',
      'https://weworkremotely.com/categories/all-other-remote-jobs.rss'
    ]
  },

  // Jooble searches (needs JOOBLE_API_KEY). Each one is a separate query,
  // and each query costs one request against Jooble's free-tier cap — see
  // index-jooble.js for why this list is kept short and checked
  // infrequently.
  //
  // location is left blank on purpose: Jooble's `location` parameter
  // searches for jobs physically IN that place, not jobs open TO people
  // there — setting it to "Nigeria" was pulling in on-site Nigeria jobs,
  // not worldwide-remote ones. Leaving it blank searches globally, and
  // src/locationFilter.js then drops results that read as restricted to
  // one country.
  jooble: {
    searches: [
      { keywords: 'data entry virtual assistant remote worldwide', location: '' },
      { keywords: 'social media manager video editor remote worldwide', location: '' },
      { keywords: 'UGC content creator remote', location: '' },
      { keywords: 'ghostwriter copywriter remote worldwide', location: '' }
    ]
  },

  // Jobicy is free with no request cap, but their own fair-use notice asks
  // for a few checks a day rather than constant polling — see
  // src/sources/jobicy.js for why this runs every 6 hours, not every 15 min.
  // No location param here (Jobicy's `geo` filter works the same
  // restrictive way Jooble's did), so the same locationFilter is applied
  // after fetching instead.
  jobicy: {
    searches: [
      { tag: 'video editor' },
      { tag: 'social media' },
      { tag: 'content writer' },
      { tag: 'virtual assistant' },
      { tag: 'data entry' },
      { tag: 'copywriter' }
    ]
  },

  // Ignore postings older than this, so a first run doesn't flood you with stale jobs.
  maxAgeDays: 7,

  // Safety cap on messages per run.
  maxAlertsPerRun: 15,

  // Entries older than this are dropped from the "seen" store to keep it small.
  seenRetentionDays: 30
};
