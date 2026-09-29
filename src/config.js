// Edit this file to tune what counts as "a match" for you.
// Everything here is checked as a plain lowercase substring match
// against each job's title + description, so keep phrases short and specific.

module.exports = {
  keywords: [
    // media / content
    'video editor', 'video editing', 'video content', 'multimedia',
    'content creator', 'content writer', 'content writing',
    'social media manager', 'social media content',

    // marketing
    'digital marketing', 'digital marketer',

    // dev / tech (matches your React/Next.js/Node.js/Python stack)
    'full stack', 'full-stack', 'frontend', 'front-end', 'backend', 'back-end',
    'react developer', 'react.js', 'next.js', 'node.js', 'javascript developer',
    'typescript', 'python developer', 'software developer', 'web developer',

    // admin / data (RemoteOK + WWR only; Jooble uses its own searches below)
    'data entry', 'virtual assistant', 'data annotation', 'data analyst',
    'administrative assistant', 'customer support'
  ],

  // Jooble searches (needs JOOBLE_API_KEY). Each one is a separate query,
  // and each query costs one request against Jooble's free-tier cap — see
  // index-jooble.js for why this list is kept short and checked
  // infrequently. Trim further, or expand once Jooble confirms the limit
  // period.
  jooble: {
    searches: [
      { keywords: 'data entry virtual assistant remote', location: 'Nigeria' },
      { keywords: 'social media manager video editor remote', location: 'Nigeria' },
      { keywords: 'UGC content creator', location: '' }
    ]
  },

  // Ignore postings older than this, so a first run doesn't flood you with stale jobs.
  maxAgeDays: 7,

  // Safety cap on messages per run.
  maxAlertsPerRun: 15,

  weworkremotely: {
    // Add or remove WWR category feeds from this list.
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

  // Entries older than this are dropped from the "seen" store to keep it small.
  seenRetentionDays: 30
};
