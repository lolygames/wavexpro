// ===== Wave X game: rendering, input, audio, UI =====
const cv = document.getElementById('c'), g = cv.getContext('2d');
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('wavex:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('wavex:' + k, JSON.stringify(v)); } catch {} },
};
const THEMES = [
  { top: '#1a1046', bot: '#46196b', wall: '#120a34', edge: '#8ec5ff' },
  { top: '#0d1a45', bot: '#0f5266', wall: '#0a1430', edge: '#8ff0d2' },
  { top: '#290d36', bot: '#6a1a3f', wall: '#1d0927', edge: '#ffc27a' },
  { top: '#2b1208', bot: '#7a3414', wall: '#1e0c05', edge: '#7fe3e0' },
  { top: '#0b2a24', bot: '#1f5c3a', wall: '#071c17', edge: '#d9ff8f' },
  { top: '#071a33', bot: '#123f6e', wall: '#050f22', edge: '#ffd166' },
  { top: '#200a3c', bot: '#5a1270', wall: '#140626', edge: '#ff7ad1' },
  { top: '#1d0b2e', bot: '#0d4f57', wall: '#12061f', edge: '#ff5fa2' },   // Antigravity: magenta sky over a teal floor
  { top: '#03040d', bot: '#0a1838', wall: '#02030a', edge: '#3cf2ff', tunnel: true },   // Gravity Rush: dark neon gravity tunnel
  { top: '#070418', bot: '#1d0a3f', wall: '#040311', edge: '#3cf2ff', tunnel: true },   // Laser Storm: cyan walls in a purple tunnel
  { top: '#110205', bot: '#3d0712', wall: '#080103', edge: '#ff3b4f', tunnel: true },   // Crimson Core: blood-red finale
];
const BUILT = LEVELS.map(L => { const B = buildLevel(L); B.W = windowed(B.items);
  let x = 0, v = L.speed, t = 0; for (const p of B.items.filter(o => o.t === 'portal' && (o.kind === 'speed' || o.kind === 'ramp')).sort((a, b) => a.x - b.x)) { t += (p.x - x) / v; x = p.x; v = p.v; }
  B.secs = Math.round(t + (B.end - x) / v); return B; });
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
// ---------- GeoDash.org branding + copy detection ----------
// hosts: where the game is allowed to run. hardLock: true blocks play entirely on other sites (use for production builds).
const SITE = { home: 'https://geodash.org/', hosts: ['geodash.org'], dev: ['localhost', '127.0.0.1'], hardLock: false };
const LOGO_O = new Path2D('M36.55 15.20Q36.00 17.80 36.00 19.45Q36.00 21.10 36.40 23.20Q36.80 25.30 38.10 27.90Q39.40 30.50 41.20 32.10Q43.00 33.70 45.00 34.50Q47.00 35.30 48.55 35.60Q50.10 35.90 52.25 35.80Q54.40 35.70 56.05 35.15Q57.70 34.60 58.25 34.60Q58.80 34.60 60.20 35.20Q61.60 35.80 62.55 35.85Q63.50 35.90 64.50 35.55Q65.50 35.20 66.50 34.40Q67.50 33.60 71.15 34.25Q74.80 34.90 80.15 34.75Q85.50 34.60 86.90 34.35Q88.30 34.10 89.50 33.65Q90.70 33.20 92.15 31.75Q93.60 30.30 94.05 30.50Q94.50 30.70 95.75 31.85Q97.00 33.00 98.15 33.65Q99.30 34.30 100.70 34.80Q102.10 35.30 103.75 35.60Q105.40 35.90 107.35 35.85Q109.30 35.80 111.80 35.15Q114.30 34.50 115.45 33.90Q116.60 33.30 118.40 31.75Q120.20 30.20 120.55 30.20Q120.90 30.20 121.10 30.40Q121.30 30.60 121.70 31.55Q122.10 32.50 122.70 33.05Q123.30 33.60 124.20 33.95Q125.10 34.30 126.75 34.60Q128.40 34.90 132.25 34.90Q136.10 34.90 138.80 34.25Q141.50 33.60 143.70 32.35Q145.90 31.10 146.25 31.15Q146.60 31.20 147.10 32.00Q147.60 32.80 148.40 33.40Q149.20 34.00 150.10 34.25Q151.00 34.50 152.05 34.55Q153.10 34.60 154.45 34.15Q155.80 33.70 157.10 32.05Q158.40 30.40 158.95 30.25Q159.50 30.10 160.75 30.30Q162.00 30.50 162.70 31.55Q163.40 32.60 164.30 33.30Q165.20 34.00 167.75 34.45Q170.30 34.90 172.75 34.70Q175.20 34.50 176.55 34.00Q177.90 33.50 178.70 32.90Q179.50 32.30 179.90 32.30Q180.30 32.30 181.50 32.95Q182.70 33.60 185.45 34.40Q188.20 35.20 189.80 35.40Q191.40 35.60 193.65 35.45Q195.90 35.30 198.40 34.65Q200.90 34.00 201.80 33.55Q202.70 33.10 204.20 31.95Q205.70 30.80 206.15 31.05Q206.60 31.30 207.25 32.25Q207.90 33.20 208.50 33.55Q209.10 33.90 210.90 34.35Q212.70 34.80 214.10 34.85Q215.50 34.90 217.25 34.55Q219.00 34.20 219.80 33.80Q220.60 33.40 221.15 32.80Q221.70 32.20 222.40 30.75Q223.10 29.30 223.80 31.10Q224.50 32.90 225.15 33.55Q225.80 34.20 226.95 34.55Q228.10 34.90 229.85 34.90Q231.60 34.90 233.15 34.65Q234.70 34.40 235.75 33.85Q236.80 33.30 237.30 32.50Q237.80 31.70 238.10 29.90Q238.40 28.10 238.40 23.00Q238.40 17.90 238.05 12.95Q237.70 8.00 237.35 7.25Q237.00 6.50 236.35 5.85Q235.70 5.20 234.80 4.80Q233.90 4.40 232.50 4.20Q231.10 4.00 228.75 4.15Q226.40 4.30 225.85 4.60Q225.30 4.90 224.25 6.15Q223.20 7.40 221.90 6.20Q220.60 5.00 219.05 4.50Q217.50 4.00 215.30 4.00Q213.10 4.00 211.35 4.30Q209.60 4.60 208.90 4.95Q208.20 5.30 207.35 6.25Q206.50 7.20 206.10 7.20Q205.70 7.20 203.70 6.10Q201.70 5.00 198.50 4.30Q195.30 3.60 192.40 3.70Q189.50 3.80 187.05 4.45Q184.60 5.10 183.50 5.70Q182.40 6.30 181.50 7.15Q180.60 8.00 179.60 10.05Q178.60 12.10 178.45 12.90Q178.30 13.70 178.35 15.05Q178.40 16.40 178.75 17.60Q179.10 18.80 180.05 20.30Q181.00 21.80 180.95 22.20Q180.90 22.60 180.15 23.15Q179.40 23.70 179.15 23.70Q178.90 23.70 178.55 23.40Q178.20 23.10 176.95 20.10Q175.70 17.10 174.05 13.80Q172.40 10.50 171.35 8.80Q170.30 7.10 169.10 5.95Q167.90 4.80 165.95 4.15Q164.00 3.50 162.00 3.80Q160.00 4.10 159.10 4.60Q158.20 5.10 157.00 6.45Q155.80 7.80 153.95 11.35Q152.10 14.90 151.55 15.40Q151.00 15.90 150.65 15.60Q150.30 15.30 149.25 13.05Q148.20 10.80 146.70 9.20Q145.20 7.60 143.10 6.40Q141.00 5.20 138.50 4.65Q136.00 4.10 133.05 4.05Q130.10 4.00 127.55 4.35Q125.00 4.70 124.00 5.15Q123.00 5.60 122.60 6.00Q122.20 6.40 121.75 7.35Q121.30 8.30 120.90 8.50Q120.50 8.70 118.60 7.10Q116.70 5.50 115.65 4.95Q114.60 4.40 112.00 3.75Q109.40 3.10 107.35 3.05Q105.30 3.00 103.50 3.35Q101.70 3.70 100.20 4.20Q98.70 4.70 96.50 6.45Q94.30 8.20 93.85 8.30Q93.40 8.40 92.55 7.40Q91.70 6.40 90.75 5.85Q89.80 5.30 87.35 4.80Q84.90 4.30 79.60 4.15Q74.30 4.00 72.40 4.25Q70.50 4.50 68.95 5.05Q67.40 5.60 66.35 6.75Q65.30 7.90 65.00 7.90Q64.70 7.90 63.05 6.60Q61.40 5.30 59.85 4.60Q58.30 3.90 55.90 3.45Q53.50 3.00 51.70 3.05Q49.90 3.10 47.90 3.55Q45.90 4.00 44.65 4.55Q43.40 5.10 42.40 5.75Q41.40 6.40 40.40 7.40Q39.40 8.40 38.25 10.50Q37.10 12.60 36.55 15.20ZM139.00 17.35Q139.30 16.80 139.70 17.05Q140.10 17.30 140.30 17.90Q140.50 18.50 140.45 19.70Q140.40 20.90 140.00 21.50Q139.60 22.10 139.30 22.00Q139.00 21.90 138.85 21.45Q138.70 21.00 138.70 19.45Q138.70 17.90 139.00 17.35ZM106.55 16.60Q106.90 16.10 107.35 16.55Q107.80 17.00 108.00 18.35Q108.20 19.70 108.10 20.75Q108.00 21.80 107.70 22.20Q107.40 22.60 106.95 22.05Q106.50 21.50 106.30 20.20Q106.10 18.90 106.15 18.00Q106.20 17.10 106.55 16.60ZM55.55 16.15Q55.90 15.60 56.20 15.60Q56.50 15.60 57.65 17.40Q58.80 19.20 58.75 19.55Q58.70 19.90 57.55 21.75Q56.40 23.60 55.85 23.20Q55.30 22.80 55.10 21.65Q54.90 20.50 55.05 18.60Q55.20 16.70 55.55 16.15ZM17.35 1.30Q17.10 1.30 16.60 2.00Q16.10 2.70 9.60 17.05Q3.10 31.40 3.00 32.05Q2.90 32.70 3.10 32.90Q3.30 33.10 3.65 33.10Q4.00 33.10 5.60 32.50Q7.20 31.90 8.05 31.85Q8.90 31.80 9.05 32.25Q9.20 32.70 8.60 34.15Q8.00 35.60 7.95 36.05Q7.90 36.50 8.05 36.75Q8.20 37.00 8.95 36.80Q9.70 36.60 13.70 34.65Q17.70 32.70 18.65 32.90Q19.60 33.10 22.95 34.80Q26.30 36.50 27.00 36.65Q27.70 36.80 27.85 36.20Q28.00 35.60 27.55 34.50Q27.10 33.40 27.15 32.90Q27.20 32.40 27.60 32.25Q28.00 32.10 29.85 32.60Q31.70 33.10 31.85 32.55Q32.00 32.00 25.05 16.90Q18.10 1.80 17.85 1.55Q17.60 1.30 17.35 1.30Z'), LOGO_F = new Path2D('M9.70 33.45Q9.10 34.70 9.25 35.05Q9.40 35.40 9.65 35.40Q9.90 35.40 13.25 33.70Q16.60 32.00 17.80 31.95Q19.00 31.90 22.50 33.65Q26.00 35.40 26.25 35.40Q26.50 35.40 26.65 35.20Q26.80 35.00 25.55 32.55Q24.30 30.10 23.40 30.00Q22.50 29.90 21.80 29.45Q21.10 29.00 20.30 28.95Q19.50 28.90 18.80 28.45Q18.10 28.00 17.05 28.50Q16.00 29.00 15.30 29.05Q14.60 29.10 13.40 29.70Q12.20 30.30 11.25 31.25Q10.30 32.20 9.70 33.45ZM209.80 6.85Q208.70 7.70 208.35 8.30Q208.00 8.90 208.00 19.45Q208.00 30.00 208.85 31.10Q209.70 32.20 210.30 32.55Q210.90 32.90 214.45 32.90Q218.00 32.90 218.35 32.75Q218.70 32.60 219.45 31.90Q220.20 31.20 220.55 30.60Q220.90 30.00 220.90 26.95Q220.90 23.90 221.40 23.40Q221.90 22.90 223.45 22.90Q225.00 22.90 225.45 23.25Q225.90 23.60 225.95 25.75Q226.00 27.90 225.70 28.80Q225.40 29.70 225.65 30.15Q225.90 30.60 226.00 31.45Q226.10 32.30 226.35 32.55Q226.60 32.80 230.30 32.85Q234.00 32.90 234.80 32.30Q235.60 31.70 236.25 30.35Q236.90 29.00 236.90 23.45Q236.90 17.90 236.40 16.95Q235.90 16.00 235.90 11.95Q235.90 7.90 235.75 7.60Q235.60 7.30 234.30 6.65Q233.00 6.00 229.95 6.00Q226.90 6.00 226.60 6.15Q226.30 6.30 225.70 7.40Q225.10 8.50 225.10 8.95Q225.10 9.40 225.55 10.15Q226.00 10.90 226.00 12.95Q226.00 15.00 225.65 15.45Q225.30 15.90 224.30 16.40Q223.30 16.90 222.75 16.80Q222.20 16.70 221.60 16.00Q221.00 15.30 220.95 11.60Q220.90 7.90 220.30 7.10Q219.70 6.30 219.35 6.15Q219.00 6.00 214.95 6.00Q210.90 6.00 209.80 6.85ZM125.55 6.15Q125.20 6.30 124.45 7.00Q123.70 7.70 123.35 8.30Q123.00 8.90 123.00 19.95Q123.00 31.00 123.15 31.30Q123.30 31.60 124.60 32.25Q125.90 32.90 132.45 32.90Q139.00 32.90 141.35 31.75Q143.70 30.60 145.15 29.15Q146.60 27.70 147.75 25.35Q148.90 23.00 148.90 19.45Q148.90 15.90 148.25 14.55Q147.60 13.20 146.90 12.45Q146.20 11.70 145.90 10.95Q145.60 10.20 145.15 9.75Q144.70 9.30 143.95 9.00Q143.20 8.70 142.45 8.00Q141.70 7.30 140.65 7.10Q139.60 6.90 138.80 6.45Q138.00 6.00 131.95 6.00Q125.90 6.00 125.55 6.15ZM138.95 13.90Q140.00 13.90 140.45 14.25Q140.90 14.60 141.45 15.75Q142.00 16.90 142.00 19.45Q142.00 22.00 141.15 23.45Q140.30 24.90 139.30 25.25Q138.30 25.60 137.75 25.15Q137.20 24.70 137.05 24.35Q136.90 24.00 136.90 19.45Q136.90 14.90 137.40 14.40Q137.90 13.90 138.95 13.90ZM69.55 6.65Q68.20 7.30 67.60 8.10Q67.00 8.90 66.95 19.45Q66.90 30.00 67.55 30.80Q68.20 31.60 69.55 32.25Q70.90 32.90 78.95 32.90Q87.00 32.90 88.65 32.00Q90.30 31.10 91.10 30.05Q91.90 29.00 91.85 28.30Q91.80 27.60 91.25 26.95Q90.70 26.30 90.35 26.15Q90.00 26.00 86.95 26.00Q83.90 26.00 83.55 25.85Q83.20 25.70 82.60 25.00Q82.00 24.30 82.10 23.75Q82.20 23.20 82.90 22.60Q83.60 22.00 85.80 21.95Q88.00 21.90 88.30 21.75Q88.60 21.60 88.75 21.30Q88.90 21.00 88.85 19.30Q88.80 17.60 88.40 17.30Q88.00 17.00 86.30 16.95Q84.60 16.90 83.45 16.30Q82.30 15.70 82.15 15.15Q82.00 14.60 82.60 13.90Q83.20 13.20 83.55 13.05Q83.90 12.90 86.95 12.90Q90.00 12.90 90.35 12.75Q90.70 12.60 91.30 11.80Q91.90 11.00 91.90 10.45Q91.90 9.90 91.55 9.30Q91.20 8.70 90.45 8.00Q89.70 7.30 88.65 7.10Q87.60 6.90 86.80 6.45Q86.00 6.00 78.45 6.00Q70.90 6.00 69.55 6.65ZM17.55 5.80Q17.30 5.70 15.70 8.65Q14.10 11.60 14.00 12.45Q13.90 13.30 11.00 18.95Q8.10 24.60 8.05 25.30Q8.00 26.00 7.25 27.75Q6.50 29.50 6.85 29.65Q7.20 29.80 7.90 29.40Q8.60 29.00 9.45 28.90Q10.30 28.80 11.10 28.35Q11.90 27.90 12.60 27.85Q13.30 27.80 13.90 27.40Q14.50 27.00 16.10 26.65Q17.70 26.30 18.25 26.60Q18.80 26.90 19.60 26.95Q20.40 27.00 21.10 27.45Q21.80 27.90 22.60 27.95Q23.40 28.00 23.95 28.40Q24.50 28.80 25.40 28.90Q26.30 29.00 27.15 29.40Q28.00 29.80 28.20 29.65Q28.40 29.50 28.40 29.25Q28.40 29.00 27.20 26.65Q26.00 24.30 25.90 23.45Q25.80 22.60 22.90 16.95Q20.00 11.30 19.90 10.45Q19.80 9.60 18.80 7.75Q17.80 5.90 17.55 5.80ZM192.95 5.00Q191.90 5.00 190.95 5.50Q190.00 6.00 188.45 6.00Q186.90 6.00 185.55 6.65Q184.20 7.30 182.75 8.75Q181.30 10.20 180.70 11.40Q180.10 12.60 180.05 14.30Q180.00 16.00 181.15 18.35Q182.30 20.70 182.75 21.15Q183.20 21.60 184.95 22.40Q186.70 23.20 187.25 23.75Q187.80 24.30 187.85 24.80Q187.90 25.30 187.60 25.60Q187.30 25.90 186.60 25.95Q185.90 26.00 184.60 25.05Q183.30 24.10 182.45 24.10Q181.60 24.10 180.95 24.65Q180.30 25.20 180.15 25.55Q180.00 25.90 180.00 27.45Q180.00 29.00 180.60 29.80Q181.20 30.60 183.40 31.70Q185.60 32.80 186.30 32.85Q187.00 32.90 187.95 33.40Q188.90 33.90 191.95 33.90Q195.00 33.90 195.95 33.40Q196.90 32.90 198.10 32.85Q199.30 32.80 200.50 32.20Q201.70 31.60 203.25 29.95Q204.80 28.30 204.85 27.60Q204.90 26.90 205.40 25.95Q205.90 25.00 205.90 24.45Q205.90 23.90 205.45 23.10Q205.00 22.30 204.90 21.45Q204.80 20.60 203.55 19.20Q202.30 17.80 201.25 17.25Q200.20 16.70 199.10 15.55Q198.00 14.40 198.00 14.00Q198.00 13.60 198.30 13.30Q198.60 13.00 198.95 13.00Q199.30 13.00 200.95 13.90Q202.60 14.80 203.45 14.80Q204.30 14.80 205.05 13.55Q205.80 12.30 205.85 11.15Q205.90 10.00 205.60 9.55Q205.30 9.10 204.75 8.90Q204.20 8.70 203.25 7.90Q202.30 7.10 201.60 7.05Q200.90 7.00 199.95 6.50Q199.00 6.00 197.45 6.00Q195.90 6.00 194.95 5.50Q194.00 5.00 192.95 5.00ZM160.25 6.10Q159.20 6.30 158.75 6.75Q158.30 7.20 158.00 7.95Q157.70 8.70 157.00 9.45Q156.30 10.20 154.70 13.40Q153.10 16.60 153.00 17.45Q152.90 18.30 152.00 19.95Q151.10 21.60 151.00 22.50Q150.90 23.40 150.00 25.00Q149.10 26.60 149.05 28.80Q149.00 31.00 149.15 31.35Q149.30 31.70 150.10 32.30Q150.90 32.90 152.60 32.85Q154.30 32.80 154.95 32.25Q155.60 31.70 155.90 30.45Q156.20 29.20 157.05 28.55Q157.90 27.90 159.95 27.90Q162.00 27.90 162.35 28.05Q162.70 28.20 163.20 28.70Q163.70 29.20 164.25 30.25Q164.80 31.30 165.85 32.10Q166.90 32.90 170.95 32.90Q175.00 32.90 176.30 32.25Q177.60 31.60 177.75 31.30Q177.90 31.00 177.90 28.95Q177.90 26.90 177.45 26.10Q177.00 25.30 176.90 24.45Q176.80 23.60 173.20 16.40Q169.60 9.20 168.15 7.75Q166.70 6.30 165.35 5.65Q164.00 5.00 163.45 5.00Q162.90 5.00 162.10 5.45Q161.30 5.90 160.25 6.10ZM158.75 21.35Q159.40 20.40 159.70 20.45Q160.00 20.50 160.50 21.15Q161.00 21.80 160.95 22.55Q160.90 23.30 160.45 23.65Q160.00 24.00 159.30 23.95Q158.60 23.90 158.30 23.60Q158.00 23.30 158.05 22.80Q158.10 22.30 158.75 21.35ZM100.25 6.10Q99.20 6.30 96.75 8.75Q94.30 11.20 94.10 12.25Q93.90 13.30 93.45 14.10Q93.00 14.90 93.00 19.45Q93.00 24.00 93.45 24.80Q93.90 25.60 94.10 26.65Q94.30 27.70 96.25 29.65Q98.20 31.60 100.55 32.75Q102.90 33.90 106.95 33.90Q111.00 33.90 111.80 33.45Q112.60 33.00 113.65 32.80Q114.70 32.60 117.15 30.15Q119.60 27.70 120.20 26.50Q120.80 25.30 120.90 24.40Q121.00 23.50 121.50 22.75Q122.00 22.00 122.00 19.45Q122.00 16.90 121.50 16.15Q121.00 15.40 120.90 14.50Q120.80 13.60 120.20 12.40Q119.60 11.20 118.90 10.45Q118.20 9.70 117.75 8.90Q117.30 8.10 116.75 7.90Q116.20 7.70 115.25 6.90Q114.30 6.10 113.60 6.05Q112.90 6.00 111.95 5.50Q111.00 5.00 106.95 5.00Q102.90 5.00 102.10 5.45Q101.30 5.90 100.25 6.10ZM105.45 13.25Q105.90 12.90 106.80 13.05Q107.70 13.20 108.20 13.70Q108.70 14.20 109.35 15.55Q110.00 16.90 110.00 19.95Q110.00 23.00 109.50 23.75Q109.00 24.50 108.30 25.05Q107.60 25.60 107.30 25.55Q107.00 25.50 106.10 24.60Q105.20 23.70 105.05 23.35Q104.90 23.00 104.90 21.95Q104.90 20.90 104.40 19.95Q103.90 19.00 103.90 17.95Q103.90 16.90 104.35 16.10Q104.80 15.30 104.90 14.45Q105.00 13.60 105.45 13.25ZM45.25 6.40Q42.60 7.80 41.45 9.00Q40.30 10.20 39.15 12.55Q38.00 14.90 38.00 19.45Q38.00 24.00 39.40 26.65Q40.80 29.30 42.50 30.95Q44.20 32.60 45.25 32.80Q46.30 33.00 47.10 33.45Q47.90 33.90 51.45 33.90Q55.00 33.90 56.80 32.95Q58.60 32.00 59.10 32.10Q59.60 32.20 59.95 32.90Q60.30 33.60 60.60 33.75Q60.90 33.90 62.45 33.90Q64.00 33.90 64.35 33.75Q64.70 33.60 65.25 32.95Q65.80 32.30 65.90 31.55Q66.00 30.80 66.00 26.85Q66.00 22.90 65.35 22.10Q64.70 21.30 64.35 21.15Q64.00 21.00 62.45 21.00Q60.90 21.00 60.55 21.15Q60.20 21.30 59.65 21.95Q59.10 22.60 58.90 23.65Q58.70 24.70 57.85 25.35Q57.00 26.00 56.10 25.85Q55.20 25.70 54.70 25.20Q54.20 24.70 53.55 23.35Q52.90 22.00 52.90 19.45Q52.90 16.90 53.55 15.55Q54.20 14.20 54.70 13.70Q55.20 13.20 55.55 13.05Q55.90 12.90 56.60 12.95Q57.30 13.00 57.60 13.30Q57.90 13.60 58.60 15.15Q59.30 16.70 60.10 17.30Q60.90 17.90 62.10 17.85Q63.30 17.80 64.50 16.70Q65.70 15.60 65.85 14.75Q66.00 13.90 65.30 12.55Q64.60 11.20 63.90 10.45Q63.20 9.70 63.00 9.15Q62.80 8.60 62.00 8.15Q61.20 7.70 60.45 7.00Q59.70 6.30 58.65 6.10Q57.60 5.90 56.80 5.45Q56.00 5.00 51.95 5.00Q47.90 5.00 45.25 6.40Z');
function hostOk(hn) { hn = (hn || '').toLowerCase(); return [...SITE.hosts, ...SITE.dev].some(d => hn === d || hn.endsWith('.' + d)); }
function isCopy() {
  if (location.protocol === 'file:') return false;
  if (window.claude && typeof window.claude.use === 'function') return false;      // claude.ai preview
  let ok = hostOk(location.hostname);
  try { const anc = location.ancestorOrigins; if (anc) for (const o of anc) if (!hostOk(new URL(o).hostname)) ok = false; } catch {}
  return !ok;
}
const COPY = isCopy();
function brandURL(where) {
  const u = new URL(SITE.home); u.searchParams.set('utm_source', 'wavex'); u.searchParams.set('utm_medium', COPY ? 'copied-game' : 'game'); u.searchParams.set('utm_campaign', where);
  if (COPY) u.searchParams.set('utm_content', location.hostname || 'unknown'); return u.toString();
}
document.querySelectorAll('[data-brand]').forEach(a => a.href = brandURL(a.dataset.brand));
const HAZ = '#ff4f9a'; let TRAIL_A = [255, 107, 107], TRAIL_B = [255, 209, 102], PBODY = '#fff', PEDGE = '#ff6b6b';
// ---------- economy: gems, skins, daily gift ----------
const SKINS = [
  { id: 'classic', name: 'Classic', price: 0, body: '#ffffff', edge: '#ff6b6b', a: [255, 107, 107], b: [255, 209, 102] },
  { id: 'mint', name: 'Mint', price: 60, body: '#eafff7', edge: '#20b98a', a: [124, 245, 200], b: [142, 197, 255] },
  { id: 'glacier', name: 'Glacier', price: 120, body: '#f0f8ff', edge: '#3d8bff', a: [142, 197, 255], b: [235, 245, 255] },
  { id: 'plasma', name: 'Plasma', price: 180, body: '#fff0fb', edge: '#c13aff', a: [255, 79, 154], b: [160, 100, 255] },
  { id: 'ember', name: 'Ember', price: 250, body: '#fff4e6', edge: '#ff6a1a', a: [255, 60, 40], b: [255, 170, 40] },
  { id: 'toxic', name: 'Toxic', price: 320, body: '#f6ffe0', edge: '#5fae0a', a: [190, 255, 70], b: [40, 220, 120] },
  { id: 'gold', name: 'Gold', price: 450, body: '#fff8d6', edge: '#c9940f', a: [255, 200, 0], b: [255, 248, 200] },
  { id: 'prism', name: 'Prism', price: 700, body: '#ffffff', edge: '#ff4fd8', rainbow: true, a: [255, 0, 0], b: [0, 0, 255] },
  { id: 'synth', name: 'Synthwave', price: 550, body: '#ffe9fd', edge: '#ff3ad1', a: [255, 58, 209], b: [58, 246, 255] },
  { id: 'aurora', name: 'Aurora', price: 850, body: '#eafcf4', edge: '#28e0a4', a: [40, 224, 164], b: [122, 92, 255] },
  { id: 'nebula', name: 'Nebula', price: 1100, body: '#f3e9ff', edge: '#8a4dff', a: [138, 77, 255], b: [255, 122, 201] },
  { id: 'solar', name: 'Solar Flare', price: 1500, body: '#fffbe8', edge: '#ff9d1c', a: [255, 236, 64], b: [255, 64, 64] },
];
const TIER = [1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 8, 7, 9, 10, 14];   // gems per new 10% of best, by level
const econ = { gems: store.get('gems', 0), owned: store.get('owned', ['classic']), skin: store.get('skin', 'classic'),
  gift: store.get('gift', { day: null, streak: 0 }), music: store.get('music', true), shake: store.get('shake', true) };
