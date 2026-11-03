// Edit this file to tune what counts as "a match" for you.
// Keywords are checked as plain lowercase substring matches: against the job
// title + description for most sources, or the title only for the sources
// listed in keywordTitleOnlySources below. Keep phrases short and specific.

module.exports = {
  keywords: [
    // media / content
    'video editor', 'video editing', 'video content', 'multimedia',
    'content creator', 'content writer', 'content writing',
    'social media manager', 'social media content',
    'ghostwriter', 'ghost writer', 'ghostwriting', 'ghost writing',
    'ghost-writer', 'ghost-writing',
    'copywriter', 'copywriting', 'copy writer', 'ad copy', 'sales copy', 'email copy',
    'ugc creator', 'ugc content', 'ugc video', 'ugc ad', 'ugc campaign',
    'user generated content', 'user-generated content',
    'blog writer', 'blog writing', 'article writer', 'seo writer', 'seo content',
    'script writer', 'scriptwriter', 'script writing', 'scriptwriting', 'video script',
    'newsletter writer', 'content marketing',
    'video production', 'video producer', 'motion graphics',
    'graphic designer', 'graphic design', 'thumbnail',

    // marketing
    'digital marketing', 'digital marketer',
    'social media specialist', 'social media marketing', 'community manager',

    // dev / tech (matches your React/Next.js/Node.js/Python stack)
    'full stack', 'full-stack', 'frontend', 'front-end', 'front end',
    'backend', 'back-end', 'back end',
    'react developer', 'react engineer', 'react.js', 'reactjs',
    'next.js', 'nextjs', 'node.js', 'nodejs', 'javascript developer',
    'typescript', 'python developer', 'software developer', 'software engineer',
    'web developer', 'wordpress', 'supabase',
    'ffmpeg', 'mql5', 'trading bot', 'algorithmic trading',

    // AI / automation (your AI video, music and automation work)
    'ai trainer', 'prompt engineer', 'ai video', 'ai content',
    'automation specialist', 'automation engineer', 'n8n', 'zapier',

    // admin / data / support. Data entry is its own keyword, separate from
    // "virtual assistant", so these roles are matched whatever they're titled.
    'data entry', 'virtual assistant', 'data annotation', 'data labeling',
    'data labelling', 'data analyst',
    'administrative assistant', 'administrative support', 'executive assistant',
    'personal assistant', 'online assistant', 'operations assistant',
    'customer support', 'customer service', 'customer success',
    'chat support', 'email support'
  ],

  // Sources whose job descriptions are long. For these, keywords must appear
  // in the job TITLE, so a passing mention in a description doesn't count.
  keywordTitleOnlySources: ['RemoteOK', 'We Work Remotely', 'Remotive'],

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
      { keywords: 'UGC content creator remote worldwide', location: '' },
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

  // Remotive has a real "worldwide" location field on every job. One request
  // pulls the newest `recentLimit` listings (filtered by the keywords above),
  // plus one extra request per watched company below. Remotive asks for no
  // more than ~4 fetches a day, so this only runs on the 6-hour schedule.
  remotive: {
    recentLimit: 500
  },

  // Companies you want to see jobs from even when the posting doesn't say
  // "worldwide" (strict mode is skipped for them). Explicit restrictions
  // like "US only" still drop the job, and the keyword match still applies.
  // Matched as a lowercase substring of the company name.
  watchCompanies: ['20four7va'],

  // "Remote" alone isn't enough: many remote jobs are limited to one country.
  // For each source set true to keep a job ONLY if it is open worldwide
  // (its location field says Worldwide / Anywhere / Africa / Nigeria, or,
  // with no location field, its text says so), or false to drop only jobs
  // that explicitly say US-only etc. (lenient). Explicit restrictions are
  // dropped in both modes. Jooble is lenient because its snippets are short
  // and rarely say "worldwide" even when the job is open; its searches
  // already include "worldwide" instead.
  worldwideOnly: {
    'RemoteOK': true,
    'We Work Remotely': true,
    'Jobicy': true,
    'Remotive': true,
    'Jooble': false
  },

  // Ignore postings older than this, so a first run doesn't flood you with stale jobs.
  maxAgeDays: 7,

  // Safety cap on messages per run.
  maxAlertsPerRun: 15,

  // Entries older than this are dropped from the "seen" store to keep it small.
  seenRetentionDays: 30
};
