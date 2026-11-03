// Shared location logic for every source. Two jobs:
//
//   looksLocationRestricted(job) -> true if the job is explicitly limited to
//     one country/region ("US only", "must be based in the UK", or a country
//     named at the end of the title: "Account Executive - France").
//   looksWorldwide(job)          -> true if the job is open to people anywhere.
//
// config.worldwideOnly decides, per source, whether the runner uses the
// lenient check (drop only explicit restrictions) or the strict one (keep a
// job ONLY if it is open worldwide). Strict is what you want when "remote"
// alone isn't enough.
//
// How "worldwide" is decided in strict mode:
//   1. If the source gives a structured location field (Remotive, Jobicy,
//      Jooble, most RemoteOK jobs, WWR's region tag), that field decides.
//      "Worldwide"/"Anywhere"/"Nigeria"/"Africa" pass; "USA", "Europe",
//      "France" etc. do not. Free text is ignored, because company blurbs say
//      things like "customers worldwide" that mean nothing about the job.
//   2. Only when there is NO location field does the text decide, and then
//      only with phrases that talk about the candidate or the remote work
//      ("remote team worldwide", "work from anywhere"), not a bare "worldwide".
//
// Honesty note: this is pattern-matching, not a guarantee. A posting that
// restricts location in unusual wording can still slip through. The 🌍 line
// in each Telegram message is there so you make the final call.

const RESTRICTIVE_PATTERNS = [
  /\b(us|u\.s\.|usa|united states)[\s-]*(citizens?|residents?|based)?\s*only\b/i,
  /\bonly\b.{0,15}\b(us|u\.s\.|usa|united states)\b/i,
  /\bmust be (based|located|residing) in the (us|u\.s\.|usa|united states|uk|u\.k\.|canada)\b/i,
  /\b(authoriz(ed|ation) to work|eligib(le|ility) to work|legally (able|authorized) to work)\b.{0,20}\bin the (us|u\.s\.|usa|united states|uk|canada)\b/i,
  /\b(us|u\.s\.|uk|u\.k\.|canada)[\s-]based (candidates?|applicants?|only)\b/i,
  /\bresiden(t|cy) of the (us|u\.s\.|usa|united states|uk|canada)\b/i,
  /\bwithin the (us|u\.s\.|usa|united states|uk|canada)\b/i,
  /\b(us|uk|canada) work (visa|permit|authorization) required\b/i,
  /\bcanada[\s-]*only\b/i,
  /\buk[\s-]*only\b/i,
  /\banywhere in the (us|u\.s\.|usa|united states)\b/i,
  /\b(europe|eu|emea|latam|apac|north america)[\s-]*(only|based)\b/i
];

// Every country name Node knows (about 250), except Nigeria, plus the usual
// abbreviations and regions. Built from the runtime's own country list so we
// don't have to hand-type countries and miss one (like Bulgaria).
function buildPlaceNames() {
  const names = new Set();
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const code = String.fromCharCode(65 + i, 65 + j);
        let name;
        try { name = display.of(code); } catch { continue; }
        if (!name || name === code || name.length < 4 || /unknown/i.test(name)) continue;
        names.add(name.toLowerCase());
      }
    }
  } catch { /* very old Node without ICU: fall back to the short list below */ }
  for (const extra of [
    'uk', 'u.k.', 'usa', 'us', 'u.s.', 'uae', 'eu', 'emea', 'apac', 'latam',
    'europe', 'north america', 'czechia', 'czech republic', 'dubai',
    'united states', 'united kingdom', 'new zealand', 'south africa',
    // Common names that differ from the official ones Node uses
    // ("Türkiye", "Hong Kong SAR China", "Côte d’Ivoire", ...).
    'turkey', 'hong kong', 'macau', 'ivory coast', 'burma', 'england',
    'scotland', 'wales', 'northern ireland', 'czech', 'bosnia', 'holland',
    'palestine', 'congo', 'cape verde'
  ]) names.add(extra);
  names.delete('nigeria');
  return [...names]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

// Checked against the job TITLE only. Titles often carry the location or a
// language requirement: "Client Service Analyst (Czech required)",
// "Account Development Representative - France", "Content Specialist - UK",
// "Manager, Engineering (Remote Eligible in Bulgaria)".
const TITLE_RESTRICTIVE_PATTERNS = [
  /\(\s*[a-z]+\s+required\s*\)/i,
  /\b(eligible|located|based|residing|resident)\s+in\b/i,
  new RegExp(`[-–—,|(]\\s*(?:${buildPlaceNames().join('|')})\\s*\\)?\\s*$`, 'i')
];

// Used only when a job has NO location field. Each pattern ties "worldwide"
// (or similar) to the candidate or the remote work, so company-blurb uses
// like "customers worldwide" don't count.
const TEXT_OPEN_PATTERNS = [
  /\bwork from anywhere\b/i,
  /\banywhere in the world\b/i,
  /\b(remote|hiring|candidates?|applicants?|talent|team|work(ing)?)\b.{0,40}\bworldwide\b/i,
  /\bworldwide\b.{0,40}\b(remote|hiring|candidates?|applicants?|talent)\b/i,
  /\b(hire|hiring|candidates?|applicants?)\b.{0,30}\b(any|all) countr(y|ies)\b/i,
  /\bglobal(ly)? remote\b/i,
  /\bany\s*time ?zone\b/i,
  /\bfully remote\b.{0,20}\bworld\b/i
];

// A structured location field that is, on its own, an open signal.
const OPEN_LOCATION_FIELD = /^\s*(remote\s*[-(,]?\s*)?(anywhere( in the world)?|worldwide|global|international)\s*\)?\s*$/i;

// A structured location that includes Nigeria counts as open too:
// "Nigeria", or "Africa" (but not "South Africa", which is one country).
const FRIENDLY_LOCATION_FIELD = /\bnigeria\b|(?<!south\s)\bafrica\b/i;

function haystackOf(job) {
  return `${job.location || ''} ${job.searchText || ''}`;
}

function looksLocationRestricted(job) {
  // A title that mentions Nigeria ("Support Agent - Nigeria", "based in
  // Nigeria") is never treated as restricted by the title rules.
  const title = (job.title || '').trim();
  if (!/\bnigeria\b/i.test(title) && TITLE_RESTRICTIVE_PATTERNS.some((p) => p.test(title))) return true;
  return RESTRICTIVE_PATTERNS.some((p) => p.test(haystackOf(job)));
}

function looksWorldwide(job) {
  const location = (job.location || '').trim();
  if (location) {
    // A structured location decides on its own, free text is ignored.
    return OPEN_LOCATION_FIELD.test(location) || FRIENDLY_LOCATION_FIELD.test(location);
  }
  return TEXT_OPEN_PATTERNS.some((p) => p.test(haystackOf(job)));
}

/**
 * @param {object} job normalized job
 * @param {boolean} strict if true, the job must be open worldwide
 * @returns {boolean} true if the job should be dropped for location reasons
 */
function shouldDropForLocation(job, strict) {
  // An explicit restriction always wins, even if "worldwide" appears
  // somewhere else in the text (e.g. "global company, US only").
  if (looksLocationRestricted(job)) return true;
  if (strict) return !looksWorldwide(job);
  return false;
}

module.exports = { looksLocationRestricted, looksWorldwide, shouldDropForLocation };
