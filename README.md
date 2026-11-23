# Wave X by GeoDash.org

A wave runner browser game: hold to rise, let go to fall. Plain HTML, CSS and JavaScript with
no build step, no frameworks and no image or audio files (graphics and sound are generated in code).

## What's new in this update (Nov 2026)

- **4 new levels** (9-12: Spike garden, Pendulum, Thorns & teeth, Event horizon) built on two new
  hazard types: **thorn fields** (weave over floor spikes and under ceiling spikes) and **pendulum saws**
  (bob up and down along a dashed track). All 12 levels pass `tools/check_levels.js`.
- **Endless v2**: the endless generator now mixes in thorn fields and pendulum saws once a run warms up.
  *Note: this changes how seeds map to worlds, so leaderboard proofs recorded before this
  version no longer replay - old entries are hidden automatically by the replay check. Ship this before
  the public leaderboard goes live.*
- **Daily quests**: 3 per day (seeded from the date, same for everyone), paying gems on completion,
  shown on the home screen. **Feats**: 5 one-time lifetime challenges with bigger payouts.
- **4 new skins** (Synthwave, Aurora, Nebula, Solar Flare) extending the gem sink to ~5,300 gems.
- **Juice**: level-complete celebration (particle burst, canvas title pop, gem count-up), animated
  death screen (number pop, pulsing NEW BEST, counting gems), screen/card entry transitions,
  hover + click UI sounds, vibration on death and win (mobile), completion toasts.
- **Share**: after playing the daily challenge, a Share button on the home screen copies/shares the
  result with a UTM-tagged link to GeoDash.org.

## What's inside

| Path | What it is |
|---|---|
| `index.html` | The game page: all screens (home, levels, skins, leaderboard, settings) |
| `css/style.css` | All styles |
| `js/core.js` | Physics, collision, level recipes, level generator, Endless world and run replay. Shared by the game, the tools and the server check |
| `js/game.js` | Rendering, input, audio, menus, gems, skins, daily gift, leaderboard, branding |
| `favicon.svg` | Browser tab icon |
| `tools/check_levels.js` | Proves every level can be finished at human reaction speed |
| `tools/make_levels.js` | Regenerates the level recipes (change difficulty, length, mix) |
| `server/verify-run.js` | Server-side anti-cheat check for leaderboard scores |

## Upload to the live server

1. Upload the whole `wavex` folder, for example to `https://geodash.org/games/wavex/`.
2. Open that URL: the game runs straight away. There is nothing to install or compile.
3. To show it inside a game page on GeoDash.org, embed it:

```html
<iframe src="/games/wavex/" title="Wave X" width="100%" height="600"
        style="border:0;max-width:1100px;aspect-ratio:16/9;height:auto"
        allow="autoplay; fullscreen" loading="lazy"></iframe>
```

Serve it over HTTPS. Fonts load from Google Fonts; if that is blocked the game falls back to system fonts.

## Upload to GitHub

1. Create a repository and upload the contents of this folder (or `git add . && git commit && git push`).
2. GitHub Pages (Settings, Pages, deploy from `main`) gives a test URL such as `yourname.github.io/wavex`.
   Add `github.io` to `SITE.hosts` while testing there, or the game shows its "play the original" screen.

## Branding and copy protection (top of `js/game.js`)

```js
const SITE = { home: 'https://geodash.org/', hosts: ['geodash.org'], dev: ['localhost', '127.0.0.1'], hardLock: false };
```

- `hosts`: domains allowed to run the game. Subdomains (www, cdn) are included automatically.
  Add every domain or CDN you serve it from.
- `hardLock: false` shows a "Play the original at GeoDash.org" screen on other sites but lets people continue.
  Set it to `true` for production to block play on other sites entirely.
- Every GeoDash link carries UTM tags (`utm_source=wavex`). Links clicked on a stolen copy are tagged
  `utm_medium=copied-game` with the copying site's domain in `utm_content`, so Google Analytics shows
  which sites copied the game.

**Obfuscate before going live.** Anyone can read plain JavaScript and delete the domain check. Run:

```bash
npm install -g javascript-obfuscator
javascript-obfuscator js/game.js --output js/game.js --string-array true --string-array-encoding base64 --self-defending true
```

Keep the un-obfuscated originals in the repository and only upload the obfuscated files to the server.
Do not obfuscate `js/core.js` with renaming options that change its exported function names if the server uses it.

## Leaderboard and daily challenge rankings

The `LB` object in `js/game.js` is the only code that talks to storage. In this package it uses
Claude's artifact database, which only exists inside claude.ai, so on your own server the leaderboard
shows "Leaderboard offline". Everything else works, including personal bests, gems, skins,
quests and the daily course itself (stored in the browser).

To turn the leaderboard on for your site:

1. Build a small API with two endpoints: one returning the top scores for a board and period,
   one accepting a submitted run (`mode`, `seed`, `toggles`, `distance`, `day`, `name`, `cc`).
2. Before saving a submitted run, call `verifyRun()` from `server/verify-run.js`. It replays the run with the
   game's own physics and rejects faked distances, so the board cannot fill with fake "infinity" scores.
3. Replace the bodies of `LB.init`, `LB.top`, `LB.submit`, `LB.setName` and `LB.remove` with `fetch()` calls to that API.
   The rest of the leaderboard screen and the replay check keep working unchanged.

## Changing levels

```bash
node tools/check_levels.js     # is every level beatable?
node tools/make_levels.js      # regenerate after editing CFG in that file
```

`make_levels.js` writes `tools/levels_lit.js`; paste it over the `LEVELS` array in `js/core.js`, then run the check again.

## Notes

