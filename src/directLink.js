// Tries to find the job on the company's OWN hiring page, so you can apply
// directly instead of through an aggregator. Many companies post jobs through
// Greenhouse, Lever, Ashby or Workable, which all publish a free, public job
// list. We look the company up there and only accept a title that matches
// closely, so a wrong link is much less likely than a missing one.
//
// Honesty note: this only works for companies on those four systems. When
// nothing is found, the alert still carries a search link (see searchLink).

const TIMEOUT_MS = 6000;
const cache = new Map(); // "slug" -> Promise of that company's job list per system

const SUFFIXES = /\b(inc|llc|ltd|limited|corp|corporation|co|company|gmbh|plc|pty|ag|sa|bv|technologies|technology|group|holdings)\b\.?/g;

function slugsFor(company) {
  const base = (company || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9\s-]/g, ' ');
  const full = base.trim().split(/\s+/).filter(Boolean);
  const trimmed = base.replace(SUFFIXES, ' ').trim().split(/\s+/).filter(Boolean);
  const out = new Set();
  for (const words of [trimmed, full]) {
    if (!words.length) continue;
    out.add(words.join(''));
    out.add(words.join('-'));
  }
  return [...out].filter((s) => s.length >= 3).slice(0, 4);
}

async function getJson(url) {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'job-alert-bot', Accept: 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Each system: how to fetch the company's list, and how to read a job from it.
const SYSTEMS = [
  {
    name: 'Greenhouse',
    url: (s) => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs`,
    read: (d) => (d && Array.isArray(d.jobs) ? d.jobs.map((j) => ({ title: j.title, url: j.absolute_url })) : [])
  },
  {
    name: 'Lever',
    url: (s) => `https://api.lever.co/v0/postings/${s}?mode=json`,
    read: (d) => (Array.isArray(d) ? d.map((j) => ({ title: j.text, url: j.hostedUrl })) : [])
  },
  {
    name: 'Ashby',
    url: (s) => `https://api.ashbyhq.com/posting-api/job-board/${s}`,
    read: (d) => (d && Array.isArray(d.jobs) ? d.jobs.map((j) => ({ title: j.title, url: j.jobUrl })) : [])
  },
  {
    name: 'Workable',
    url: (s) => `https://apply.workable.com/api/v1/widget/accounts/${s}`,
    read: (d) => (d && Array.isArray(d.jobs) ? d.jobs.map((j) => ({ title: j.title, url: j.url || j.shortlink })) : [])
  }
];

const STOP = new Set(['a', 'an', 'the', 'and', 'of', 'for', 'to', 'in', 'remote', 'senior', 'sr', 'jr', 'junior']);
function words(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
}

// Strict on purpose: the same words in any order. A near-match like
// "Video Editor Intern" is NOT accepted for "Video Editor".
function titlesMatch(a, b) {
  const sa = new Set(words(a)), sb = new Set(words(b));
  if (!sa.size || sa.size !== sb.size) return false;
  return [...sa].every((w) => sb.has(w));
}

function listFor(system, slug) {
  const key = `${system.name}:${slug}`;
  if (!cache.has(key)) {
    cache.set(key, getJson(system.url(slug)).then((d) => {
      try { return system.read(d).filter((j) => j.title && j.url); } catch { return []; }
    }));
  }
  return cache.get(key);
}

async function findDirectLink(job) {
  try {
    const slugs = slugsFor(job.company);
    for (const slug of slugs) {
      const lists = await Promise.all(SYSTEMS.map((s) => listFor(s, slug)));
      for (let i = 0; i < SYSTEMS.length; i++) {
        const hit = lists[i].find((j) => titlesMatch(j.title, job.title));
        if (hit) return { url: hit.url, via: SYSTEMS[i].name };
      }
    }
  } catch { /* never let a lookup break an alert */ }
  return null;
}

function searchLink(job) {
  const q = [job.company ? `"${job.company}"` : '', `"${job.title}"`, 'careers'].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

module.exports = { findDirectLink, searchLink, slugsFor, titlesMatch };
