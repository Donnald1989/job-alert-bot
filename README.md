# Job Alert Bot

Checks four free job sources and pushes new matches straight to your
Telegram the moment they're found, so you're not beaten to applications.

## Sources

| Source | Needs a key? | Schedule | Why |
|---|---|---|---|
| RemoteOK | No | every 15 min | public, no request limit |
| We Work Remotely | No | every 15 min | public RSS, no request limit |
| Jooble | Yes (free) | every 6 hours | free tier capped at 500 requests |
| Jobicy | No | every 6 hours | fair-use notice asks for infrequent polling |
| Remotive | No | every 6 hours | asks for no more than ~4 fetches a day; has a real "worldwide" location field |

## Worldwide-only mode

"Remote" alone isn't enough, since many remote jobs are limited to one country.
`worldwideOnly` in `src/config.js` sets, per source, whether a job must
explicitly say worldwide / work from anywhere / any country (strict) or is only
dropped when it explicitly says "US only" etc. (lenient). Explicit restrictions
are dropped in both modes. A structured location of "Nigeria" or "Africa" also
counts as open. `watchCompanies` (currently 20four7VA) skips strict mode for
those companies and marks the alert with a star; explicit restrictions still
drop them.

## Files

- `src/config.js` — edit this to change your keywords, WWR feeds, or Jooble/Jobicy searches.
- `src/locationFilter.js` — drops jobs that read as restricted to one country (US/UK/Canada-only) unless the posting also says worldwide/global/anywhere. **This is a text-pattern filter, not a guarantee** — always check the 🌍 line in the Telegram message yourself.
- `src/index.js` — the fast (15-min) entry point: RemoteOK + WWR.
- `src/index-jooble.js` — the slow (6-hour) entry point: Jooble + Jobicy + Remotive.
- `src/sources/remotive.js` — Remotive source. Keep manual "Run workflow" clicks on the 6-hour workflow rare, they count toward Remotive's ~4 fetches/day.
- `data/seen.json` — jobs already notified on, so you don't get duplicates. GitHub Actions commits updates to this automatically.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your real values:
   - `TELEGRAM_BOT_TOKEN` — from BotFather
   - `TELEGRAM_CHAT_ID` — from the Telegram `getUpdates` API
   - `JOOBLE_API_KEY` — from your Jooble API signup email
3. Test the fast sources: `node src/index.js`
4. Test the slow sources: `node src/index-jooble.js`

## Updating your live GitHub repo with this version

If you already have an older version of this bot pushed to GitHub:

1. Unzip this new version somewhere fresh on your PC.
2. Copy your existing `.env` file into the new folder (don't recreate it — it already has your real token/chat ID/Jooble key).
3. Open the new folder in VS Code, open a terminal, run `npm install`.
4. Run `node src/index.js` and `node src/index-jooble.js` to confirm both still work.
5. In the terminal:
   ```
   git add .
   git commit -m "Fix: worldwide-remote filter for Jooble and Jobicy"
   git push
   ```
6. Nothing to change in GitHub Secrets — same three secrets as before (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `JOOBLE_API_KEY`).

## What changed in this version

Jooble and Jobicy were both sending jobs tagged "remote" that were actually
restricted to a single country (usually the US). Three changes fix that:

1. `config.js` — Jooble's `location` search param is now blank instead of `"Nigeria"`, since that param searches for jobs physically in a place, not jobs open to people there.
2. `jooble.js` / `jobicy.js` — now capture each job's own location/`jobGeo` field and pass it through.
3. `locationFilter.js` + `runner.js` — drop jobs whose location/text reads as single-country-restricted, and show you the raw location (🌍) on every alert so you can double check.
