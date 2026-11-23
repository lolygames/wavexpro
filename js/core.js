// ===== Wave X core: physics, collision, level data (shared by game + solver) =====
const H = 10;                                  // world height in units
const MODES = { wave: { slope: 1, r: 0.3 }, mini: { slope: 2, r: 0.17 } };
const DT = 1 / 240;                            // fixed physics step

// --- level-building helpers (levels are just arrays of plain objects) ---
function zig(x0, y0, h, segs) {                // corridor path; segs = [dx, dy]
  const pts = [[x0, y0]]; let x = x0, y = y0;
  for (const [dx, dy] of segs) { x += dx; y += dy; pts.push([x, y]); }
  return { t: 'corr', x0, x1: x, pts, h };
}
function pill(x, side, len, w = 1.1, spike = 0) {
  const o = [{ t: 'block', x, y: side === 'top' ? H - len : 0, w, h: len }];
  if (spike) o.push(side === 'top'
    ? { t: 'spike', x, y: H - len, w, h: spike, dir: -1 }
    : { t: 'spike', x, y: len, w, h: spike, dir: 1 });
  return o;
}
const saw = (x, y, r) => ({ t: 'saw', x, y, r });
// pendulum saw: bobs up and down; its y depends only on the rider's x, so replays stay exact
const osc = (x, y, r, a, f, ph) => ({ t: 'osc', x, y, r, a, f, ph });
const oscY = (o, px) => o.y + o.a * Math.sin(px * o.f + o.ph);
const portal = (x, kind, v) => ({ t: 'portal', x, kind, v });
const mod = (a, n) => ((a % n) + n) % n;
// moving laser gate: a floor-to-ceiling beam with an opening that slides between two marked limits.
// blink (optional): the beam switches off while mod(px - k, P) < L
const laserY = (o, px) => o.c + o.a * Math.sin(px * o.f + o.ph);
const laserOn = (o, px) => !o.P || mod(px - o.k, o.P) >= o.L;
// disappearing block: gone while mod(px - k, P) < L, solid otherwise
const fadeOn = (o, px) => mod(px - o.k, o.P) >= o.L;
// sliding saw: moves left and right along a marked track
const hsawX = (o, px) => o.x + o.a * Math.sin(px * o.f + o.ph);

