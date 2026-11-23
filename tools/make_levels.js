// Generates the 8 level recipes, then tests each with a solver at human reaction speed (30 decisions/s)
// and re-rolls or eases any section that is too tight. Edit CFG below, run `node tools/make_levels.js`,
// then paste tools/levels_lit.js over the LEVELS array in js/core.js.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../js/core.js', 'utf8').replace(/const LEVELS = \[[\s\S]*?\n\];/, 'const LEVELS = [];');
const C = new Function('module', src + '; return module.exports;')({ exports: {} });
// name, label, hue, base speed, [d start, d end], type mix, mini ranges (fraction of time), speed changes
const CFG = [
  ['First light', 'Easy', 0, 8, [0.0, 0.3], 'zig pil saw dia gate', [], []],
  ['Tight weave', 'Normal', 1, 9, [0.15, 0.4], 'zig zig pil gate saw', [[0.45, 0.6]], []],
  ['Canyon run', 'Normal', 3, 9.5, [0.25, 0.5], 'zig zig gate pil dia', [[0.3, 0.4], [0.75, 0.85]], []],
  ['Sawmill', 'Hard', 2, 10, [0.35, 0.6], 'saw dia saw zig dia', [[0.5, 0.65]], [[0.8, 11]]],
  ['Speed trap', 'Hard', 4, 9, [0.4, 0.6], 'zig pil saw gate dia', [[0.55, 0.65]], [[0.15, 10.5], [0.35, 12], [0.5, 9], [0.7, 12.5], [0.9, 11]]],
  ['Needle', 'Harder', 0, 9.5, [0.4, 0.75], 'zig gate pil zig saw', [[0.05, 0.45], [0.55, 0.95]], []],
  ['Overdrive', 'Insane', 1, 11, [0.55, 0.85], 'zig saw pil dia gate', [[0.3, 0.42], [0.7, 0.8]], [[0.45, 12.5]]],
  ['Final wave', 'Insane', 2, 11.5, [0.6, 1.0], 'zig dia pil gate saw zig', [[0.2, 0.3], [0.5, 0.6], [0.82, 0.9]], [[0.35, 13], [0.65, 12], [0.9, 13]]],
];
const TARGET = 62;
function timeOf(recipe, speed) { // approximate time from layout
  const L = C.buildLevel({ recipe }); let x = 0, v = speed, t = 0;
  for (const p of L.items.filter(o => o.t === 'portal' && o.kind === 'speed').sort((a, b) => a.x - b.x)) { t += (p.x - x) / v; x = p.x; v = p.v; }
  return { t: t + (L.end - x) / v, end: L.end };
}
function solve(L, speed, k) {
  const W = C.windowed(L.items); let front = [{ x: 0, y: 5, mode: 'wave', speed }], worst = { n: 1e9, x: 0 };
  while (front.length) {
    const x = front[0].x; if (x >= L.end) return { ok: true, worst };
    const near = W.near(x - 1, x + 13 * C.DT * k + 1), next = new Map();
    for (const s of front) for (const hold of [true, false]) {
      const n = { ...s }; let dead = false;
      for (let i = 0; i < k && !dead; i++) dead = C.step(n, hold, near);
      if (!dead) next.set(n.y.toFixed(3), n);
    }
    front = [...next.values()];
    if (x > 3 && front.length < worst.n) worst = { n: front.length, x };
    if (!front.length) return { ok: false, x };
  }
}
const OUT = [];
CFG.forEach(([name, diff, hue, speed, [d0, d1], mix, minis, speeds], li) => {
  const types = mix.split(' '); const recipe = []; let mode = 'wave', si = 0, last = '', n = 0, sp = speed;
  const usedSpeed = new Set();
  while (true) {
    const { t } = timeOf(recipe, speed); const f = t / TARGET; if (t >= TARGET) break;
    const inMini = minis.some(([a, b]) => f >= a && f < b);
    if (inMini && mode !== 'mini') { recipe.push(['mini']); mode = 'mini'; }
    if (!inMini && mode === 'mini') { recipe.push(['wave']); mode = 'wave'; }
    speeds.forEach(([at, v], k) => { if (f >= at && !usedSpeed.has(k)) { usedSpeed.add(k); recipe.push(['speed', v]); } });
    let ty; do { ty = types[(n * 7 + li * 3 + Math.floor(n / types.length)) % types.length]; n++; } while (ty === last && types.length > 1);
    if (mode === 'mini' && ty === 'dia') ty = 'zig';
    last = ty;
    const d = +(d0 + (d1 - d0) * Math.min(1, f)).toFixed(2);
    recipe.push([ty, d, li * 100 + recipe.length]);
  }
  // verify: 30 Hz decisions must pass with slack everywhere; reroll or ease the guilty section
  for (let it = 0; it < 400; it++) {
    const L = C.buildLevel({ recipe }); const r = solve(L, speed, 8);
    const badX = !r.ok ? r.x : (r.worst.n < 2 ? r.worst.x : null);
    if (badX === null) break;
    let idx = -1, cps = 0;
    for (let i = 0; i < recipe.length; i++) if (!['mini', 'wave', 'speed'].includes(recipe[i][0])) { if (L.cps[cps] <= badX) idx = i; cps++; }
    if (idx < 0) idx = recipe.findIndex(e => !['mini', 'wave', 'speed'].includes(e[0]));
    const e = recipe[idx]; e[2] += 1000; e.tries = (e.tries || 0) + 1;
    if (e.tries % 6 === 0) e[1] = Math.max(0, +(e[1] - 0.05).toFixed(2));
  }
  const L = C.buildLevel({ recipe }); const r30 = solve(L, speed, 8), r120 = solve(L, speed, 2);
  const { t, end } = timeOf(recipe, speed);
  console.log(name.padEnd(12), 'time', t.toFixed(1), 's  end', end.toFixed(0), ' sections', recipe.filter(e => e.length === 3).length,
    ' 30Hz', r30.ok ? 'ok min ' + r30.worst.n : 'FAIL ' + r30.x, ' 120Hz', r120.ok ? 'ok' : 'FAIL');
  OUT.push({ name, diff, hue, speed, recipe: recipe.map(e => e.slice(0, e[0] === 'speed' ? 2 : e.length === 1 ? 1 : 3)) });
});
const lit = 'const LEVELS = [\n' + OUT.map(L => `  { name: '${L.name}', diff: '${L.diff}', hue: ${L.hue}, speed: ${L.speed}, recipe: [\n    ` +
  L.recipe.map(e => JSON.stringify(e).replace(/"/g, "'")).join(', ').replace(/(([^\]]*\]){6}), /g, '$1,\n    ') + ` ]}`).join(',\n') + ',\n];';
fs.writeFileSync(__dirname + '/levels_lit.js', lit); console.log('Wrote tools/levels_lit.js. Paste it over the LEVELS array in js/core.js.');
