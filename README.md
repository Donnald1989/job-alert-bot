# Job Alert Bot

Checks [RemoteOK](https://remoteok.com) (public JSON API) and
[We Work Remotely](https://weworkremotely.com) (official RSS feeds) every
15 minutes and pushes any new job matching your keywords straight to your
phone via Telegram — before it's buried under a wall of applicants.

Both sources are official, public, and don't require scraping fragile HTML,
so this won't randomly break the way a LinkedIn/Indeed scraper would.

## How it works

1. `src/index.js` fetches jobs from RemoteOK + We Work Remotely.
2. Each job is checked against the keyword list in `src/config.js`.
3. Anything new (not already in `data/seen.json`) gets sent to your
   Telegram chat.
4. `data/seen.json` is updated so you never get the same job twice.
5. A GitHub Actions workflow (`.github/workflows/job-alert.yml`) runs this
   automatically every 15 minutes, for free, without you needing to keep a
   computer running.

## One-time setup (about 10 minutes)

### 1. Create a Telegram bot
1. Open Telegram, search for **@BotFather**, and send `/newbot`.
2. Follow the prompts (give it any name/username). BotFather will give you
   a **bot token** that looks like `123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
3. Send your new bot any message (e.g. "hi") so it knows who you are.
4. Get your **chat ID**: open this URL in a browser (replace `<TOKEN>`):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Look for `"chat":{"id":123456789,...}` in the response — that number is
   your chat ID.

### 2. Push this project to a GitHub repo
```bash
cd job-alert-bot
git init
git add .
git commit -m "Initial commit"
gh repo create job-alert-bot --private --source=. --push
# (or create an empty repo on github.com and follow the "push an existing
# repository" instructions it gives you)
```

### 3. Add your secrets to the GitHub repo
On GitHub: **Settings → Secrets and variables → Actions → New repository secret**
- `TELEGRAM_BOT_TOKEN` → your bot token from step 1
- `TELEGRAM_CHAT_ID` → your chat ID from step 1

### 4. Enable the workflow
Go to the **Actions** tab of your repo and enable workflows if prompted.
The bot will now run automatically every 15 minutes. You can also trigger
it manually any time from **Actions → Job Alert Bot → Run workflow**.

That's it — no server, no hosting bill, nothing to keep running on your
own machine.

## Testing it locally first (optional)
```bash
cp .env.example .env
# edit .env and paste in your real bot token + chat id
npm install
node src/index.js
```
You should see console output like `Checked 850 total jobs -> 3 new matches.`
and get messages in Telegram.

## Customizing what you get alerted about
Open `src/config.js`:
- **`keywords`** — add/remove phrases. Matching is a simple lowercase
  substring check against the job title + description, so keep phrases
  specific ("video editor" not just "video") to avoid noise.
- **`weworkremotely.feeds`** — add/remove WWR category RSS feeds. Full list
  of available categories: https://weworkremotely.com/remote-job-rss-feed

## Jooble (adds data entry, virtual assistant, social media, video and UGC searches)
Jooble aggregates listings from many boards, including Nigerian ones. It is optional
and runs on its own schedule, separate from RemoteOK/WWR:

1. Get a free API key at https://jooble.org/api/about
2. Add it as a GitHub secret named `JOOBLE_API_KEY`
3. Edit the searches in `src/config.js` under `jooble.searches`

**Why it's separate:** Jooble's free tier caps you at 500 requests, and their
confirmation email didn't say whether that's per day, per month, or a one-time total.
To stay safe under any of those, `.github/workflows/jooble-alert.yml` runs
`src/index-jooble.js` only once every 6 hours with 3 searches (12 requests/day, well
under 500/month even in the worst case) — while `.github/workflows/job-alert.yml` keeps
checking RemoteOK + We Work Remotely every 15 minutes, since those have no cap at all.

Once Jooble confirms the limit period, this can be loosened — either a shorter cron
schedule in `jooble-alert.yml`, or more entries in `jooble.searches`.

Without the key, both workflows still run fine; the Jooble one just logs "skipped" and
sends nothing.

## Jobberman / MyJobMag
Neither has an official feed, so they need HTML scraping that breaks when the sites
change. Keep using their saved-search email alerts for now.

## Notes
- Free tier limits: GitHub Actions gives free private-repo minutes; a job
  that runs a few seconds every 15 minutes uses only a small fraction of
  the free monthly allowance.
- `data/seen.json` is committed back to the repo after each run so the
  "already notified" list survives between runs (GitHub Actions runners
  are thrown away after each job).
- If you ever see repeated Telegram error logs in the Actions run output,
  double check your bot token/chat ID secrets are correct.