function addGems(n) { if (!n) return; econ.gems += n; store.set('gems', econ.gems); renderGems(); }
function renderGems() { document.querySelectorAll('.gemCount').forEach(e => e.textContent = econ.gems.toLocaleString()); }
const skinOf = () => SKINS.find(s => s.id === econ.skin) || SKINS[0];
function hsl(h) { const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; }
function applySkin(t = 0) {
  const s = skinOf(); PBODY = s.body; PEDGE = s.edge;
  if (s.rainbow) { const h = (t * 90) % 360; TRAIL_A = hsl(h); TRAIL_B = hsl(h + 120); PEDGE = `rgb(${hsl(h + 60)})`; }
  else { TRAIL_A = s.a; TRAIL_B = s.b; }
}
function utcDay() { const d = new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
function dailySeed(key) { let h = 2166136261; for (const c of 'wavex-daily-' + key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 1000000000 || 1; }
function untilReset() { const n = new Date(), m = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1) - n.getTime(); const h = Math.floor(m / 36e5), mi = Math.floor(m / 6e4) % 60; return h ? `${h}h ${mi}m` : `${mi}m`; }
const encT0 = t => t.map((v, i) => (v - (i ? t[i - 1] : 0)).toString(36)).join(',');
const decT0 = s => { let a = 0; return s ? s.split(',').map(x => (a += parseInt(x, 36))) : []; };
const dayKey = (d = new Date()) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
function giftState() {
  const today = dayKey(), y = new Date(); y.setDate(y.getDate() - 1);
  const ready = econ.gift.day !== today, streak = ready ? (econ.gift.day === dayKey(y) ? econ.gift.streak % 7 + 1 : 1) : econ.gift.streak;
  return { ready, streak, amount: 30 + 10 * (streak - 1) };
}
const PCOL = { mini: '#7cf5c8', wave: '#8ec5ff', speed: '#ffd166', ramp: '#ffd166', flip: '#ff5fa2', norm: '#4fe0ff', rev: '#ffb347', fwd: '#9dff7a' };
const GRAV = '#ff5fa2';

// ---------- canvas sizing ----------
let W = 0, Hc = 0, S = 1, OY = 0, DPR = 1, LEAD = 0.3;
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; Hc = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(Hc * DPR);
  const portrait = Hc > W; S = Math.min(Hc / (H + 1.2), W / (portrait ? 10 : 15)); OY = (Hc - H * S) / 2; LEAD = portrait ? 0.22 : 0.3;
  const r = document.getElementById('rot'); if (r) r.hidden = !portrait;
}
addEventListener('resize', resize); resize();
const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), d: 0.05 + Math.random() * 0.25, s: Math.random() * 1.6 + 0.4 }));

