// Tracks which job IDs we've already alerted on, so we never spam the same
// posting twice. Backed by a plain JSON file so it works with zero setup;
// swap this out for Supabase/Firestore later if you want a shared store
// across multiple machines.

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'seen.json');

function loadSeen() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSeen(seen) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(seen, null, 2) + '\n');
}

module.exports = { loadSeen, saveSeen };
