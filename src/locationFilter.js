// Shared logic for Jooble and Jobicy: both return a location/geo field and
// a text snippet, and neither has a real "globally open" filter in its API.
// This fills that gap on our side by reading the actual text.
//
// Honesty note: this is pattern-matching on short text fields, not a
// guarantee. It catches the common, explicit phrasing ("US-based
// candidates only", "must be authorized to work in the United States")
// but a posting that restricts location in an unusual way, or only
// mentions it deep in the full description (which these APIs don't give
// us in full), can still slip through. Treat it as a strong filter, not a
// perfect one — the location shown in your Telegram message is what lets
// you make the final call yourself.

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
  /\banywhere in the (us|u\.s\.|usa|united states)\b/i
];

const OPEN_PATTERNS = [
  /\bworldwide\b/i,
  /\banywhere\b/i,
  /\bglobal(ly)?\b/i,
  /\bany\s*(country|location|timezone|time zone)\b/i,
  /\binternational(ly)?\b/i,
  /\bopen to all countries\b/i,
  /\bfully remote\b.{0,20}\bworld\b/i
];

/**
 * @param {{location?: string, searchText?: string}} job
 * @returns {boolean} true if the job looks restricted to a specific
 * country/region that isn't open worldwide.
 */
function looksLocationRestricted(job) {
  const haystack = `${job.location || ''} ${job.searchText || ''}`;
  if (OPEN_PATTERNS.some((p) => p.test(haystack))) return false;
  return RESTRICTIVE_PATTERNS.some((p) => p.test(haystack));
}

module.exports = { looksLocationRestricted };