// ---------- audio (all generated in code, no files) ----------
const A = { ctx: null, master: null, music: null, on: store.get('sound', true), next: 0, beat: 0, playing: false, duck: null };
function audioInit() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  try {
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = A.ctx.createGain(); A.master.gain.value = A.on ? 0.55 : 0; A.master.connect(A.ctx.destination);
    A.music = A.ctx.createGain(); A.music.gain.value = econ.music ? 0.5 : 0; A.music.connect(A.master);
    const len = A.ctx.sampleRate * 0.5; A.noise = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    setInterval(schedule, 25);
  } catch { A.ctx = null; }
}
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function tone(t, f, dur, type, vol, dest, f2) {
  const o = A.ctx.createOscillator(), v = A.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vol, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(v); v.connect(dest || A.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, vol, hp, dest) {
  const s = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), v = A.ctx.createGain();
  s.buffer = A.noise; f.type = 'highpass'; f.frequency.value = hp; v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(v); v.connect(dest || A.master); s.start(t); s.stop(t + dur + 0.02);
}
// four-chord loop per theme; 16th-note grid
const PROGS = [[57, 53, 48, 55], [50, 46, 53, 48], [52, 48, 55, 50], [55, 51, 46, 53], [53, 48, 50, 45], [48, 55, 51, 46], [58, 54, 49, 56], [52, 55, 48, 53], [50, 46, 53, 48], [53, 49, 56, 51], [45, 41, 48, 44]];
let musicTheme = 0, musicSec = -1;   // musicSec >= 0: the level drives the arrangement section by section (Gravity Rush)
function schedule() {
  if (!A.ctx || !A.playing) return;
  const spb = 60 / 132 / 4;
  while (A.next < A.ctx.currentTime + 0.12) {
    const t = A.next, b = A.beat, root = PROGS[musicTheme][(b >> 4) % 4], bar = b >> 4, phrase = (bar >> 3) % 4;
    const S = musicSec, sec = S >= 0;
    // S1 kick + bass + arp, S2 adds hats, S3 adds snare, S4 doubles everything up, S5 thins out for the escape
    const hats = sec ? S >= 1 : bar >= 4, snare = sec ? S >= 2 && S !== 4 || S === 4 && b % 32 >= 16 : bar >= 8;
    if (b % 4 === 0) tone(t, 150, 0.16, 'sine', 0.9, A.music, 40);
    if (S === 3 && b % 4 === 2) tone(t, 150, 0.1, 'sine', 0.5, A.music, 40);
    if (b % 4 === 2 && hats || S === 3 && b % 2 === 1) noise(t, 0.05, S === 3 ? 0.2 : 0.25, 7000, A.music);
    if (b % 2 === 0 || S === 3) tone(t, hz(root - 12 + (S === 3 && b % 4 === 3 ? 12 : 0)), spb * (S === 3 ? 0.9 : 1.8), 'sawtooth', 0.16, A.music);
    if (snare && (b % 16 === 4 || b % 16 === 12)) noise(t, 0.12, 0.35, 1800, A.music);
    const ARPS = [[0, 7, 12, 15, 19, 15, 12, 7], [0, 12, 7, 15, 12, 19, 15, 24], [0, 3, 7, 12, 7, 3, 12, 15], [12, 19, 24, 19, 15, 12, 7, 12]];
    if (sec || bar >= 2) tone(t, hz(root + 12 + ARPS[sec ? Math.min(S, 3) : phrase][b % 8]), spb * 0.9, 'triangle', 0.08, A.music);
    if (sec && S >= 2 && S !== 4 && b % 8 === 0) tone(t, hz(root + 24 + (S === 3 ? 7 : 0)), spb * 6, 'square', 0.035, A.music);
    if (!sec && phrase === 3 && b % 4 === 0) tone(t, hz(root + 24), spb * 3.5, 'square', 0.03, A.music);
    A.next += spb; A.beat++;
  }
}
function musicStart() { if (!A.ctx) return; A.playing = true; A.beat = G.state === 'play' ? Math.round((G.stepN || 0) * DT / (60 / 132 / 4)) : 0; A.next = A.ctx.currentTime + 0.05; A.music.gain.cancelScheduledValues(A.ctx.currentTime); A.music.gain.setValueAtTime(econ.music ? 0.5 : 0, A.ctx.currentTime); }
function musicStop() { A.playing = false; }
function sfx(kind) {
  if (!A.ctx || !A.on) return; const t = A.ctx.currentTime;
  if (kind === 'die') { noise(t, 0.35, 0.7, 300); tone(t, 320, 0.35, 'square', 0.18, null, 60); }
  if (kind === 'portal') { tone(t, 600, 0.18, 'triangle', 0.25, null, 1400); }
  if (kind === 'grav') { tone(t, 1400, 0.32, 'sine', 0.3, null, 260); tone(t + 0.02, 700, 0.3, 'triangle', 0.14, null, 130); }
  if (kind === 'speedup') { tone(t, 220, 0.45, 'sawtooth', 0.12, null, 900); noise(t, 0.4, 0.18, 4000); }
  if (kind === 'exit') { tone(t, 180, 0.5, 'sine', 0.35, null, 1600); [0, 7, 12, 19].forEach((n, i) => tone(t + 0.45 + i * 0.07, hz(74 + n), 0.5, 'triangle', 0.2)); }
  if (kind === 'rev') { tone(t, 900, 0.3, 'triangle', 0.22, null, 300); tone(t + 0.1, 300, 0.3, 'triangle', 0.18, null, 900); noise(t, 0.3, 0.15, 2500); }
  if (kind === 'gravback') { tone(t, 260, 0.3, 'sine', 0.3, null, 1400); tone(t + 0.02, 130, 0.28, 'triangle', 0.14, null, 700); }
  if (kind === 'win') [0, 4, 7, 12, 16].forEach((n, i) => tone(t + i * 0.09, hz(72 + n), 0.4, 'triangle', 0.22));
  if (kind === 'click') tone(t, 640, 0.06, 'square', 0.1, null, 900);
  if (kind === 'hover') tone(t, 1250, 0.04, 'sine', 0.045);
  if (kind === 'quest') [0, 7, 12].forEach((n, i) => tone(t + i * 0.07, hz(79 + n), 0.25, 'triangle', 0.18));
}
function setSound(on) {
  A.on = on; store.set('sound', on); $('setSfx').setAttribute('aria-pressed', on); $('muteBtn').textContent = on ? '♪' : '✕';
  $('muteBtn').setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
  if (A.master) A.master.gain.value = on ? 0.55 : 0;
}

// ---------- game state ----------
const G = { state: 'menu', lvl: 0, endless: false, items: [], end: 0, theme: THEMES[0], att: 1, p: null,
  trail: [], parts: [], shake: 0, deadT: 0, t: 0, flash: 0, genX: 0, genY: 5, R: null, menuCam: 0, best: 0, hintShown: false, practice: store.get('practice', false), cp: null, cpi: 0, W: null, cps: [], newBest: false };
let hold = false;

function startLevel(i) {
  if (COPY && SITE.hardLock) { $('copyDlg').hidden = false; return; }
  G.daily = i === 'daily'; G.endless = i === 'endless' || G.daily; G.lvl = i; G.att = 1; G.cp = null; G.race = null;
  if (G.daily) qAdd('daily');
  begin();
  for (const k of SCREENS) $(k).hidden = true; $('hud').hidden = false;
}
function begin() {
  if (G.endless) {
    G.dayK = utcDay();
    G.seed = G.daily ? dailySeed(G.dayK) : (Math.random() * 1e9) | 0;
    G.world = endlessWorld(G.seed); G.items = G.world.items; G.end = Infinity;
    const th = G.daily || G.race ? G.seed % THEMES.length : G.att % THEMES.length; G.theme = THEMES[th]; musicTheme = th; G.speed0 = 9;
  } else {
    const L = LEVELS[G.lvl], B = BUILT[G.lvl]; G.items = B.items; G.W = B.W; G.cps = B.cps; G.end = B.end; G.theme = THEMES[L.hue]; musicTheme = L.hue; G.speed0 = L.speed;
  }
  G.fx = !G.endless && BUILT[G.lvl].exit;              // Gravity Rush's own effects: flip bursts, speed lines, exit portal
  G.secX = !G.endless && BUILT[G.lvl].secX.length ? BUILT[G.lvl].secX : null; musicSec = G.secX ? 0 : -1;
  G.secMap = !G.endless && LEVELS[G.lvl].secMusic || null; G.secBan = !G.endless && LEVELS[G.lvl].secBanner || null;
  G.final = !G.endless && !!LEVELS[G.lvl].final; G.banner = null; G.secI = 0;
  G.speedFx = 0; G.suck = 0; G.mir = 1; G.revFx = 0;
  const fromCp = G.practice && !G.endless && G.cp;
  G.p = fromCp ? { ...G.cp } : { x: 0, y: 5, dir: -1, mode: 'wave', speed: G.speed0, portal: null };
  G.cpi = G.cps.findIndex(x => x > G.p.x + 0.01); if (G.cpi < 0) G.cpi = G.cps.length;
  G.newBest = false; G.gain = 0; updateBestMark(); applySkin();
  G.acc = 0; G.stepN = 0; G.lastHold = false; G.toggles = [];
  if (G.secX) setSec(Math.max(0, G.secX.filter(x => x <= G.p.x + 0.01).length - 1));
  if (G.p.rev) G.mir = -1;
  G.trail = []; G.state = 'play'; G.deadT = 0; G.flash = 0;
  if (!G.practice) qAdd('runs');
  $('att').textContent = (G.daily ? 'Daily ' : G.practice && !G.endless ? 'Practice ' : 'Attempt ') + G.att;
  musicStart();
  if (!G.hintShown && G.att === 1) { $('hint').style.opacity = 1; setTimeout(() => $('hint').style.opacity = 0, 2600); G.hintShown = true; }
}
function setSec(i) {
  const up = i > (G.secI || 0); G.secI = i;
  if (up && G.secBan && G.secBan[i] && G.state === 'play') {            // section banner (and a hit of flash + shake on the drop)
    G.banner = { txt: G.secBan[i][0], sub: G.secBan[i][1], t: 2.2 };
    if (i === 1) { G.flash = 0.7; if (econ.shake && !reduceMotion) G.shake = 0.3; }
  }
  musicSec = G.secMap ? G.secMap[Math.min(i, G.secMap.length - 1)] : i; }
