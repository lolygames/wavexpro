// Checks that every level in js/core.js can be finished: run `node tools/check_levels.js`.
// "30 Hz" means the solver may only change input 30 times a second, roughly human reaction speed.
const C = require('../js/core.js');
function solve(L, speed, k) {
  const W = C.windowed(L.items); let front = [{ x: 0, y: 5, mode: 'wave', speed }], worst = 1e9;
  while (front.length) {
    const x = front[0].x; if (x >= L.end) return 'ok (tightest moment: ' + worst + ' safe paths)';
    const near = W.near(x - 1, x + 13 * C.DT * k + 1), next = new Map();
    for (const s of front) for (const hold of [true, false]) {
      const n = { ...s }; let dead = false;
      for (let i = 0; i < k && !dead; i++) dead = C.step(n, hold, near);
      if (!dead) next.set(n.y.toFixed(3) + (n.grav ? 'g' : ''), n);
    }
    front = [...next.values()]; if (x > 3) worst = Math.min(worst, front.length);
    if (!front.length) return 'IMPOSSIBLE at x=' + x.toFixed(1);
  }
}
for (const Lv of C.LEVELS) { const L = C.buildLevel(Lv); console.log(Lv.name.padEnd(12), '30 Hz:', solve(L, Lv.speed, 8)); }