- Progress, gems, skins and settings are saved in the player's browser (localStorage).
- Daily challenges and leaderboard periods reset at midnight UTC.
- Physics runs at a fixed 240 steps per second, which is what makes run replays exact. Don't change `DT` in `js/core.js`.

## Embedding in an iframe (Nov 2026 update)
The home screen is a single compact dashboard (header, the three modes, then daily challenge and
quests side by side) and `fitHome()` in `js/game.js` zooms it to fit whatever space the iframe gives
it, so players never need to scroll to find a game mode. It shrinks on small embeds (down to 60%),
grows on large screens and fullscreen (up to 145%, only when there is width to spare), and re-fits
automatically when the iframe is resized. Tested with no scrollbar at 640×360, 800×450, 896×504,
1100×500, 1280×720, 1920×1080, phone landscape 844×390 and phone portrait 390×700.

Recommended embed: 16:9, at least 640×360, e.g.
`<iframe src="https://YOUR-HOST/wavex/" width="896" height="504" style="border:0" allow="fullscreen; autoplay" allowfullscreen></iframe>`

Screens that list things (levels, skins, ranks) still scroll when needed, with a thin themed scrollbar.

## Ghost removed (Nov 2026)
The ghost (your best run replayed beside you), its "Ghost beaten!" banner and sound, the "Show my
ghost" setting, "Race my best" on Endless, the race buttons on the leaderboard, the "Beat a ghost"
quest and the "Beat 10 ghosts" feat are all gone. Players found the ghost confusing. The daily
challenge best is still stored under the `ghost:daily:<day>` key (the name is historical); the
daily stat, Share button and leaderboard read it.

## Level 13: Antigravity (Nov 2026)
New gravity portals, usable in any level recipe: `['flip']` turns gravity upside down (holding makes you
fall, letting go makes you rise) and `['norm']` turns it back. In the physics this is one flag
(`st.grav` in `step()` in `js/core.js`), so replays, practice checkpoints and the level checker all handle it.
On screen: a pink "flip" portal and a cyan "back" portal, a "GRAVITY FLIPPED! hold to fall" flash, a pink
outline on the arrow and a pink glow along the floor and ceiling for as long as gravity is upside down.
Antigravity is about 80 seconds long (speed 10, rising to 11) and upside down for 58% of it, in five acts:
warm-up, a first flip on a gentle corridor, mini mode with a flip, a speed-up with rapid flips, and a
long upside-down stretch before a normal-gravity finale.

## Level 14: Gravity Rush (Insane, about 51 s)

Built from the level 14 design document. Five sections: Warm-up, Narrow Passage, Gravity Chaos, Pressure Zone, Final Escape.

- **New obstacles** (js/core.js `section()`): `stairs` (staircase spikes), `mirror` (symmetrical floor and ceiling spikes) and `mzig` (a symmetrical zigzag).
- **`ramp` portal:** smooth speed change (11 → 11.5 → 12 → 12.5 burst → 11.5). Other levels still use instant `speed` portals, so they play exactly as before.
- **Beat sync:** `bpm: 132` on the level makes the builder push every portal and section onto the next music beat.
- **Section markers:** `['sec']` markers let the music build section by section (kick and bass → hats → snare and lead → double-time in Pressure Zone → thinner for the escape).
- **Level 14 only (`exit: true`):** neon tunnel background, particle bursts on gravity flips, speed streaks and a whoosh on speed-ups, and a glowing exit portal that pulls the arrow in and bursts before LEVEL COMPLETE.

## Level 15: Laser Storm (Insane, about 56 s)

Built from the level 15 design document. Six sections: Neon Introduction, Laser Corridor, Disappearing Path, Overdrive Zone, Final Survival, Final Escape.

**New obstacles** (js/core.js). All movement is tied to how far the player has travelled, so every attempt plays the same and tools/check_levels.js can prove the level is beatable.
- `laser`: a floor-to-ceiling beam whose opening slides between two marked ends. The end markers flash just before the opening turns around. Optional blinking: a bright beam kills, a dim dashed beam is off and safe, and the dashes flicker just before it switches back on.
- `doors` / `fade`: walls with two disappearing doors, only one of them open as you arrive. A block flickers before it vanishes, and its dashed outline blinks before it returns.
- `msaw`: still, up-and-down, side-to-side (`hsaw`) and opposite-pair saws, in turn.

**Other mechanics:**
- `rev` / `fwd` portals mirror the screen left to right and back (visual only; the physics is unchanged). REVERSE and FORWARD banners announce the switch.
- Overdrive ramps speed up to 13 and back down.
- `secMusic` maps the six sections onto the five music layers.

## Level 16: Crimson Core (Demon, about 71 s), the finale

A finale built to feel like a real achievement. It has its own Demon difficulty badge.

| Section | Time | What happens |
|---|---|---|
| Eerie intro | 0–8 s | Slow and quiet; the calm before the storm |
| THE DROP | 8–21 s | Flash and shake, speed jumps to 12.5, lasers, saws and a gravity flip |
| Gauntlet | 21–33 s | Disappearing doors, mini lasers, mirrored spikes, another flip |
| HALFWAY | 33–38 s | One breather; the music drops back |
| Chaos | 38–52 s | Speed 13 in mini: mirror screen plus gravity flip at the same time, lasers, doors |
| FINAL STRETCH | 52–68 s | Speed 13.5, every mechanic from levels 13–15, a red heartbeat pulse on the beat |
| Escape | 68–71 s | Slows down into the exit portal; double burst and CONQUERED! |

`secBanner` shows THE DROP, HALFWAY and FINAL STRETCH banners. `final: true` turns on the bigger finish and the special win message. 14 gems per 10%.
Also fixed: the Next level button showed on the last level (CSS overrode `hidden`).
Level 15 was renamed to **Laser Storm**, because level 7 is already called Overdrive and best scores are saved by name.