function die() {
  G.state = 'dead'; G.deadT = 0; G.shake = reduceMotion || !econ.shake ? 0 : 0.35; G.flash = 1; sfx('die'); musicStop();
  if (econ.shake && navigator.vibrate) { try { navigator.vibrate(40); } catch {} }
  const { x, y } = G.p;
  for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 9;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.6, c: Math.random() < 0.5 ? TRAIL_A : TRAIL_B }); }
  if (G.daily) {
    const m = Math.floor(x), k = 'ghost:daily:' + G.dayK, g = store.get(k, null), pb = g ? g.d : 0;
    if (m > pb) { store.set(k, { t: encT0(G.toggles), d: m }); G.newBest = pb > 0; }
    G.gain = Math.floor(m / 20); if (m > 0) LB.submit(m, G.seed, G.toggles.slice(), 'daily');
  } else if (G.endless) {
    const m = Math.floor(x), pb = store.get('endless', 0); if (m > pb) { store.set('endless', m); G.newBest = pb > 0; }
    G.gain = Math.floor(m / 25); if (m > 0) LB.submit(m, G.seed, G.toggles.slice()); }
  else if (!G.practice) { const pc = Math.floor(100 * Math.min(1, x / G.end)); const k = 'best:' + LEVELS[G.lvl].name; const pb = store.get(k, 0);
    if (pc > pb) { store.set(k, pc); G.newBest = pb > 0 || pc >= 5; G.gain = (Math.floor(pc / 10) - Math.floor(pb / 10)) * TIER[G.lvl]; }
    if (pc >= 60) qAdd('pct60'); }
  if (G.endless && Math.floor(x) >= 150) qAdd('end150');
  addGems(G.gain); featsCheck();
}
function win() {
  G.state = 'win'; G.winT = 0; musicStop(); sfx('win'); G.gain = 0;
  if (navigator.vibrate && econ.shake) { try { navigator.vibrate([30, 40, 30]); } catch {} }
  // celebration burst at the finish line
  if (G.fx) { sfx('exit'); G.winY = G.p.y; } else
  if (!reduceMotion) for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 11;
    G.parts.push({ x: G.p.x, y: G.p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.9,
      c: Math.random() < 0.4 ? [255, 255, 255] : Math.random() < 0.5 ? TRAIL_A : TRAIL_B });
  }
  if (!G.practice) { const k = 'best:' + LEVELS[G.lvl].name, pb = store.get(k, 0);
    if (pb < 100) G.gain = (10 - Math.floor(pb / 10)) * TIER[G.lvl] + 10 * TIER[G.lvl]; store.set(k, 100); qAdd('clear'); }
  addGems(G.gain); $('winEarn').hidden = !G.gain;
  $('winTitle').textContent = G.practice ? 'Practice run complete' : G.final ? 'Crimson Core conquered!' : 'Level complete';
  $('winStat').textContent = G.practice ? `${LEVELS[G.lvl].name}, practised in ${G.att} ${G.att === 1 ? 'attempt' : 'attempts'}. Turn practice off and beat it in one go for 100%.`
    : G.final ? `You beat the final level of Wave X in ${G.att} ${G.att === 1 ? 'attempt' : 'attempts'}. Only the best get here.`
    : `${LEVELS[G.lvl].name}, finished in ${G.att} ${G.att === 1 ? 'attempt' : 'attempts'}.`;
  $('nextBtn').hidden = G.lvl >= LEVELS.length - 1; $('winTitle').classList.add('disp');
  featsCheck();
  setTimeout(() => { $('win').hidden = false; if (G.gain) countUp($('winEarn').querySelector('span'), G.gain, ' gems'); }, G.final ? 2200 : G.fx ? 1700 : 1150);
}
function exitBurst() {
  if (reduceMotion) return;
  for (let i = 0; i < (G.final ? 200 : 90); i++) { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 12;
    G.parts.push({ x: G.end, y: 5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.9,
      c: Math.random() < 0.4 ? [255, 255, 255] : Math.random() < 0.5 ? [60, 242, 255] : [255, 95, 162] }); }
}
// eased number count-up inside a DOM element
function countUp(el, n, suffix) {
  const t0 = performance.now();
  (function u() { const k = Math.min(1, (performance.now() - t0) / 700), e = 1 - Math.pow(1 - k, 3);
    el.textContent = '+' + Math.round(n * e) + suffix; if (k < 1) requestAnimationFrame(u); })();
}

// ---------- update ----------
function update(dt) {
  G.cpFlash = Math.max(0, (G.cpFlash || 0) - dt * 2); G.t += dt; G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, G.flash - dt * 3);
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 9 * dt; q.life -= dt; }
  G.parts = G.parts.filter(q => q.life > 0);
  if (G.state === 'menu') { G.menuCam += dt * 5; return; }
  if (G.p && G.mir != null) { const tg = G.p.rev ? -1 : 1; G.mir += Math.sign(tg - G.mir) * Math.min(Math.abs(tg - G.mir), dt * 6); }
  if (G.state === 'win') {
    const w0 = G.winT; G.winT += dt;
    if (G.fx) {                                    // drawn into the portal's centre, then it bursts
      const k = Math.min(1, G.winT / 0.55), e = k * k * (3 - 2 * k);
      G.p.x = G.end + 0.9 * e; G.p.y = G.winY + (5 - G.winY) * e; G.suck = e;
      if (G.final && w0 < 1.0 && G.winT >= 1.0) exitBurst();          // the finale bursts twice
      if (w0 < 0.55 && G.winT >= 0.55) { exitBurst(); G.flash = 0.8; if (econ.shake && !reduceMotion) G.shake = 0.2; }
    }
    return;
  }
  if (G.state === 'dead') { G.deadT += dt; if (G.deadT > (G.newBest || G.gain ? 1.15 : 0.75)) { G.att++; begin(); } return; }
  G.gravFx = Math.max(0, (G.gravFx || 0) - dt); G.speedFx = Math.max(0, (G.speedFx || 0) - dt);
  if (G.secX && G.p) { const s = G.secX.filter(x => x <= G.p.x).length - 1; if (s > G.secI) setSec(s); }
  G.revFx = Math.max(0, (G.revFx || 0) - dt); if (G.banner && (G.banner.t -= dt) <= 0) G.banner = null;
  if (G.state !== 'play') return;
  if (G.endless) { G.world.feed(G.p.x); G.items = G.world.items; }
  G.acc += dt;
  while (G.acc >= DT) {
    G.acc -= DT;
    if (hold !== G.lastHold) { G.lastHold = hold; if (!G.practice && G.toggles.length < 20000) G.toggles.push(G.stepN); }
    G.stepN++;
    const before = G.p.portal, near = G.endless ? G.items : G.W.near(G.p.x - 1.5, G.p.x + 1.5);
    if (step(G.p, hold, near)) { die(); break; }
    if (G.practice && !G.endless && G.cpi < G.cps.length && G.p.x >= G.cps[G.cpi]) { G.cp = { ...G.p }; G.cpi++; G.cpFlash = 1; }
    if (G.p.portal !== before) {
      const k = G.p.portal.kind;
      if (k === 'flip' || k === 'norm') { sfx(k === 'flip' ? 'grav' : 'gravback'); G.gravFx = 1.5; if (econ.shake && !reduceMotion) G.shake = Math.max(G.shake, 0.12);
        if (G.fx && !reduceMotion) for (let i = 0; i < 34; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
          G.parts.push({ x: G.p.x, y: G.p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 1.4, life: 0.4 + Math.random() * 0.5, c: k === 'flip' ? [255, 95, 162] : [79, 224, 255] }); } }
      else if (k === 'rev' || k === 'fwd') { sfx('rev'); G.revFx = 1.5;
        if (!reduceMotion) for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
          G.parts.push({ x: G.p.x, y: G.p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * 0.5, c: k === 'rev' ? [255, 179, 71] : [157, 255, 122] }); } }
      else if (k === 'ramp' && G.p.portal.v > G.p.speed) { sfx('speedup'); G.speedFx = 1.6; }
      else sfx('portal');
      if (!G.practice) { qAdd('portals'); if (k === 'mini') qAdd('mini'); }
    }
    if (G.p.x >= G.end) { win(); break; }
  }
  G.trail.push([G.p.x, G.p.y]);
  const camX = G.p.x - (W / S) * LEAD;
  while (G.trail.length > 2 && G.trail[0][0] < camX - 1) G.trail.shift();
  const pc = G.endless ? null : Math.min(100, Math.floor(100 * G.p.x / G.end));
  $('barFill').style.width = (G.endless ? Math.min(100, G.p.x / 7) : pc) + '%';
  $('pct').textContent = G.endless ? Math.floor(G.p.x) + 'm' : pc + '%';
}