const LEVELS = [
  { name: 'First light', diff: 'Easy', hue: 0, speed: 8, recipe: [
    ['zig',0.01,0], ['saw',0.03,1], ['gate',0.04,2], ['pil',0.06,3], ['dia',0.08,4], ['pil',0.11,5],
    ['dia',0.14,6], ['zig',0.16,7], ['saw',0.18,8], ['gate',0.21,9], ['saw',0.23,10], ['gate',0.25,11],
    ['pil',0.27,12], ['dia',0.28,13] ]},
  { name: 'Tight weave', diff: 'Normal', hue: 1, speed: 9, recipe: [
    ['gate',0.16,100], ['zig',0.17,101], ['pil',0.18,102], ['saw',0.19,103], ['zig',0.21,104], ['saw',0.22,105],
    ['zig',0.23,106], ['gate',0.25,107], ['zig',0.26,108], ['mini'], ['pil',0.27,110], ['zig',0.29,111],
    ['wave'], ['pil',0.3,113], ['saw',0.31,114], ['zig',0.33,115], ['gate',0.34,116], ['zig',0.35,117],
    ['gate',0.36,118], ['zig',0.38,119], ['pil',0.39,120] ]},
  { name: 'Canyon run', diff: 'Normal', hue: 3, speed: 9.5, recipe: [
    ['zig',0.26,200], ['pil',0.27,201], ['zig',0.28,202], ['gate',0.29,203], ['dia',0.3,204], ['gate',0.32,205],
    ['mini'], ['zig',0.33,207], ['pil',0.34,208], ['zig',0.35,209], ['wave'], ['pil',0.36,211],
    ['zig',0.37,212], ['gate',0.38,213], ['dia',0.4,214], ['zig',0.41,215], ['dia',0.43,216], ['mini'],
    ['zig',0.44,218], ['pil',0.45,219], ['wave'], ['zig',0.46,221], ['gate',0.48,222], ['zig',0.49,223] ]},
  { name: 'Sawmill', diff: 'Hard', hue: 2, speed: 10, recipe: [
    ['dia',0.35,300], ['zig',0.37,301], ['saw',0.38,302], ['dia',0.4,303], ['zig',0.41,304], ['dia',0.42,305],
    ['zig',0.44,306], ['saw',0.45,307], ['dia',0.46,308], ['mini'], ['saw',0.48,310], ['zig',0.49,311],
    ['zig',0.5,312], ['saw',0.51,313], ['wave'], ['zig',0.52,315], ['saw',0.53,316], ['dia',0.54,317],
    ['speed',11], ['zig',0.56,319], ['saw',0.57,320], ['dia',0.58,321], ['zig',0.59,322], ['dia',0.6,323] ]},
  { name: 'Speed trap', diff: 'Hard', hue: 4, speed: 9, recipe: [
    ['saw',0.4,400], ['dia',0.42,401], ['speed',10.5], ['pil',0.43,403], ['gate',0.44,404], ['zig',0.45,405],
    ['gate',0.46,406], ['zig',0.47,407], ['speed',12], ['saw',0.47,409], ['dia',0.48,410], ['pil',0.5,411],
    ['speed',9], ['dia',0.5,413], ['mini'], ['pil',0.52,415], ['wave'], ['gate',0.53,417],
    ['speed',12.5], ['zig',0.54,419], ['saw',0.55,420], ['zig',0.55,421], ['saw',0.56,422], ['dia',0.57,423],
    ['pil',0.58,424], ['speed',11], ['gate',0.59,426], ['pil',0.6,427] ]},
  { name: 'Needle', diff: 'Harder', hue: 0, speed: 9.5, recipe: [
    ['zig',0.41,500], ['mini'], ['pil',0.42,502], ['saw',0.44,503], ['gate',0.46,504], ['zig',0.48,505],
    ['gate',0.49,506], ['zig',0.5,507], ['pil',0.51,508], ['saw',0.53,509], ['pil',0.54,510], ['wave'],
    ['saw',0.56,512], ['gate',0.58,513], ['mini'], ['zig',0.6,515], ['pil',0.61,516], ['saw',0.63,517],
    ['gate',0.65,518], ['saw',0.66,519], ['gate',0.68,520], ['zig',0.69,521], ['pil',0.7,522], ['zig',0.72,523],
    ['pil',0.73,524], ['wave'], ['saw',0.75,526] ]},
  { name: 'Overdrive', diff: 'Insane', hue: 1, speed: 11, recipe: [
    ['dia',0.56,600], ['zig',0.57,601], ['pil',0.59,602], ['gate',0.61,603], ['saw',0.62,604], ['gate',0.64,605],
    ['mini'], ['saw',0.65,607], ['zig',0.66,608], ['pil',0.66,609], ['zig',0.67,610], ['wave'],
    ['pil',0.68,612], ['speed',12.5], ['gate',0.7,614], ['saw',0.71,615], ['dia',0.72,616], ['saw',0.74,617],
    ['dia',0.75,618], ['mini'], ['zig',0.77,620], ['pil',0.78,621], ['gate',0.79,622], ['wave'],
    ['pil',0.79,624], ['gate',0.8,625], ['saw',0.82,626], ['dia',0.83,627], ['zig',0.84,628] ]},
  { name: 'Final wave', diff: 'Insane', hue: 2, speed: 11.5, recipe: [
    ['gate',0.61,700], ['saw',0.62,701], ['zig',0.64,702], ['dia',0.66,703], ['mini'], ['pil',0.68,705],
    ['saw',0.7,706], ['zig',0.72,2707], ['wave'], ['dia',0.73,709], ['speed',13], ['pil',0.75,711],
    ['gate',0.76,712], ['zig',0.77,713], ['dia',0.79,714], ['mini'], ['pil',0.81,716], ['gate',0.82,717],
    ['saw',0.84,718], ['wave'], ['zig',0.85,720], ['speed',12], ['dia',0.86,722], ['pil',0.88,723],
    ['gate',0.89,724], ['saw',0.91,725], ['zig',0.92,726], ['mini'], ['zig',0.94,728], ['pil',0.95,729],
    ['wave'], ['speed',13], ['gate',0.96,732], ['saw',0.98,733], ['zig',0.99,734] ]},
  { name: 'Spike garden', diff: 'Hard', hue: 5, speed: 10, recipe: [
    ['zig',0.3,900], ['field',0.33,901], ['gate',0.36,902], ['field',0.4,903], ['mini'], ['zig',0.43,905],
    ['wave'], ['field',0.47,907], ['saw',0.5,908], ['field',0.53,909], ['zig',0.56,910], ['field',0.6,911] ]},
  { name: 'Pendulum', diff: 'Harder', hue: 6, speed: 10.5, recipe: [
    ['osc',0.35,1000], ['zig',0.4,1001], ['osc',0.44,1002], ['gate',0.48,1003], ['osc',0.52,1004], ['mini'],
    ['zig',0.55,1006], ['wave'], ['osc',0.6,1008], ['dia',0.62,1009], ['osc',0.66,1010], ['speed',12],
    ['zig',0.68,1012], ['osc',0.72,1013] ]},
  { name: 'Thorns & teeth', diff: 'Harder', hue: 3, speed: 11, recipe: [
    ['field',0.48,1100], ['saw',0.5,1101], ['osc',0.53,1102], ['zig',0.56,1103], ['field',0.59,1104], ['mini'],
    ['saw',0.61,1106], ['wave'], ['dia',0.64,1107], ['field',0.67,1108], ['osc',0.7,1109], ['gate',0.73,1110],
    ['field',0.76,1111] ]},
  { name: 'Event horizon', diff: 'Insane', hue: 5, speed: 12, recipe: [
    ['osc',0.58,1200], ['field',0.6,1201], ['zig',0.63,1202], ['speed',13], ['gate',0.66,1203], ['osc',0.69,1204],
    ['mini'], ['field',0.71,1206], ['wave'], ['saw',0.74,1207], ['dia',0.77,1208], ['osc',0.8,1209],
    ['speed',13.5], ['field',0.83,1210], ['zig',0.86,1211], ['osc',0.9,1212] ]},
  // Level 13 - Antigravity (~80 s). Gravity portals: ['flip'] = upside down (hold falls), ['norm'] = back to normal.
  // Act 1 warm-up / Act 2 first flip on a gentle corridor / Act 3 mini + flip / Act 4 speed-up and rapid flips /
  // Act 5 the long upside-down stretch / finale back on normal gravity.
  { name: 'Antigravity', diff: 'Harder', hue: 7, speed: 10, recipe: [
    ['gate',0.45,1300], ['zig',0.45,1301], ['saw',0.48,1302], ['pil',0.5,1303],
    ['flip'], ['zig',0.3,1304], ['gate',0.42,1305], ['pil',0.48,1306], ['norm'], ['saw',0.5,1307],
    ['mini'], ['zig',0.45,1308], ['flip'], ['zig',0.45,1309], ['gate',0.5,1310], ['wave'], ['dia',0.5,1311], ['norm'],
    ['field',0.5,1312], ['speed',11], ['saw',0.55,1313], ['flip'], ['osc',0.5,1314], ['gate',0.55,1315], ['norm'],
    ['zig',0.55,1316], ['flip'], ['pil',0.6,1317], ['norm'],
    ['gate',0.58,1322], ['flip'], ['saw',0.6,1323], ['zig',0.58,1324], ['field',0.6,1325], ['dia',0.6,1326], ['norm'],
    ['dia',0.62,1318], ['gate',0.62,1319], ['zig',0.62,1320] ]},
  // Level 14 - Gravity Rush (Insane, ~50 s), built to the level 14 design document. ['sec', n] marks its five
  // sections (the music builds with them); bpm snaps every transition and obstacle onto the music's beat;
  // 'ramp' portals change speed smoothly; exit: true ends the level in a glowing exit portal.
  { name: 'Gravity Rush', diff: 'Insane', hue: 8, speed: 11, bpm: 132, exit: true, recipe: [
    ['sec',1], ['zig',0.3,1400], ['field',0.3,1401], ['flip'], ['zig',0.5,1402],
    ['sec',2], ['stairs',0.45,1404], ['norm'], ['zig',0.55,1405], ['mini'], ['stairs',0.3,1406], ['zig',0.5,1417], ['wave'], ['ramp',11.5],
    ['sec',3], ['mirror',0.7,1407], ['flip'], ['mzig',0.7,1408], ['norm'], ['ramp',12], ['zig',0.66,1409],
      ['mini'], ['flip'], ['mzig',0.7,1410], ['norm'], ['wave'],
    ['sec',4], ['zig',1,1411], ['mini'], ['stairs',1,1412], ['flip'], ['ramp',12.5], ['zig',1,1420], ['mirror',1,1413], ['wave'], ['zig',1,1414],
    ['sec',5], ['norm'], ['ramp',11.5], ['zig',0.45,1415], ['mzig',0.45,1416] ]},
  // Level 15 - Laser Storm (Insane, ~55 s), built to the level 15 design document. Six sections; difficulty comes from
  // timing (moving and blinking lasers, disappearing doors, moving saws) rather than narrower corridors.
  // 'rev'/'fwd' mirror the screen left-to-right and back; secMusic maps the six sections onto the five music layers.
  { name: 'Laser Storm', diff: 'Insane', hue: 9, speed: 11.5, bpm: 132, exit: true, secMusic: [0, 1, 2, 3, 3, 4], recipe: [
    ['sec'], ['zig',0.3,1500], ['saw',0.3,1501], ['mzig',0.3,1502],
    ['sec'], ['laser',0.3,1503], ['ramp',12.5], ['zig',0.45,1504], ['ramp',11.5], ['laser',0.5,1505],
    ['sec'], ['doors',0.4,1506], ['msaw',0.45,1507], ['flip'], ['doors',0.6,1508], ['norm'],
    ['sec'], ['ramp',13], ['mini'], ['zig',0.45,1509], ['laser',0.7,1510], ['rev'], ['msaw',0.6,1511], ['fwd'], ['zig',0.55,1512], ['wave'],
    ['sec'], ['ramp',12], ['flip'], ['msaw',0.7,1513], ['zig',0.65,1515], ['norm'],
    ['sec'], ['ramp',11.5], ['mzig',0.25,1516] ]},
  // Level 16 - Crimson Core (Demon, ~75 s): the finale. An eerie quiet intro, a sudden drop, a gauntlet, one short
  // breather, then two back-to-back closing sections that combine every mechanic from levels 13-15, and a slow-down
  // escape. secBanner announces the breather and the final stretch; final: true gives it the bigger finish.
  { name: 'Crimson Core', diff: 'Demon', hue: 10, speed: 10.5, bpm: 132, exit: true, final: true,
    secMusic: [0, 3, 2, 0, 3, 3, 4], secBanner: { 1: ['THE DROP', 'here we go'], 3: ['HALFWAY', 'breathe'], 5: ['FINAL STRETCH', 'everything you know'] }, recipe: [
    ['sec'], ['mzig',0.1,1600], ['mzig',0.15,1621], ['zig',0.3,1601],
    ['sec'], ['ramp',12.5], ['laser',0.6,1602], ['zig',0.6,1603], ['msaw',0.55,1604], ['flip'], ['stairs',0.5,1605], ['norm'],
    ['sec'], ['doors',0.65,1606], ['mini'], ['laser',0.55,1607], ['wave'], ['mirror',0.6,1608], ['flip'], ['zig',0.6,1609], ['norm'],
    ['sec'], ['ramp',11], ['mzig',0.1,1610], ['mzig',0.1,1622],
    ['sec'], ['ramp',13], ['mini'], ['stairs',0.55,1611], ['rev'], ['msaw',0.6,1612], ['flip'], ['laser',0.6,1613], ['fwd'], ['norm'], ['wave'], ['doors',0.75,1614],
    ['sec'], ['ramp',13.5], ['flip'], ['zig',0.65,1615], ['rev'], ['laser',0.8,1616], ['mini'], ['msaw',0.7,1617], ['wave'], ['fwd'], ['mirror',0.85,1618], ['norm'], ['stairs',0.7,1619],
    ['sec'], ['ramp',11.5], ['mzig',0.3,1620] ]},
];

