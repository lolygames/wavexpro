// Server-side score check for Endless and Daily runs (Node.js).
// Use this in your leaderboard API before saving a score: it replays the run with the
// same physics as the game, so a faked distance (or a run on the wrong daily course) is rejected.
//
//   const { verifyRun } = require('./server/verify-run.js');
//   if (!verifyRun({ mode: 'daily', seed, toggles, distance, day: '2026-11-11' })) return res.status(400).end();
//
// toggles: the run's input as sent by the game, either an array of physics-step numbers
// or the compact string the game stores (base-36 deltas joined by commas).
const C = require('../js/core.js');

function decodeToggles(t) {
  if (Array.isArray(t)) return t.map(Number);
  let a = 0; return String(t || '').split(',').filter(Boolean).map(x => (a += parseInt(x, 36)));
}
function dailySeed(day) {            // must match dailySeed() in js/game.js
  let h = 2166136261; for (const c of 'wavex-daily-' + day) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1000000000 || 1;
}
function todayUTC() { return new Date().toISOString().slice(0, 10); }

function verifyRun({ mode, seed, toggles, distance, day }) {
  const d = Number(distance), s = Number(seed), t = decodeToggles(toggles);
  if (!Number.isInteger(d) || d <= 0 || d > 50000 || !Number.isInteger(s)) return false;
  if (t.length > 20000 || t.some((v, i) => !Number.isInteger(v) || v < 0 || (i && v < t[i - 1]))) return false;
  if (mode === 'daily' && (day !== todayUTC() || s !== dailySeed(day))) return false;
  return Math.floor(C.replayEndless(s, t)) === d;
}
module.exports = { verifyRun, dailySeed, decodeToggles };

if (require.main === module) {       // quick self-test: node server/verify-run.js
  console.log('fake 99999m run accepted?', verifyRun({ mode: 'endless', seed: 5, toggles: '1,2,3', distance: 99999 }));
  const real = Math.floor(C.replayEndless(42, []));
  console.log(`real ${real}m run (no input) accepted?`, verifyRun({ mode: 'endless', seed: 42, toggles: [], distance: real }));
}