// ---------- render ----------
let camX = 0;
const X = x => (x - camX) * S, Y = y => OY + (H - y) * S;
function drawSaw(cx, cy, r, T) {
  const n = 14, rot = G.t * 5;
  g.save(); g.translate(cx, cy); g.rotate(rot);
  g.fillStyle = HAZ; g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? r * 0.8 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.fill(); g.fillStyle = T.wall; g.beginPath(); g.arc(0, 0, r * 0.55, 0, 7); g.fill();
  g.strokeStyle = HAZ; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r * 0.25, 0, 7); g.stroke(); g.restore();
}
function glowLine(pts, color, w) {
  g.lineJoin = 'miter'; g.lineCap = 'butt';
  for (const [lw, a] of [[w * 4, 0.12], [w * 2, 0.25], [w, 1]]) {
    g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
    pts.forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.stroke();
  }
  g.globalAlpha = 1;
}
function drawLogo(x, y, h, mode, T) {         // mode: 'tint' (watermark) or 'full' (original colours)
  const sc = h / 38; g.save(); g.translate(x, y); g.scale(sc, sc);
  if (mode === 'tint') { g.globalAlpha = COPY ? 0.16 : 0.075; g.fillStyle = T.edge; g.fill(LOGO_O, 'evenodd'); g.globalAlpha = COPY ? 0.1 : 0.045; g.fillStyle = '#ffffff'; g.fill(LOGO_F, 'evenodd'); }
  else { const gr = g.createLinearGradient(0, 0, 0, 38); gr.addColorStop(0, '#ffb21c'); gr.addColorStop(1, '#ffe066'); g.globalAlpha = 0.9; g.fillStyle = '#000'; g.fill(LOGO_O, 'evenodd'); g.fillStyle = gr; g.fill(LOGO_F, 'evenodd'); }
  g.restore(); g.globalAlpha = 1;
}
function drawWatermark(T) {
  const h = H * S * 0.3, w = h * 240 / 38, P = w + Math.max(W * 0.9, w * 0.6), off = ((-camX * S * 0.35) % P + P) % P;
  const y = OY + (H * S - h) / 2 - h * 0.15;
  for (let x = off - P; x < W; x += P) {
    drawLogo(x, y, h, 'tint', T);
    g.globalAlpha = COPY ? 0.18 : 0.08; g.fillStyle = T.edge; g.font = `800 ${Math.round(h * 0.28)}px Unbounded, system-ui`; g.textAlign = 'center';
    g.fillText('GEODASH.ORG', x + w / 2, y + h * 1.45); g.globalAlpha = 1;
  }
}
function drawBoards(T) {
  if (G.state === 'menu') return;                    // menus carry their own branding
  const band = OY;
  if (band >= 80) {                                   // tall bands (phones held upright): full-colour logo boards
    const h = Math.min(band * 0.32, 46), w = h * 240 / 38, P = w + 70, off = ((-camX * S) % P + P) % P;
    for (const cy of [band * 0.62, Y(0) + band * 0.42]) for (let x = off - P; x < W; x += P) drawLogo(x, cy - h / 2, h, 'full', T);
  } else if (band >= 16) {                            // thin bands: a text strip along the floor
    const fs = Math.round(band * 0.42), txt = 'GEODASH.ORG', P = fs * 10.5, off = ((-camX * S) % P + P) % P;
    g.font = `800 ${fs}px Unbounded, system-ui`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = T.edge; g.globalAlpha = 0.4;
    for (let x = off - P; x < W; x += P) { g.fillText(txt, x, Y(0) + band * 0.55); g.fillText('▲', x + fs * 8.4, Y(0) + band * 0.55); }
    g.globalAlpha = 1; g.textBaseline = 'alphabetic';
  }
}
function draw() {
  const T = G.theme, viewW = W / S;
  if (G.state === 'menu') camX = G.menuCam % 480;
  else camX = G.p.x - viewW * LEAD;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const grd = g.createLinearGradient(0, 0, 0, Hc); grd.addColorStop(0, T.top); grd.addColorStop(1, T.bot);
  g.fillStyle = grd; g.fillRect(0, 0, W, Hc);
  if (G.shake > 0) g.translate((Math.random() - 0.5) * 14 * G.shake, (Math.random() - 0.5) * 14 * G.shake);
  // stars + parallax grid
  g.fillStyle = '#fff';
  for (const s of stars) { g.globalAlpha = 0.25 + s.d * 2; const x = ((s.x * W - camX * S * s.d) % W + W) % W; g.fillRect(x, s.y * Hc, s.s, s.s); }
  g.globalAlpha = 0.07; g.strokeStyle = T.edge; g.lineWidth = 1; g.beginPath();
  const gs = 2 * S, off = ((-camX * S * 0.5) % gs + gs) % gs;
  for (let x = off; x < W; x += gs) { g.moveTo(x, OY); g.lineTo(x, OY + H * S); }
  for (let y = 0; y <= H; y += 2) { g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); }
  g.stroke(); g.globalAlpha = 1;
  if (T.tunnel) {
    const vx = W * 0.62, vy = OY + H * S / 2, sp = G.state === 'menu' ? G.t : camX * 0.06;
    g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const z = ((i - sp) % 9 + 9) % 9 / 9, s = Math.pow(z, 2.2), rw = W * 0.9 * s + 20, rh = H * S * 0.55 * s + 12;
      g.strokeStyle = i % 3 ? T.edge : '#ff5fa2'; g.globalAlpha = 0.04 + 0.1 * z;
      g.strokeRect(vx - rw / 2, vy - rh / 2, rw, rh);
    }
    g.globalAlpha = 1;
  }
  drawWatermark(T);
  // floor and ceiling
  g.fillStyle = T.wall; g.globalAlpha = 0.82; g.fillRect(-20, -20, W + 40, OY + 20); g.fillRect(-20, Y(0), W + 40, Hc); g.globalAlpha = 1;
  drawBoards(T);
  glowLine([[camX - 2, H], [camX + viewW + 2, H]], T.edge, 2); glowLine([[camX - 2, 0], [camX + viewW + 2, 0]], T.edge, 2);
  if (G.state !== 'menu' && G.mir != null && G.mir !== 1) {   // mirror screen: the world flips left to right through a squeeze
    const m = Math.abs(G.mir) < 0.04 ? 0.04 * Math.sign(G.mir || 1) : G.mir;
    g.translate(W / 2, 0); g.scale(m, 1); g.translate(-W / 2, 0);
  }
  const L = camX - 4, Rr = camX + viewW + 4;
  const items = G.state === 'menu' ? BUILT[0].W.near(L, Rr) : G.endless ? G.items : G.W.near(L, Rr);
  for (const o of items) {
    const ox0 = o.t === 'corr' ? o.x0 : o.x - (o.r || 0), ox1 = o.t === 'corr' ? o.x1 : o.x + (o.w || o.r || 0);
    if (ox1 < L || ox0 > Rr) continue;
    if (o.t === 'corr') {
      const top = o.pts.map(([x, y]) => [x, y + o.h]), bot = o.pts.map(([x, y]) => [x, y - o.h]);
      g.fillStyle = T.wall;
      g.beginPath(); g.moveTo(X(o.x0), Y(H)); top.forEach(([x, y]) => g.lineTo(X(x), Y(y))); g.lineTo(X(o.x1), Y(H)); g.fill();
      g.beginPath(); g.moveTo(X(o.x0), Y(0)); bot.forEach(([x, y]) => g.lineTo(X(x), Y(y))); g.lineTo(X(o.x1), Y(0)); g.fill();
      glowLine([[o.x0, H], ...top, [o.x1, H]], T.edge, 2); glowLine([[o.x0, 0], ...bot, [o.x1, 0]], T.edge, 2);
    } else if (o.t === 'block') {
      g.fillStyle = T.wall; g.fillRect(X(o.x), Y(o.y + o.h), o.w * S, o.h * S);
      glowLine([[o.x, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h], [o.x + o.w, o.y], [o.x, o.y]], T.edge, 2);
    } else if (o.t === 'spike') {
      g.fillStyle = HAZ; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(X(o.x), Y(o.y)); g.lineTo(X(o.x + o.w / 2), Y(o.y + o.dir * o.h)); g.lineTo(X(o.x + o.w), Y(o.y)); g.fill(); g.globalAlpha = 1;
    } else if (o.t === 'saw') {
      drawSaw(X(o.x), Y(o.y), o.r * S, T);
    } else if (o.t === 'osc') {
      // pendulum saw: dashed track shows the full travel range, saw bobs along it
      const px = G.state === 'menu' ? camX + 4 : G.p.x, oy = oscY(o, px), cx = X(o.x);
      g.strokeStyle = HAZ; g.globalAlpha = 0.3; g.lineWidth = 2; g.setLineDash([5 , 6]);
      g.beginPath(); g.moveTo(cx, Y(o.y + o.a)); g.lineTo(cx, Y(o.y - o.a)); g.stroke();
      g.setLineDash([]); g.globalAlpha = 1;
      drawSaw(cx, Y(oy), o.r * S, T);
    } else if (o.t === 'hsaw') {
      const px = G.state === 'menu' ? camX + 4 : G.p.x;
      g.strokeStyle = HAZ; g.globalAlpha = 0.3; g.lineWidth = 2; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(X(o.x - o.a), Y(o.y)); g.lineTo(X(o.x + o.a), Y(o.y)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      drawSaw(X(hsawX(o, px)), Y(o.y), o.r * S, T);
    } else if (o.t === 'laser') drawLaser(o);
    else if (o.t === 'fade') drawFade(o, T);
    else if (o.t === 'portal') {
      const c = PCOL[o.kind], x = X(o.x), pulse = 0.5 + 0.5 * Math.sin(G.t * 8);
      g.fillStyle = c; g.globalAlpha = 0.1 + 0.08 * pulse; g.fillRect(x - S * 0.5, Y(H), S, H * S);
      g.globalAlpha = 1; glowLine([[o.x, 0], [o.x, H]], c, 3);
      g.font = `800 ${Math.round(S * 0.42)}px Unbounded, system-ui`; g.textAlign = 'center'; g.fillStyle = c;
      const lab = o.kind === 'speed' || o.kind === 'ramp' ? '››' : o.kind === 'flip' ? 'flip' : o.kind === 'norm' ? 'back' : o.kind === 'rev' ? 'rev' : o.kind === 'fwd' ? 'fwd' : o.kind === 'mini' ? 'mini' : 'wave';
      for (const yy of [2.5, 7.5]) ftext(lab, x, Y(yy));
    }
  }
  if (G.state !== 'menu' && G.fx && G.end - 3 < Rr) drawExit(T);
  else if (G.state !== 'menu' && isFinite(G.end) && G.end < Rr) {
    const x = X(G.end); for (let i = 0; i < H * 2; i++) { g.fillStyle = i % 2 ? '#fff' : T.wall; g.fillRect(x, Y(H) + i * S / 2, S * 0.5, S / 2); }
  }
  if (G.practice && !G.endless && G.state !== 'menu' && G.cp && G.cp.x > L && G.cp.x < Rr) {
    const x = X(G.cp.x), y = Y(G.cp.y), s = S * (0.35 + 0.25 * (G.cpFlash || 0));
    g.fillStyle = '#7cf5c8'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.fill();
  }
  if (skinOf().rainbow) applySkin(G.t);
  // trail: drawn in chunks so the colour fades from coral to amber without overlap beads
  if (G.state !== 'menu' && G.trail.length > 1) {
    const pts = G.trail, n = pts.length, k = Math.max(2, Math.ceil(n / 12)), wm = G.p.mode === 'mini' ? 0.6 : 1;
    g.lineJoin = 'miter'; g.lineCap = 'butt';
    for (const [lw, a] of [[S * 0.6, 0.16], [S * 0.22, 1]]) {
      for (let s = 0; s < n - 1; s += k) {
        const f = (s + k / 2) / n, c = TRAIL_A.map((v, j) => Math.round(v + (TRAIL_B[j] - v) * f));
        g.strokeStyle = `rgba(${c},${a * (0.25 + 0.75 * f)})`; g.lineWidth = lw * wm; g.beginPath();
        for (let i = s; i <= Math.min(n - 1, s + k); i++) i === s ? g.moveTo(X(pts[i][0]), Y(pts[i][1])) : g.lineTo(X(pts[i][0]), Y(pts[i][1]));
        g.stroke();
      }
    }
  }
  // speed-up streaks (Gravity Rush): brief, thin and at the screen edges so the path stays readable
  if (G.fx && G.state === 'play' && (G.speedFx > 0 || G.p.speedT != null && G.p.speedT > G.p.speed) && !reduceMotion) {
    const k = Math.max(Math.min(1, G.speedFx), G.p.speedT > G.p.speed ? 0.6 : 0);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const r = (i * 0.618) % 1, y = OY + (r < 0.5 ? r * 0.36 : 0.64 + (r - 0.5) * 0.72) * H * S, len = S * (2 + 3 * ((i * 0.37) % 1));
      const x = W - ((G.t * W * 2.2 + i * 197) % (W + len));
      g.globalAlpha = 0.22 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
    }
    g.globalAlpha = 1;
  }
  // upside-down gravity: a pink glow hugs the ceiling and the floor
  if (G.p && G.p.grav && G.state !== 'menu') {
    const gh = S * 1.1, pulse = 0.75 + 0.25 * Math.sin(G.t * 5);
    for (const [y0, y1] of [[Y(H), Y(H) + gh], [Y(0), Y(0) - gh]]) {
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(255,95,162,${0.32 * pulse})`); gr.addColorStop(1, 'rgba(255,95,162,0)');
      g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), W, gh);
    }
  }
  // player
  if (G.state === 'play' || G.state === 'win') {
    const p = G.p, m = MODES[p.mode], sz = m.r * S * 1.15 * (1 - 0.95 * (G.suck || 0)), ang = -Math.atan(p.dir * m.slope);   // Space Waves-like arrow proportion
    g.save(); g.translate(X(p.x), Y(p.y)); g.rotate(ang + (G.suck || 0) * 9);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, sz * 1.6); rg.addColorStop(0, 'rgba(255,209,102,0.5)'); rg.addColorStop(1, 'rgba(255,209,102,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, sz * 1.6, 0, 7); g.fill();
    g.fillStyle = PBODY; g.strokeStyle = p.grav ? GRAV : PEDGE; g.lineWidth = Math.max(2, sz * 0.18);
    g.beginPath(); g.moveTo(sz, 0); g.lineTo(-sz * 0.8, -sz * 0.7); g.lineTo(-sz * 0.4, 0); g.lineTo(-sz * 0.8, sz * 0.7); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  for (const q of G.parts) { g.globalAlpha = Math.min(1, q.life * 2); g.fillStyle = `rgb(${q.c})`; const s = S * 0.14; g.fillRect(X(q.x) - s / 2, Y(q.y) - s / 2, s, s); }
  g.globalAlpha = 1;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (G.state === 'dead') {
    // headline number pops in, NEW BEST pulses, gems count up
    const pk = Math.min(1, G.deadT * 5), pe = 1 + (1 - pk) * 0.35;
    g.font = `800 ${Math.round(S * (G.endless ? 0.8 : 0.9) * pe)}px Unbounded, system-ui`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.globalAlpha = pk;
    g.fillText(G.endless ? Math.floor(G.p.x) + 'm' : Math.floor(100 * Math.min(1, G.p.x / G.end)) + '%', W / 2, Hc / 2 + S * 0.3);
    if (G.newBest) { const bp = 1 + 0.06 * Math.sin(G.t * 10); g.font = `800 ${Math.round(S * 0.4 * bp)}px Unbounded, system-ui`; g.fillStyle = '#ffd166'; g.fillText('NEW BEST!', W / 2, Hc / 2 + S * 1.0); }
    if (G.gain) {
      const ge = 1 - Math.pow(1 - Math.min(1, Math.max(0, (G.deadT - 0.15) / 0.55)), 3), shown = Math.round(G.gain * ge);
      g.font = `800 ${Math.round(S * 0.36)}px Unbounded, system-ui`; g.fillStyle = '#c9a6ff';
      g.fillText('+' + shown + (G.gain === 1 ? ' gem' : ' gems'), W / 2, Hc / 2 + S * (G.newBest ? 1.6 : 1.0));
    }
    g.globalAlpha = 1;
  }
  if (G.state === 'play' && G.gravFx > 0) {
    // tell the player exactly what changed and what their hands must do now
    const k = Math.min(1, G.gravFx / 0.35), pop = 1 + 0.25 * Math.max(0, G.gravFx - 1.2) / 0.3;
    g.globalAlpha = k; g.textAlign = 'center';
    g.font = `800 ${Math.round(Math.min(S * 0.7, W / 16) * pop)}px Unbounded, system-ui`; g.fillStyle = G.p.grav ? GRAV : PCOL.norm;
    g.fillText(G.p.grav ? 'GRAVITY FLIPPED!' : 'GRAVITY NORMAL', W / 2, OY + H * S * 0.24);
    g.font = `800 ${Math.round(Math.min(S * 0.36, W / 30))}px Unbounded, system-ui`; g.fillStyle = '#fff';
    g.fillText(G.p.grav ? 'hold to fall · let go to rise' : 'hold to rise · let go to fall', W / 2, OY + H * S * 0.24 + S * 0.62);
    g.globalAlpha = 1;
  }
  const wt = G.fx ? G.winT - 0.55 : G.winT;
  if (G.state === 'play' && G.banner && !(G.gravFx > 0) && !(G.revFx > 0)) {
    const b = G.banner, k = Math.min(1, b.t / 0.4, (2.2 - b.t) * 5), pop = 1 + 0.3 * Math.max(0, b.t - 1.9) / 0.3;
    g.globalAlpha = Math.max(0, k); g.textAlign = 'center'; g.shadowColor = '#ff3b4f'; g.shadowBlur = 24;
    g.font = `800 ${Math.round(Math.min(S * 0.9, W / 12) * pop)}px Unbounded, system-ui`; g.fillStyle = '#ffffff';
    g.fillText(b.txt, W / 2, OY + H * S * 0.26); g.shadowBlur = 0;
    g.font = `800 ${Math.round(Math.min(S * 0.36, W / 30))}px Unbounded, system-ui`; g.fillStyle = '#ff8a95';
    g.fillText(b.sub, W / 2, OY + H * S * 0.26 + S * 0.7); g.globalAlpha = 1;
  }
  if (G.final && G.state === 'play' && G.secI === 5 && !reduceMotion) {   // final stretch: a red heartbeat at the screen edges, on the beat
    const ph = (G.stepN * DT / (60 / 132)) % 1, a = 0.32 * Math.pow(1 - ph, 3);
    const vg = g.createRadialGradient(W / 2, Hc / 2, Math.min(W, Hc) * 0.35, W / 2, Hc / 2, Math.max(W, Hc) * 0.75);
    vg.addColorStop(0, 'rgba(255,30,50,0)'); vg.addColorStop(1, `rgba(255,30,50,${a})`); g.fillStyle = vg; g.fillRect(0, 0, W, Hc);
  }
  if (G.state === 'play' && G.revFx > 0) {
    const k = Math.min(1, G.revFx / 0.35), pop = 1 + 0.25 * Math.max(0, G.revFx - 1.2) / 0.3;
    g.globalAlpha = k; g.textAlign = 'center';
    g.font = `800 ${Math.round(Math.min(S * 0.7, W / 16) * pop)}px Unbounded, system-ui`; g.fillStyle = G.p.rev ? PCOL.rev : PCOL.fwd;
    g.fillText(G.p.rev ? 'REVERSE!' : 'FORWARD', W / 2, OY + H * S * 0.24);
    g.font = `800 ${Math.round(Math.min(S * 0.36, W / 30))}px Unbounded, system-ui`; g.fillStyle = '#fff';
    g.fillText(G.p.rev ? 'the screen is mirrored · controls stay the same' : 'back to normal', W / 2, OY + H * S * 0.24 + S * 0.62);
    g.globalAlpha = 1;
  }
  if (G.state === 'win' && wt > 0 && wt < (G.final ? 1.8 : 1.3)) {
    // LEVEL COMPLETE pops on the canvas before the panel slides in
    const k = Math.min(1, wt * 4), e = 1 - Math.pow(1 - k, 3), sc = 0.6 + 0.4 * e;
    g.globalAlpha = e; g.font = `800 ${Math.round(Math.min(S * 1.1, W / 10) * sc)}px Unbounded, system-ui`; g.textAlign = 'center';
    g.fillStyle = '#fff'; g.shadowColor = T.edge; g.shadowBlur = 26 * e;
    g.fillText(G.practice ? 'PRACTICE DONE!' : G.final ? 'CONQUERED!' : 'LEVEL COMPLETE!', W / 2, Hc / 2 + S * 0.2);
    g.shadowBlur = 0; g.globalAlpha = 1;
  }
  if (G.flash > 0) { g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`; g.fillRect(0, 0, W, Hc); }
}
// world text that stays readable while the screen is mirrored
function ftext(s, x, y) {
  if (!(G.mir < 0) || G.state === 'menu') { g.fillText(s, x, y); return; }
  g.save(); g.translate(x, y); g.scale(-1, 1); g.fillText(s, 0, 0); g.restore();
}
const LAS = '#ff3df2', FADE = '#b06bff';
// moving laser gate: bright beam = deadly, dim dashed = switched off; the end markers flash just before the opening turns around
function drawLaser(o) {
  const px = G.state === 'menu' ? camX + 4 : G.p.x, on = laserOn(o, px), gy = laserY(o, px), x = X(o.x);
  const turning = Math.abs(Math.cos(px * o.f + o.ph)) < 0.3, lo = gy - o.g / 2, hi = gy + o.g / 2;
  // track: the opening's travel range, marked at both ends
  for (const yy of [o.c - o.a, o.c + o.a]) { g.fillStyle = LAS; g.globalAlpha = turning ? 0.55 + 0.45 * Math.sin(G.t * 30) : 0.35;
    g.beginPath(); g.moveTo(X(o.x - 0.35), Y(yy)); g.lineTo(X(o.x + 0.35), Y(yy)); g.lineTo(x, Y(yy + (yy > o.c ? 0.3 : -0.3))); g.fill(); }
  g.globalAlpha = 1;
  if (on) {
    g.shadowColor = LAS; g.shadowBlur = 16; g.strokeStyle = '#ffe6ff'; g.lineWidth = Math.max(3, S * 0.12);
    g.beginPath(); g.moveTo(x, Y(0)); g.lineTo(x, Y(lo)); g.moveTo(x, Y(hi)); g.lineTo(x, Y(H)); g.stroke();
    g.strokeStyle = LAS; g.lineWidth = Math.max(6, S * 0.28); g.globalAlpha = 0.45; g.stroke(); g.globalAlpha = 1; g.shadowBlur = 0;
  } else {
    const soon = o.P && mod(px - o.k, o.P) > o.L - 1.4;          // about to switch back on: dashes flicker
    g.strokeStyle = LAS; g.lineWidth = 2; g.setLineDash([6, 8]); g.globalAlpha = soon ? 0.45 + 0.4 * Math.sin(G.t * 28) : 0.25;
    g.beginPath(); g.moveTo(x, Y(0)); g.lineTo(x, Y(lo)); g.moveTo(x, Y(hi)); g.lineTo(x, Y(H)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  }
  // emitters at the opening's edges
  g.fillStyle = on ? '#ffffff' : LAS; g.globalAlpha = on ? 1 : 0.4;
  for (const yy of [lo, hi]) g.fillRect(x - S * 0.22, Y(yy) - S * 0.07, S * 0.44, S * 0.14);
  g.globalAlpha = 1;
}
// disappearing door: solid (flickers just before vanishing); gone = faint dashed outline that blinks before it comes back
function drawFade(o, T) {
  const px = G.state === 'menu' ? camX + 4 : G.p.x, ph = mod(px - o.k, o.P), on = ph >= o.L;
  const x = X(o.x), y = Y(o.y + o.h), w = o.w * S, h = o.h * S;
  if (on) {
    const going = o.P - ph < 1.3;
    g.globalAlpha = going ? 0.45 + 0.4 * Math.sin(G.t * 30) : 0.92; g.fillStyle = '#2a0d4f'; g.fillRect(x, y, w, h);
    g.strokeStyle = FADE; g.lineWidth = 3; g.strokeRect(x, y, w, h); g.globalAlpha = 1;
  } else {
    const back = o.L - ph < 1.6;
    g.strokeStyle = back ? '#ffffff' : FADE; g.lineWidth = back ? 3 : 2; g.setLineDash([5, 5]);
    g.globalAlpha = back ? 0.5 + 0.45 * Math.sin(G.t * 26) : 0.3; g.strokeRect(x, y, w, h); g.setLineDash([]); g.globalAlpha = 1;
  }
}
// Gravity Rush's glowing exit portal: a spinning neon ring the arrow flies into
function drawExit(T) {
  const cx = X(G.end), cy = Y(5), rx = S * 1.1, ry = S * 4.3, t = G.t, burst = G.state === 'win' ? Math.max(0, G.winT - 0.55) : 0;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, ry * 1.25);
  glow.addColorStop(0, 'rgba(60,242,255,0.38)'); glow.addColorStop(0.5, 'rgba(255,95,162,0.14)'); glow.addColorStop(1, 'rgba(60,242,255,0)');
  g.fillStyle = glow; g.fillRect(cx - ry * 1.3, cy - ry * 1.3, ry * 2.6, ry * 2.6);
  g.save(); g.translate(cx, cy);
  // swirling core
  for (let i = 0; i < 5; i++) {
    const s = 1 - i * 0.17, a = t * (1.5 + i * 0.6) * (i % 2 ? -1 : 1);
    g.strokeStyle = i % 2 ? '#ff5fa2' : T.edge; g.globalAlpha = 0.25 + 0.12 * i; g.lineWidth = 2;
    g.beginPath(); g.ellipse(0, 0, rx * s, ry * s, 0, a, a + Math.PI * 1.3); g.stroke();
  }
  g.globalAlpha = 1; g.shadowColor = T.edge; g.shadowBlur = 24 + 8 * Math.sin(t * 6);
  g.strokeStyle = '#e9feff'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  g.shadowBlur = 0;
  // orbiting sparks
  for (let i = 0; i < 12; i++) { const a = t * 2.2 + i * Math.PI / 6; g.fillStyle = i % 2 ? '#ff5fa2' : '#ffffff';
    g.fillRect(Math.cos(a) * rx * 1.2 - 2, Math.sin(a) * ry * 1.05 - 2, 4, 4); }
  // completion shockwave
  if (burst > 0 && burst < 0.9) { const k = burst / 0.9; g.globalAlpha = 1 - k; g.strokeStyle = '#ffffff'; g.lineWidth = 6 * (1 - k) + 1;
    g.beginPath(); g.ellipse(0, 0, rx + k * S * 9, ry + k * S * 5, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
  g.restore();
  g.font = `800 ${Math.round(S * 0.36)}px Unbounded, system-ui`; g.textAlign = 'center'; g.fillStyle = '#e9feff';
  if (G.state === 'play') ftext('EXIT', cx, Y(9.55) + S * 0.1);
}
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);

// ---------- UI ----------
const SCREENS = ['home', 'levels', 'skins', 'settings', 'board', 'pause', 'win', 'gift', 'nameDlg', 'feats'];
let screen = 'home';
function showOnly(id) { if (['home', 'levels', 'skins', 'settings', 'board'].includes(id)) screen = id; for (const k of SCREENS) $(k).hidden = k !== id; }
function go(id) { showOnly(id); if (id === 'home') buildHome(); if (id === 'levels') buildLevels(); if (id === 'skins') buildSkins(); if (id === 'settings') syncSettings(); if (id === 'board') openBoard(); renderGems(); }
function goBack() { if (!$('feats').hidden) { $('feats').hidden = true; return; } if (!$('gift').hidden) { $('gift').hidden = true; return; } if (!$('nameDlg').hidden) { $('nameDlg').hidden = true; return; } if (screen !== 'home') go('home'); }
document.querySelectorAll('[data-back]').forEach(b => b.onclick = goBack);
const playIcon = '<svg class="i" viewBox="0 0 16 16"><path d="M3 1.5 14 8 3 14.5Z"/></svg>';
const gemSvg = '<svg><use href="#gem"/></svg>';
function buildHome() {
  const cleared = LEVELS.filter(L => store.get('best:' + L.name, 0) >= 100).length;
  $('classicStat').textContent = `${cleared} of ${LEVELS.length} cleared`;
  $('endlessBest').textContent = store.get('endless', 0) + 'm';
  $('giftDot').hidden = !giftState().ready;
  const dg = store.get('ghost:daily:' + utcDay(), null);
  $('dailyStat').textContent = dg ? `Your best today: ${dg.d}m` : 'You haven’t played today’s course yet';
  $('dailyReset').textContent = `New course in ${untilReset()}`;
  $('dailyShareBtn').hidden = !dg;
  buildQuests();
  scheduleFit();
}
setInterval(() => { if (G.state === 'menu' && screen === 'home') buildHome(); }, 30000);
// ---------- fit the home screen to the viewport ----------
// Inside an iframe the home dashboard must never need a scrollbar. .home-fit is zoomed so its height matches
// the space available: it shrinks on small embeds and grows (only when there is width to spare) on big screens.
// CSS zoom keeps percentage widths inside the zoomed space, so the content always fits horizontally too.
const homeFit = $('homeFit');
const NARROW = matchMedia('(max-width: 760px) and (max-aspect-ratio: 1/1), (max-width: 480px)');   // same query as the CSS phone layout
let fitQueued = false;
function fitHome() {
  fitQueued = false;
  const home = $('home'); if (home.hidden) return;
  const cs = getComputedStyle(home);
  const availH = home.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2;
  const availW = home.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const design = NARROW.matches ? 360 : 880;                       // narrowest width each layout is designed for
  const minZ = 0.6, maxZ = Math.max(1, Math.min(1.45, availW / design));
  let z = 1; homeFit.style.zoom = 1;
  const rendered = () => homeFit.offsetHeight * z;                 // offsetHeight ignores the entry animation's transform
  for (let i = 0; i < 5; i++) {                                    // re-measure: a different zoom changes how text wraps
    const next = Math.max(minZ, Math.min(maxZ, z * availH / rendered()));
    if (Math.abs(next - z) < 0.004) break;
    z = next; homeFit.style.zoom = z;
  }
  while (rendered() > availH && z > minZ) { z = Math.max(minZ, z - 0.02); homeFit.style.zoom = z; }
}
function scheduleFit() { if (!fitQueued) { fitQueued = true; requestAnimationFrame(fitHome); } }
addEventListener('resize', scheduleFit);
if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe($('home'));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
$('dailyBtn').onclick = () => { audioInit(); startLevel('daily'); };
$('dailyBoardBtn').onclick = () => { BD.board = 'dly'; BD.rows = []; go('board'); };
function buildLevels() {
  $('tabClassic').setAttribute('aria-pressed', !G.practice); $('tabPractice').setAttribute('aria-pressed', G.practice);
  $('modeNote').textContent = G.practice ? 'Practice drops a checkpoint at every section. Runs here don’t change your best % or earn gems.'
    : 'Beat a level in one run to clear it. Every new 10% of your best earns gems.';
  const box = $('lvls'); box.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const best = store.get('best:' + L.name, 0), done = best >= 100, b = document.createElement('button');
    b.className = 'tile d-' + L.diff.toLowerCase() + (done ? ' done' : '');
    const reward = done ? 'All gems earned' : `${(10 - Math.floor(best / 10)) * TIER[i] + 10 * TIER[i]} gems left to earn`;
    b.innerHTML = `${done ? '<span class="crown">Cleared</span>' : ''}<span class="num">${i + 1}</span><span class="name disp">${L.name}</span>
      <span class="meta"><span class="chip">${L.diff}</span>${fmt(BUILT[i].secs)}</span>
      <span class="prog"><span class="bar"><i style="--p:${best}%"></i></span><b>${best}%</b></span>
      ${G.practice ? '' : `<span class="reward">${done ? '' : gemSvg}${reward}</span>`}`;
    b.setAttribute('aria-label', `Level ${i + 1}, ${L.name}, ${L.diff}, best ${best}%`);
    b.onclick = () => { audioInit(); startLevel(i); }; box.append(b);
  });
}
function setPractice(on) { G.practice = on; store.set('practice', on); G.cp = null; syncPractice(); }
$('tabClassic').onclick = () => { setPractice(false); buildLevels(); };
$('tabPractice').onclick = () => { setPractice(true); buildLevels(); };
$('classicBtn').onclick = () => { setPractice(false); go('levels'); };
$('practiceModeBtn').onclick = () => { setPractice(true); go('levels'); };
$('endlessBtn').onclick = () => { audioInit(); startLevel('endless'); };
$('skinsBtn').onclick = () => go('skins');
$('boardBtn').onclick = () => { BD.board = 'end'; go('board'); };
$('settingsBtn').onclick = () => go('settings');
function syncPractice() { const b = $('practiceBtn2'); b.textContent = 'Practice: ' + (G.practice ? 'on' : 'off'); b.setAttribute('aria-pressed', G.practice); }
$('practiceBtn2').onclick = () => { setPractice(!G.practice); if (G.state === 'pause') $('att').textContent = (G.practice ? 'Practice ' : 'Attempt ') + G.att; };
function skinPreview(s) {
  const a = s.rainbow ? '#ff4f4f' : `rgb(${s.a})`, b = s.rainbow ? '#4f7bff' : `rgb(${s.b})`, id = 'sk-' + s.id;
  const mid = s.rainbow ? '<stop offset="0.5" stop-color="#4fff8a"/>' : '';
  return `<svg class="prev" viewBox="0 0 200 86" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.35"/>${mid}<stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <polyline points="10,60 40,30 70,60 100,30 130,60 150,40" fill="none" stroke="url(#${id})" stroke-width="16" stroke-opacity="0.25" stroke-linejoin="miter"/>
    <polyline points="10,60 40,30 70,60 100,30 130,60 150,40" fill="none" stroke="url(#${id})" stroke-width="6" stroke-linejoin="miter"/>
    <g transform="translate(152 38) rotate(-45)"><path d="M14 0 -11 -10 -6 0 -11 10Z" fill="${s.body}" stroke="${s.edge}" stroke-width="3" stroke-linejoin="round"/></g></svg>`;
}
function buildSkins() {
  const box = $('skinGrid'); box.innerHTML = '';
  for (const s of SKINS) {
    const owned = econ.owned.includes(s.id), on = econ.skin === s.id, d = document.createElement('div');
    d.className = 'skin' + (on ? ' on' : '');
    d.innerHTML = skinPreview(s) + `<span class="name disp">${s.name}</span>`;
    const btn = document.createElement('button'); btn.className = 'play disp';
    if (on) btn.textContent = 'Equipped';
    else if (owned) btn.textContent = 'Equip';
    else { const need = econ.gems < s.price; btn.innerHTML = `${gemSvg} ${s.price}`; if (need) { btn.classList.add('need'); btn.disabled = true; btn.title = `You need ${s.price - econ.gems} more gems`; } btn.setAttribute('aria-label', `Buy ${s.name} for ${s.price} gems`); }
    btn.onclick = () => {
      if (on) return;
      if (!owned) { if (econ.gems < s.price) return; addGems(-s.price); econ.owned.push(s.id); store.set('owned', econ.owned); sfx('win'); featsCheck(); }
      econ.skin = s.id; store.set('skin', s.id); applySkin(); buildSkins();
    };
    d.append(btn); box.append(d);
  }
}
function syncSettings() {
  $('setSfx').setAttribute('aria-pressed', A.on); $('setMusic').setAttribute('aria-pressed', econ.music); $('setShake').setAttribute('aria-pressed', econ.shake);
  $('resetBtn').classList.remove('armed'); $('resetBtn').textContent = 'Reset';
}
$('setSfx').onclick = () => { audioInit(); setSound(!A.on); syncSettings(); };
$('setMusic').onclick = () => { econ.music = !econ.music; store.set('music', econ.music); if (A.music) A.music.gain.value = econ.music ? 0.5 : 0; syncSettings(); };
$('setShake').onclick = () => { econ.shake = !econ.shake; store.set('shake', econ.shake); syncSettings(); };
$('resetBtn').onclick = () => {
  const b = $('resetBtn');
  if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Tap again'; return; }
  for (const L of LEVELS) store.set('best:' + L.name, 0);
  store.set('endless', 0); econ.gems = 0; store.set('gems', 0); econ.owned = ['classic']; store.set('owned', econ.owned);
  econ.skin = 'classic'; store.set('skin', 'classic'); econ.gift = { day: null, streak: 0 }; store.set('gift', econ.gift);
  applySkin(); renderGems(); b.classList.remove('armed'); b.textContent = 'Done';
};
function openGift() {
  const st = giftState(); $('gift').hidden = false;
  $('giftAmt').textContent = st.amount;
  $('giftText').textContent = st.ready ? `Day ${st.streak} of your streak. Come back every day for a bigger gift.` : 'You’ve already opened today’s gift. Come back tomorrow to keep your streak going.';
  $('claimBtn').hidden = !st.ready;
  $('streak').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const n = i + 1, got = st.ready ? n < st.streak : n <= st.streak, now = st.ready && n === st.streak;
    return `<span class="${got ? 'got' : now ? 'now' : ''}">D${n}</span>`; }).join('');
}
$('giftBtn').onclick = openGift;
$('giftClose').onclick = () => { $('gift').hidden = true; };
$('claimBtn').onclick = () => {
  const st = giftState(); if (!st.ready) return;
  econ.gift = { day: dayKey(), streak: st.streak }; store.set('gift', econ.gift);
  audioInit(); addGems(st.amount); sfx('win'); $('gift').hidden = true; featsCheck(); buildHome();
};
// ---------- daily quests + lifetime feats ----------
const QUESTS = [
  { id: 'runs', txt: 'Play 12 runs', tgt: 12, gems: 20 },
  { id: 'portals', txt: 'Pass 15 portals', tgt: 15, gems: 20 },
  { id: 'clear', txt: 'Clear any level', tgt: 1, gems: 30 },
  { id: 'daily', txt: 'Play the daily challenge', tgt: 1, gems: 15 },
  { id: 'end150', txt: 'Reach 150m in one Endless run', tgt: 1, gems: 25 },
  { id: 'pct60', txt: 'Reach 60% on any level', tgt: 1, gems: 20 },
  { id: 'mini', txt: 'Pass 6 mini portals', tgt: 6, gems: 20 },
];
function todayQuests() {
  const R = rng(dailySeed(utcDay() + '-q')), pool = [...QUESTS], out = [];
  while (out.length < 3) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  return out;
}
let QP = store.get('qp', { day: null, n: {}, done: [] });
function qReset() { const d = utcDay(); if (QP.day !== d) { QP = { day: d, n: {}, done: [] }; store.set('qp', QP); } }
function qAdd(id, v = 1) {
  qReset(); if (!todayQuests().some(q => q.id === id) || QP.done.includes(id)) return;
  QP.n[id] = (QP.n[id] || 0) + v;
  const q = QUESTS.find(q => q.id === id);
  if (QP.n[id] >= q.tgt) {
    QP.done.push(id); addGems(q.gems); sfx('quest'); toast(`Quest complete: ${q.txt}  +${q.gems} gems`);
    if (navigator.vibrate) { try { navigator.vibrate(25); } catch {} }
  }
  store.set('qp', QP);
  if (G.state === 'menu' && screen === 'home') buildQuests();
}
const FEATS = [
  { id: 'all', txt: 'Clear every classic level', gems: 150, chk: () => LEVELS.every(L => store.get('best:' + L.name, 0) >= 100) },
  { id: 'e500', txt: 'Reach 500m in one Endless run', gems: 100, chk: () => store.get('endless', 0) >= 500 },
  { id: 's7', txt: 'Reach a 7-day gift streak', gems: 80, chk: () => econ.gift.streak >= 7 },
  { id: 'sk5', txt: 'Own 5 skins', gems: 40, chk: () => econ.owned.length >= 5 },
];
function featsCheck() {
  const done = store.get('feats', []);
  for (const f of FEATS) if (!done.includes(f.id) && f.chk()) {
    done.push(f.id); store.set('feats', done); addGems(f.gems); sfx('quest'); toast(`Feat earned: ${f.txt}  +${f.gems} gems`);
  }
}
function buildQuests() {
  qReset(); const box = $('questRows'); if (!box) return; box.innerHTML = '';
  for (const q of todayQuests()) {
    const n = Math.min(q.tgt, QP.n[q.id] || 0), done = QP.done.includes(q.id);
    const d = document.createElement('div'); d.className = 'q-row' + (done ? ' done' : '');
    d.innerHTML = `<span class="q-txt">${q.txt}</span><span class="bar"><i style="width:${Math.round(100 * n / q.tgt)}%"></i></span>
      <span class="q-amt">${done ? '✓' : n + '/' + q.tgt}</span><span class="q-gem">${gemSvg}${q.gems}</span>`;
    box.append(d);
  }
  const done = store.get('feats', []);
  $('featsStat').textContent = `${done.filter(id => FEATS.some(f => f.id === id)).length} of ${FEATS.length} earned`;
  if (typeof scheduleFit === 'function') scheduleFit();
}
function buildFeats() {
  const done = store.get('feats', []), box = $('featRows'); box.innerHTML = '';
  for (const f of FEATS) {
    const d = document.createElement('div'); d.className = 'q-row' + (done.includes(f.id) ? ' done' : '');
    d.innerHTML = `<span class="q-txt">${f.txt}</span><span class="q-amt">${done.includes(f.id) ? '✓' : ''}</span><span class="q-gem">${gemSvg}${f.gems}</span>`;
    box.append(d);
  }
}
$('featsBtn').onclick = () => { buildFeats(); $('feats').hidden = false; };
$('featsClose').onclick = () => { $('feats').hidden = true; };
// ---------- toast ----------
let toastTO = 0;
function toast(msg) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTO); toastTO = setTimeout(() => { el.hidden = true; }, 2800);
}
// ---------- share the daily result ----------
$('dailyShareBtn').onclick = async () => {
  const dg = store.get('ghost:daily:' + utcDay(), null); if (!dg) return;
  const txt = `Wave X Daily ${utcDay()} — ${dg.d}m 🌊\nCan you beat my run? ${brandURL('daily-share')}`;
  try {
    if (navigator.share) await navigator.share({ text: txt });
    else { await navigator.clipboard.writeText(txt); toast('Result copied — paste it anywhere'); }
  } catch {}
};
function updateBestMark() {
  const m = $('bestMark'); if (G.endless) { m.hidden = true; return; }
  const b = store.get('best:' + LEVELS[G.lvl].name, 0); m.hidden = !b || b >= 100; m.style.left = b + '%';
}
function toMenu(where) { G.state = 'menu'; musicStop(); $('hud').hidden = true; go(where || (G.endless ? 'home' : 'levels')); }
function pauseGame() {
  if (G.state !== 'play') return; G.state = 'pause'; musicStop(); hold = false;
  $('pauseStat').textContent = G.endless ? `${G.daily ? 'Daily challenge' : 'Endless'}, ${Math.floor(G.p.x)}m` : `${LEVELS[G.lvl].name}, ${Math.floor(100 * G.p.x / G.end)}%`;
  syncPractice(); $('pause').hidden = false;
}
$('pauseBtn').onclick = pauseGame;
$('resumeBtn').onclick = () => { $('pause').hidden = true; G.state = 'play'; if (A.ctx) { A.playing = true; A.next = A.ctx.currentTime + 0.05; } };
$('restartBtn').onclick = () => { $('pause').hidden = true; G.att++; G.cp = null; begin(); };
$('menuBtn1').onclick = () => { $('pause').hidden = true; toMenu(); };
$('menuBtn2').onclick = () => { $('win').hidden = true; toMenu('levels'); };
$('againBtn').onclick = () => { $('win').hidden = true; startLevel(G.lvl); };
$('nextBtn').onclick = () => { $('win').hidden = true; startLevel(G.lvl + 1); };
$('muteBtn').onclick = () => { audioInit(); setSound(!A.on); };
setSound(A.on); applySkin(); renderGems();