// --- section generator: a level is a recipe of sections, each [type, difficulty 0-1, seed] ---
// types: zig (corridor), pil (pillars), saw (edge saws), dia (saw diamond), gate (window gates)
// control entries: ['mini'] / ['wave'] switch mode, ['speed', v] changes speed,
//                  ['flip'] turns gravity upside down (hold = fall), ['norm'] turns it back
const SEC_LEAD = 7;                                   // open space before each section
function section(type, d, seed, x, mode) {
  const R = rng(seed * 7919 + 13), items = [], mini = mode === 'mini', slope = MODES[mode].slope;
  const lerp = (a, b) => a + (b - a) * d; let cx = x + SEC_LEAD;
  if (type === 'zig') {
    const h = mini ? lerp(1.05, 0.8) : lerp(1.9, 1.1), lo = h + 0.35, hi = H - h - 0.35;
    let y = 3.5 + R() * 3, dir = R() < 0.5 ? 1 : -1, len = 0; const y0 = y, segs = [], total = mini ? 10 + R() * 8 : 16 + R() * 10;
    while (len < total) {
      if (R() < 0.15 && h >= (mini ? 0.9 : 1.25)) { const f = 1.5 + R() * 1.5; segs.push([f, 0]); len += f; continue; }
      let a = 1.5 + R() * (mini ? 2.5 : 3);
      if (y + dir * a > hi || y + dir * a < lo) dir = -dir;
      a = Math.min(a, dir > 0 ? hi - y : y - lo); if (a < 1) { dir = -dir; continue; }
      y += dir * a; segs.push([a / slope, dir * a]); len += a / slope; dir = -dir;
    }
    const z = zig(cx, y0, h, segs); items.push(z); return { items, x: z.x1 };
  }
  if (type === 'pil' || type === 'saw') {
    const n = 4 + Math.floor(R() * 3), sp = lerp(6, 4.4) * (mini ? 0.85 : 1), w = mini ? 0.8 : 1.1;
    let top = R() < 0.5, last = 5;
    for (let i = 0; i < n; i++) {
      let e = top ? Math.max(last - 1, 3) + R() * 2 : Math.min(last + 1, 7) - R() * 2;
      e = Math.min(7.5, Math.max(2.5, e));
      if (type === 'pil') items.push(...pill(cx, top ? 'top' : 'bot', top ? H - e : e, w, R() < lerp(0.2, 0.7) ? 0.8 : 0));
      else { const r = 1.4 + R() * 0.6; items.push(saw(cx, top ? e + r : e - r, r)); }
      last = e; top = !top; cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'dia') {
    const g = 2 + Math.floor(R() * 2), sp = lerp(7, 5.5) * (mini ? 0.85 : 1), r = lerp(1.2, 1.5);
    for (let i = 0; i < g; i++) {
      items.push(saw(cx, 4.2 + R() * 1.6, r)); cx += sp;
      items.push(saw(cx, 1.4 + R() * 0.4, r), saw(cx, 8.6 - R() * 0.4, r)); cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'gate') {
    const n = 3 + Math.floor(R() * 3), sp = lerp(6, 4.5) * (mini ? 0.85 : 1), gap = mini ? lerp(2.4, 1.7) : lerp(3.4, 2.4), w = mini ? 0.8 : 1.1;
    let c = 5;
    for (let i = 0; i < n; i++) {
      const lo = gap / 2 + 0.8, hi = H - gap / 2 - 0.8, reach = (sp - w - 1.5) * slope * 0.6;
      c = Math.min(hi, Math.max(lo, c + (R() * 2 - 1) * Math.min(reach, 3)));
      items.push({ t: 'block', x: cx, y: 0, w, h: c - gap / 2 }, { t: 'block', x: cx, y: c + gap / 2, w, h: H - c - gap / 2 });
      cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'field') {                         // thorn field: weave over floor spikes and under ceiling spikes
    const n = 5 + Math.floor(R() * 3), sp = lerp(6, 4.6) * (mini ? 0.85 : 1), w = 1.0;
    let top = R() < 0.5;
    for (let i = 0; i < n; i++) {
      const h = lerp(2.6, 4.2) + R() * 1.0;
      if (top) items.push({ t: 'block', x: cx, y: H - 0.6, w, h: 0.6 }, { t: 'spike', x: cx, y: H - 0.6, w, h, dir: -1 });
      else items.push({ t: 'block', x: cx, y: 0, w, h: 0.6 }, { t: 'spike', x: cx, y: 0.6, w, h, dir: 1 });
      top = !top; cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'stairs') {                        // staircase spikes: stepped floor + ceiling, spike rows on every step
    const steps = 7 + Math.floor(R() * 3), sw = mini ? 1.6 : 2.0, rise = mini ? 0.7 : 0.95, sh = 0.5;
    const gap = mini ? lerp(2.5, 1.9) : lerp(3.6, 2.8);
    let c = 3.4 + R() * 3.2, dir = c < 5 ? 1 : -1;
    for (let i = 0; i < steps; i++) {
      const lo = c - gap / 2, hi = c + gap / 2;
      items.push({ t: 'block', x: cx, y: 0, w: sw, h: lo - sh, step: 1 }, { t: 'block', x: cx, y: hi + sh, w: sw, h: H - hi - sh, step: 1 });
      for (let k = 0; k < 2; k++) items.push({ t: 'spike', x: cx + k * sw / 2, y: lo - sh, w: sw / 2, h: sh, dir: 1 },
                                              { t: 'spike', x: cx + k * sw / 2, y: hi + sh, w: sw / 2, h: sh, dir: -1 });
      cx += sw;
      if (c + dir * rise - gap / 2 - sh < 1.1 || c + dir * rise + gap / 2 + sh > H - 1.1) dir = -dir;
      c += dir * rise;
    }
    return { items, x: cx };
  }
  if (type === 'mirror') {                        // symmetrical spikes: floor and ceiling mirror each other
    const n = 6 + Math.floor(R() * 3), sp = lerp(4.4, 3.6) * (mini ? 0.85 : 1), w = 1.0;
    const g = mini ? lerp(2.6, 2.0) : lerp(3.6, 2.8), weave = R() < 0.5, swing = mini ? 1.2 : lerp(1.4, 1.8);
    for (let i = 0; i < n; i++) {
      let gap = g, cc = 5;
      if (weave) cc = 5 + (i % 2 ? -swing : swing);                       // pairs mirrored about the centre line
      else { const k = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2); gap = g + (H - 3 - g) * (1 - k); }   // hourglass
      const hf = cc - gap / 2, hc = H - cc - gap / 2;
      items.push({ t: 'block', x: cx, y: 0, w, h: 0.45 }, { t: 'spike', x: cx, y: 0.45, w, h: (hf - 0.45) / 0.85, dir: 1 },
                 { t: 'block', x: cx, y: H - 0.45, w, h: 0.45 }, { t: 'spike', x: cx, y: H - 0.45, w, h: (hc - 0.45) / 0.85, dir: -1 });
      cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'mzig') {                          // symmetrical zigzag: the corridor's path reads the same both ways
    const h = mini ? lerp(1.0, 0.8) : lerp(1.75, 1.2), k = 3 + Math.floor(R() * 2), amps = [];
    for (let i = 0; i < k; i++) amps.push((mini ? 1.5 : 2.0) + R() * (mini ? 1.2 : 1.6));
    const seq = [...amps, ...amps.slice(0, -1).reverse()];
    let y = 0, lo = 0, hi = 0, sgn = R() < 0.5 ? 1 : -1; const segs = [];
    for (const a of seq) { y += sgn * a; lo = Math.min(lo, y); hi = Math.max(hi, y); segs.push([a / slope, sgn * a]); sgn = -sgn; }
    const room = (H - h - 0.35) - (h + 0.35), sc = hi - lo > room ? room / (hi - lo) : 1;
    for (const s of segs) { s[1] *= sc; s[0] = Math.abs(s[1]) / slope; }
    const y0 = 5 - (lo + hi) / 2 * sc, z = zig(cx, y0, h, segs); items.push(z); return { items, x: z.x1 };
  }
  if (type === 'laser') {                         // moving laser gates (+ blinking ones from d >= 0.5), small floor/ceiling thorns between
    const n = 5 + Math.floor(R() * 2), sp = lerp(8, 6.2), g = mini ? lerp(2.5, 1.9) : lerp(3.4, 2.6);
    for (let i = 0; i < n; i++) {
      const a = lerp(1.2, 2.0) * (mini ? 0.8 : 1), c0 = 5 + (R() - 0.5) * 1.2, f = lerp(0.42, 0.62), arrive = R() * 6.283;
      const o = { t: 'laser', x: cx, c: c0, a, g, f, ph: arrive - cx * f };
      if (d >= 0.5 && i % 2 === 1) { o.P = 7; o.L = 3.2; o.k = cx - 1.6 - (i % 4 === 1 ? 0 : 3.6); }   // alternate: off on arrival / on
      items.push(o);
      if (i < n - 1) { const top = i % 2 === 0, w = 0.9, h = lerp(0.9, 1.4);
        items.push({ t: 'spike', x: cx + sp / 2 - w / 2, y: top ? H : 0, w, h, dir: top ? -1 : 1 }); }
      cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'doors') {                         // disappearing path: each wall has two doors and only one is open as you arrive
    const n = 4 + Math.floor(R() * 2), sp = lerp(8.5, 6.5), w = 1.2, dh = mini ? lerp(2.1, 1.7) : lerp(3.0, 2.4);
    for (let i = 0; i < n; i++) {
      const lo = 2.9 + (R() - 0.5) * 0.6, hi = 7.1 + (R() - 0.5) * 0.6, open = R() < 0.5 ? 0 : 1, P = 9, L = 4.4;
      const yl = lo - dh / 2, yh = hi - dh / 2;
      items.push({ t: 'block', x: cx, y: 0, w, h: yl }, { t: 'block', x: cx, y: yl + dh, w, h: yh - yl - dh }, { t: 'block', x: cx, y: yh + dh, w, h: H - yh - dh });
      [yl, yh].forEach((y, j) => items.push({ t: 'fade', x: cx, y, w, h: dh, P, L, k: cx - 2.7 - (j === open ? 0 : P / 2) }));
      if (d >= 0.55 && i < n - 1 && i % 2 === 0) items.push(osc(cx + sp / 2 + 0.6, 5, 0.75, 2.4, 0.5, R() * 6.283));
      cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'msaw') {                          // moving saws: still, up-and-down, side-to-side and opposite pairs, in turn
    const n = 5 + Math.floor(R() * 2), sp = lerp(8, 6.2) * (mini ? 0.85 : 1), k0 = Math.floor(R() * 4);
    const r = mini ? 0.75 : lerp(0.95, 1.15);
    for (let i = 0; i < n; i++) {
      const kind = (k0 + i) % 4, y = 3 + R() * 4;
      if (kind === 0) items.push(saw(cx, y < 5 ? 1.2 + r * 0.4 : H - 1.2 - r * 0.4, r * 1.2));
      else if (kind === 1) items.push(osc(cx, 5, r, lerp(2.2, 3.2), 0.5 + R() * 0.25, R() * 6.283));
      else if (kind === 2) { const yy = R() < 0.5 ? 3 : 7; items.push({ t: 'hsaw', x: cx, y: yy, r, a: 1.8, f: 0.55, ph: R() * 6.283 }); }
      else { const ph = R() * 6.283; items.push(osc(cx, 2.8, r * 0.9, 1.3, 0.6, ph), osc(cx, 7.2, r * 0.9, 1.3, 0.6, ph + Math.PI)); }
      cx += sp;
    }
    return { items, x: cx };
  }
  if (type === 'osc') {                           // pendulum saws: bob between marked limits as you ride past
    const n = 3 + Math.floor(R() * 2), sp = lerp(9, 7) * (mini ? 0.9 : 1);
    for (let i = 0; i < n; i++) {
      items.push(osc(cx, 3.6 + R() * 2.8, lerp(1.0, 1.3), lerp(1.0, 1.9), 0.45 + R() * 0.35, R() * 6.283));
      cx += sp;
    }
    return { items, x: cx };
  }
}
// time (s) for a run to reach x, given the speed portals placed so far (runs move at a fixed pace, so this is exact)
function timeTo(L, items, xt) {
  const sp = items.filter(o => o.t === 'portal' && (o.kind === 'speed' || o.kind === 'ramp')).sort((a, b) => a.x - b.x);
  const st = { x: 0, speed: L.speed, speedT: null }; let t = 0, i = 0;
  while (st.x < xt) { rampSpeed(st); const px = st.x; st.x += st.speed * DT; t += DT;
    while (i < sp.length && px < sp[i].x && st.x >= sp[i].x) { if (sp[i].kind === 'speed') st.speed = sp[i].v; else st.speedT = sp[i].v; i++; } }
  return { t, speed: st.speedT != null ? st.speedT : st.speed };
}
function buildLevel(L) {
  let x = 4, mode = 'wave'; const items = [], cps = [], secX = [];
  // L.bpm: nudge every transition and every obstacle section forward onto the next music beat
  // (the music restarts with each attempt, so a fixed spot in the level is always heard at the same beat)
  const beat = L.bpm ? 60 / L.bpm : 0;
  const onBeat = px => { if (!beat) return px; const { t, speed } = timeTo(L, items, px); const tb = Math.ceil(t / beat - 1e-6) * beat; return px + (tb - t) * speed; };
  let lastP = -1e9;                                // two portals never share a spot: the second waits for the next beat
  const place = (lead, kind, v) => { const px = onBeat(Math.max(x + lead, lastP + (beat ? 3 : 0))); x = px - lead; lastP = px; items.push(portal(px, kind, v)); };
  for (const [type, d, seed] of L.recipe) {
    if (type === 'sec') { secX.push(x); continue; }
    if (type === 'mini' || type === 'wave') { place(2, type); mode = type; continue; }
    if (type === 'speed') { place(3, 'speed', d); continue; }
    if (type === 'ramp') { place(3, 'ramp', d); continue; }       // like a speed portal, but the speed changes smoothly
    if (type === 'flip' || type === 'norm' || type === 'rev' || type === 'fwd') { place(2, type); continue; }
    if (beat) x = onBeat(x + SEC_LEAD) - SEC_LEAD;
    cps.push(x + 0.5);
    const s = section(type, d, seed, x, mode); items.push(...s.items); x = s.x;
  }
  if (mode !== 'wave') items.push(portal(x + 2, 'wave'));
  return { items, end: x + 8, cps, secX, exit: !!L.exit };
}
// spatial window so collision only checks nearby objects
function bounds(o) { return o.t === 'corr' ? [o.x0, o.x1] : (o.t === 'saw' || o.t === 'osc') ? [o.x - o.r, o.x + o.r]
  : o.t === 'hsaw' ? [o.x - o.a - o.r, o.x + o.a + o.r] : o.t === 'laser' ? [o.x - 0.2, o.x + 0.2] : [o.x, o.x + (o.w || 0)]; }
function windowed(items) {
  const arr = items.map(o => { const [a, b] = bounds(o); o._a = a; o._b = b; return o; }).sort((p, q) => p._a - q._a);
  let maxW = 0; for (const o of arr) maxW = Math.max(maxW, o._b - o._a);
  return { arr, maxW, near(x0, x1) { const out = []; let lo = 0, hi = arr.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m]._a < x0 - maxW) lo = m + 1; else hi = m; }
    for (let i = lo; i < arr.length && arr[i]._a <= x1; i++) if (arr[i]._b >= x0) out.push(arr[i]); return out; } };
}

// --- endless generator: chunks guaranteed reachable from the previous exit ---
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function genChunk(R, x, yIn, diff) {
  // Endless v2: five chunk kinds. Pendulum saws (4) and thorn fields (3) only appear once the run warms up,
  // so the opening stays gentle. NOTE: expanding the kinds changed how seeds map to worlds, so ghosts and
  // leaderboard proofs recorded before this version no longer replay - old entries are hidden automatically.
  const items = []; const k0 = Math.floor(R() * 5), k = (k0 >= 3 && diff < 0.25) ? k0 - 3 : k0;
  const lerp = (a, b) => a + (b - a) * diff;
  if (k === 3) {                                   // thorn field
    const n = 4 + Math.floor(R() * 3), sp = lerp(6, 4.6); let px = x + 4, top = R() < 0.5;
    for (let i = 0; i < n; i++) {
      const h = lerp(2.6, 4.0) + R() * 0.8;
      if (top) items.push({ t: 'block', x: px, y: H - 0.6, w: 1, h: 0.6 }, { t: 'spike', x: px, y: H - 0.6, w: 1, h, dir: -1 });
      else items.push({ t: 'block', x: px, y: 0, w: 1, h: 0.6 }, { t: 'spike', x: px, y: 0.6, w: 1, h, dir: 1 });
      top = !top; px += sp;
    }
    return { items, x: px, y: 5 };
  }
  if (k === 4) {                                   // pendulum saws
    const n = 2 + Math.floor(R() * 2), sp = lerp(9, 7); let px = x + 5;
    for (let i = 0; i < n; i++) { items.push(osc(px, 3.6 + R() * 2.8, lerp(0.9, 1.25), lerp(0.9, 1.8), 0.45 + R() * 0.35, R() * 6.283)); px += sp; }
    return { items, x: px, y: 5 };
  }
  if (k === 0) {                                   // zigzag corridor
    const h = lerp(1.9, 1.1), lo = h + 0.4, hi = H - h - 0.4;
    let y = Math.min(hi, Math.max(lo, yIn + (R() * 2 - 1) * 3)), dir = R() < 0.5 ? 1 : -1;
    const segs = [], y0 = y; let len = 0, total = 14 + R() * 10;
    while (len < total) {
      let dx = 1.5 + R() * 2.5;
      if (R() < 0.15 && h > 1.2) { segs.push([dx, 0]); len += dx; continue; }
      if (y + dir * dx > hi || y + dir * dx < lo) dir = -dir;
      dx = Math.min(dx, dir > 0 ? hi - y : y - lo); if (dx < 1) { dir = -dir; continue; }
      y += dir * dx; segs.push([dx, dir * dx]); len += dx; dir = -dir;
    }
    const c = zig(x + 5, y0, h, segs); items.push(c);
    return { items, x: c.x1, y };
  }
  // alternating pillars (k=1) or edge saws (k=2)
  const n = 3 + Math.floor(R() * 3), sp = lerp(6, 4.4); let px = x + 4, top = R() < 0.5, last = yIn, y = yIn;
  for (let i = 0; i < n; i++) {
    let e = top ? Math.max(last - 1, 3) + R() * 2 : Math.min(last + 1, 7) - R() * 2;  // gap edge
    e = Math.min(7.5, Math.max(2.5, e));
    if (k === 1) items.push(...pill(px, top ? 'top' : 'bot', top ? H - e : e, 1.1, R() < 0.5 ? 0.8 : 0));
    else { const r = 1.4 + R() * 0.6; items.push(saw(px, top ? e + r : e - r, r)); }
    y = top ? e - 1 : e + 1; last = e; top = !top; px += sp;
  }
  return { items, x: px, y };
}

// --- endless world shared by the game and the score verifier ---
function endlessWorld(seed) {
  const R = rng(seed), w = { items: [], genX: 12, genY: 5 };
  w.feed = px => {
    while (w.genX < px + 70) {
      const d = Math.min(1, w.genX / 700), c = genChunk(R, w.genX, w.genY, d);
      w.items.push(...c.items); w.genX = c.x; w.genY = c.y;
      if (w.genX > 150 && R() < 0.25) w.items.push(portal(w.genX + 1, 'speed', Math.min(12, 9 + w.genX / 300)));
    }
    if (w.items.length > 60) { const cut = px - 25; w.items = w.items.filter(o => (o.x1 ?? (o.x + (o.w || o.r || 0))) > cut); }
  };
  return w;
}
// replays an endless run from its seed and the physics steps where the input flipped; returns distance at death
function replayEndless(seed, toggles, maxSteps = 240 * 900) {
  const w = endlessWorld(seed), p = { x: 0, y: 5, dir: -1, mode: 'wave', speed: 9, portal: null };
  let hold = false, ti = 0;
  for (let s = 0; s < maxSteps; s++) {
    if (s % 4 === 0) w.feed(p.x);
    while (ti < toggles.length && toggles[ti] <= s) { if (toggles[ti] === s) hold = !hold; ti++; }
    if (step(p, hold, w.items)) return p.x;
  }
  return p.x;
}

// --- collision ---
function corrY(c, x) {
  const p = c.pts;
  for (let i = 1; i < p.length; i++) if (x <= p[i][0]) {
    const [ax, ay] = p[i - 1], [bx, by] = p[i]; return ay + (by - ay) * (x - ax) / (bx - ax);
  }
  return p[p.length - 1][1];
}
function hitTri(px, py, ax, ay, bx, by, cx, cy, r) {
  const s = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay);
  if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return true;
  const seg = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1; let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x1 - dx * t, py - y1 - dy * t); };
  return Math.min(seg(ax, ay, bx, by), seg(bx, by, cx, cy), seg(cx, cy, ax, ay)) < r;
}
function isDead(items, x, y, r) {
  if (y - r < 0 || y + r > H) return true;
  for (const o of items) {
    if (o.t === 'corr') { if (x >= o.x0 && x <= o.x1 && Math.abs(y - corrY(o, x)) > o.h - r) return true; }
    else if (o.t === 'block') {
      if (x + r < o.x || x - r > o.x + o.w) continue;
      const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h));
      if (Math.hypot(x - cx, y - cy) < r * 0.8) return true;
    } else if (o.t === 'spike') {
      if (x + r < o.x || x - r > o.x + o.w) continue;
      if (hitTri(x, y, o.x + 0.12, o.y, o.x + o.w - 0.12, o.y, o.x + o.w / 2, o.y + o.dir * o.h * 0.85, r * 0.6)) return true;
    } else if (o.t === 'saw') { if (Math.hypot(x - o.x, y - o.y) < o.r * 0.9 + r * 0.6) return true; }
    else if (o.t === 'osc') { if (Math.hypot(x - o.x, y - oscY(o, x)) < o.r * 0.9 + r * 0.6) return true; }
    else if (o.t === 'hsaw') { if (Math.hypot(x - hsawX(o, x), y - o.y) < o.r * 0.9 + r * 0.6) return true; }
    else if (o.t === 'laser') {
      if (Math.abs(x - o.x) < 0.12 + r * 0.6 && laserOn(o, x) && Math.abs(y - laserY(o, x)) > o.g / 2 - r * 0.6) return true;
    } else if (o.t === 'fade') {
      if (x + r < o.x || x - r > o.x + o.w || !fadeOn(o, x)) continue;
      const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h));
      if (Math.hypot(x - cx, y - cy) < r * 0.8) return true;
    }
  }
  return false;
}
const RAMP = 3;                                   // units/s per second for 'ramp' speed portals
function rampSpeed(st) {
  if (st.speedT == null || st.speedT === st.speed) return;
  const d = st.speedT - st.speed, m = RAMP * DT; st.speed = Math.abs(d) <= m ? st.speedT : st.speed + Math.sign(d) * m;
}
// one physics step; returns true if dead
function step(st, hold, items) {
  rampSpeed(st);
  const prevX = st.x; const m = MODES[st.mode];
  st.x += st.speed * DT; st.dir = (hold ? 1 : -1) * (st.grav ? -1 : 1);   // upside-down gravity: hold falls, release rises
  st.y += st.dir * m.slope * st.speed * DT;
  for (const o of items) if (o.t === 'portal' && prevX < o.x && st.x >= o.x) {
    if (o.kind === 'speed') st.speed = o.v;
    else if (o.kind === 'ramp') st.speedT = o.v;
    else if (o.kind === 'flip') st.grav = true;
    else if (o.kind === 'rev') st.rev = true;          // mirror screen: purely visual, the physics never changes
    else if (o.kind === 'fwd') st.rev = false;
    else if (o.kind === 'norm') st.grav = false;
    else st.mode = o.kind;
    st.portal = o;
  }
  return isDead(items, st.x, st.y, MODES[st.mode].r);
}
if (typeof module !== 'undefined') module.exports = { H, MODES, DT, LEVELS, step, isDead, genChunk, rng, buildLevel, windowed, section, endlessWorld, replayEndless };