// ---------- leaderboard ----------
// LB is the only part that talks to storage. On claude.ai it uses the artifact's shared db;
// for your own site, replace init/top/submit/setName/remove with calls to your server API.
function periodKey(p) {
  const d = new Date(), y = d.getUTCFullYear(), mo = String(d.getUTCMonth() + 1).padStart(2, '0'), dd = String(d.getUTCDate()).padStart(2, '0');
  if (p === 'day') return `${y}-${mo}-${dd}`;
  if (p === 'mo') return `${y}-${mo}`;
  if (p === 'wk') { const t = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate())), wd = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - wd);
    const w = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); return `${t.getUTCFullYear()}-W${w}`; }
  return 'all';
}
const encT = t => t.map((v, i) => (v - (i ? t[i - 1] : 0)).toString(36)).join(',');
const decT = s => { let a = 0; return s ? s.split(',').map(x => (a += parseInt(x, 36))) : []; };
function regionCode() { for (const l of navigator.languages || [navigator.language || '']) { const m = /[-_]([A-Za-z]{2})$/.exec(l); if (m) return m[1].toUpperCase(); } return ''; }
const flagOf = cc => /^[A-Z]{2}$/.test(cc || '') ? String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🌐';
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
const LB = {
  db: null, user: null, uid: null, mine: null, ok: false, owner: false, q: Promise.resolve(),
  async init() {
    if (!window.claude || !window.claude.use) return;
    try { [this.db, this.user] = await Promise.all([claude.use('db'), claude.use('user')]); } catch { return; }
    if (!this.db || !this.user) return;
    this.uid = await this.user.id(); if (!this.uid) return;
    this.owner = !!(await this.user.isOwner());
    try { const s = await withTimeout(this.db.doc('lb/' + this.uid).get()); if (s.exists) this.mine = s.data(); } catch {}
    this.ok = true;
    if (screen === 'board') openBoard();
  },
  async top(period) {
    let q = this.db.collection('lb');
    if (period === 'dly') { const s = await withTimeout(q.where('dlyK', '==', utcDay()).orderBy('dly', 'desc').limit(60).get()); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
    q = period === 'all' ? q.orderBy('all', 'desc') : q.where(period + 'K', '==', periodKey(period)).orderBy(period, 'desc');
    const snap = await withTimeout(q.limit(60).get());
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  submit(m, seed, toggles, kind) {
    if (!this.ok) return;
    this.q = this.q.then(async () => {
      const doc = JSON.parse(JSON.stringify(this.mine || {})); let changed = false;
      doc.runs = doc.runs || {}; doc.proofs = doc.proofs || {};
      if (kind === 'daily') { const k = utcDay(); if (doc.dlyK !== k || m > (doc.dly || 0)) { doc.dly = m; doc.dlyK = k; doc.runs.dly = { s: seed, d: m }; changed = true; } }
      else for (const p of ['day', 'wk', 'mo', 'all']) {
        const k = periodKey(p), better = p === 'all' ? m > (doc.all || 0) : (doc[p + 'K'] !== k || m > (doc[p] || 0));
        if (better) { doc[p] = m; if (p !== 'all') doc[p + 'K'] = k; doc.runs[p] = { s: seed, d: m }; changed = true; }
      }
      if (!changed) return;
      doc.proofs[seed] = encT(toggles);
      const used = new Set(Object.values(doc.runs).map(r => String(r.s)));
      for (const s of Object.keys(doc.proofs)) if (!used.has(s)) delete doc.proofs[s];
      doc.name = cleanName(store.get('lbname', '')) || defaultName(); doc.cc = regionCode(); doc.ts = Date.now();
      try { await this.db.doc('lb/' + this.uid).set(doc); this.mine = doc; } catch (e) { if (e && e.code === 'invalid_argument') this.ok = false; }
    });
  },
  setName(name) {
    store.set('lbname', name);
    if (!this.ok || !this.mine) return Promise.resolve();
    this.q = this.q.then(async () => { try { await this.db.doc('lb/' + this.uid).update({ name }); this.mine.name = name; } catch {} });
    return this.q;
  },
  async remove(id) { await this.db.doc('lb/' + id).delete(); },
};
function defaultName() { const u = LB.uid || ''; let h = 0; for (const c of u) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 'Player ' + String(h % 10000).padStart(4, '0'); }
// replay check: an entry is shown only if its run reproduces the claimed distance
const verified = new Map();
function verifyEntry(e, period) {
  const run = e.runs && e.runs[period], claimed = e[period];
  if (!run || !Number.isFinite(claimed) || claimed <= 0 || claimed > 50000 || String(run.s) === 'undefined') return false;
  if (period === 'dly' && (e.dlyK !== utcDay() || Number(run.s) !== dailySeed(e.dlyK))) return false;
  const key = e.id + ':' + run.s + ':' + claimed;
  if (verified.has(key)) return verified.get(key);
  const t = e.proofs && typeof e.proofs[run.s] === 'string' ? decT(e.proofs[run.s]) : null;
  let ok = false;
  if (t && t.every(Number.isFinite)) { try { ok = Math.floor(replayEndless(Number(run.s), t)) === claimed; } catch { ok = false; } }
  verified.set(key, ok); return ok;
}
const BD = { period: 'all', board: 'end', rows: [], page: 0, token: 0 };
const field = () => BD.board === 'dly' ? 'dly' : BD.period;
const PER = 10;
function lbMsg(title, text) { $('lbRows').innerHTML = `<div class="lb-msg"><div><b>${title}</b>${text}</div></div>`; $('lbPrev').disabled = $('lbNext').disabled = true; $('lbPage').textContent = '–'; }
async function openBoard() {
  document.querySelectorAll('.lb-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.period === BD.period));
  $('bEnd').setAttribute('aria-pressed', BD.board === 'end'); $('bDly').setAttribute('aria-pressed', BD.board === 'dly');
  $('lbTabs').hidden = BD.board === 'dly'; $('lbDaily').hidden = BD.board !== 'dly';
  $('lbDaily').textContent = `Today’s course is the same for everyone. A new one starts in ${untilReset()}.`;
  renderMe();
  if (!LB.ok) {
    lbMsg('Leaderboard offline', 'The shared leaderboard works when you’re signed in to Claude and opening this game there. Your Endless best is saved on this device.');
    return;
  }
  if (!store.get('lbname', '') && !BD.asked) { BD.asked = true; openName(); }
  const tok = ++BD.token; lbMsg('Loading', 'Fetching the latest runs…');
  let list;
  try { list = await LB.top(field()); } catch { if (tok === BD.token) lbMsg('Can’t reach the leaderboard', 'Check your connection and open this screen again.'); return; }
  if (tok !== BD.token) return;
  lbMsg('Checking runs', 'Replaying each run to make sure it’s real…');
  await new Promise(r => setTimeout(r, 30));
  const out = [];
  for (const e of list) { if (verifyEntry(e, field())) out.push(e); if (out.length % 5 === 0) await new Promise(r => setTimeout(r, 0)); if (tok !== BD.token) return; }
  BD.rows = out; const meIdx = out.findIndex(e => e.id === LB.uid); BD.page = meIdx >= 0 ? Math.floor(meIdx / PER) : 0;
  renderBoard(); renderMe();
}
function renderBoard() {
  const rows = BD.rows, box = $('lbRows');
  if (!rows.length) { lbMsg('No runs yet', BD.board === 'dly' ? 'Nobody has played today’s challenge yet. Set the first score.' : BD.period === 'all' ? 'Play Endless to set the first score.' : 'Nobody has played Endless in this period yet. Set the first score.'); return; }
  const pages = Math.ceil(rows.length / PER); BD.page = Math.min(BD.page, pages - 1);
  box.innerHTML = '';
  rows.slice(BD.page * PER, BD.page * PER + PER).forEach((e, i) => {
    const rank = BD.page * PER + i + 1, d = document.createElement('div');
    d.className = 'lb-row' + (rank <= 3 ? ' r' + rank : '') + (e.id === LB.uid ? ' me' : '');
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = cleanName(e.name) || 'Player';
    if (e.id === LB.uid) { const y = document.createElement('small'); y.textContent = 'You'; nm.append(y); }
    d.innerHTML = `<span><span class="rk">${rank}</span></span><span class="flag" title="${/^[A-Z]{2}$/.test(e.cc || '') ? e.cc : 'Unknown region'}">${flagOf(e.cc)}</span>`;
    d.append(nm);
    const dist = document.createElement('span'); dist.className = 'dist'; dist.textContent = Math.floor(e[field()]).toLocaleString() + 'm';
    if (LB.owner && e.id !== LB.uid) {
      const rm = document.createElement('button'); rm.className = 'rm'; rm.textContent = '✕'; rm.setAttribute('aria-label', 'Remove this entry');
      rm.onclick = async () => { if (!rm.classList.contains('armed')) { rm.classList.add('armed'); rm.title = 'Click again to remove'; return; }
        try { await LB.remove(e.id); BD.rows = BD.rows.filter(r => r.id !== e.id); renderBoard(); } catch {} };
      dist.append(rm);
    }
    d.append(dist); box.append(d);
  });
  $('lbPage').textContent = `${BD.page + 1} / ${pages}`; $('lbPrev').disabled = BD.page === 0; $('lbNext').disabled = BD.page >= pages - 1;
}
function renderMe() {
  const name = cleanName(store.get('lbname', '')) || (LB.uid ? defaultName() : 'Player');
  const dly = BD.board === 'dly', label = dly ? 'today' : { day: 'today', wk: 'this week', mo: 'this month', all: 'all time' }[BD.period];
  const mine = LB.mine, cur = !mine ? 0 : dly ? (mine.dlyK === utcDay() ? mine.dly : 0) : (BD.period === 'all' || mine[BD.period + 'K'] === periodKey(BD.period)) ? mine[BD.period] : 0;
  const lg = store.get('ghost:daily:' + utcDay(), null), local = dly ? (lg ? lg.d : 0) : BD.period === 'all' ? store.get('endless', 0) : 0;
  const best = LB.ok ? cur : local, idx = BD.rows.findIndex(e => e.id === LB.uid);
  $('lbMe').innerHTML = '';
  const b = document.createElement('b'); b.textContent = name;
  $('lbMe').append(b, document.createTextNode(best ? `, your best ${label}: ${best}m` + (idx >= 0 ? `, rank #${idx + 1}` : '') : dly ? ', no daily run yet today' : `, no Endless run ${BD.period === 'all' ? '' : label + ' '}yet`));
  $('nameBtn').hidden = !LB.ok;
}
document.querySelectorAll('.lb-tabs button').forEach(b => b.onclick = () => { BD.period = b.dataset.period; BD.rows = []; openBoard(); });
$('bEnd').onclick = () => { BD.board = 'end'; BD.rows = []; openBoard(); };
$('bDly').onclick = () => { BD.board = 'dly'; BD.rows = []; openBoard(); };
$('lbPrev').onclick = () => { BD.page = Math.max(0, BD.page - 1); renderBoard(); };
$('lbNext').onclick = () => { BD.page++; renderBoard(); };
function openName() { $('nameIn').value = cleanName(store.get('lbname', '')) || defaultName(); $('nameErr').textContent = ''; $('nameDlg').hidden = false; setTimeout(() => $('nameIn').select(), 30); }
$('nameBtn').onclick = openName;
$('nameCancel').onclick = () => { $('nameDlg').hidden = true; };
async function saveName() {
  const n = cleanName($('nameIn').value);
  if (n.length < 3) { $('nameErr').textContent = 'Use at least 3 letters or numbers.'; return; }
  await LB.setName(n); $('nameDlg').hidden = true; BD.rows = BD.rows.map(e => e.id === LB.uid ? { ...e, name: n } : e); renderBoard(); renderMe();
}
$('nameSave').onclick = saveName;
$('nameIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') saveName(); if (e.key === 'Escape') $('nameDlg').hidden = true; });
LB.init();

// ---------- input ----------
// UI sounds: a soft blip on click, a quieter one on hover (pointer devices only)
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('button, a');
  if (!b || b.disabled) return; audioInit(); sfx('click');
}, true);
let hovLast = 0;
if (matchMedia('(hover: hover)').matches) document.addEventListener('pointerover', e => {
  const b = e.target.closest && e.target.closest('button, a.play, a.ghost');
  if (!b || b.disabled || !A.ctx || !A.on) return;
  const n = performance.now(); if (n - hovLast > 90) { hovLast = n; sfx('hover'); }
});
const isUI = e => e.target.closest && e.target.closest('button, a, .card, .screen, .overlay');
addEventListener('pointerdown', e => { if (isUI(e)) return; audioInit(); hold = true; e.preventDefault(); }, { passive: false });
addEventListener('pointerup', () => hold = false); addEventListener('pointercancel', () => hold = false);
addEventListener('blur', () => { hold = false; pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
const KEYS = ['Space', 'ArrowUp', 'KeyW'];
addEventListener('keydown', e => {
  if (KEYS.includes(e.code)) { if (G.state !== 'play' && G.state !== 'dead') return; hold = true; audioInit(); e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP') { if (G.state === 'play') pauseGame(); else if (G.state === 'pause') $('resumeBtn').click(); else if (G.state === 'menu' && e.code === 'Escape') goBack(); }
});
addEventListener('keyup', e => { if (KEYS.includes(e.code)) hold = false; });
addEventListener('contextmenu', e => e.preventDefault());
go('home');
$('copyStay').onclick = () => { $('copyDlg').hidden = true; };
if (COPY) { $('copyDlg').hidden = false; if (SITE.hardLock) $('copyStay').hidden = true; }
