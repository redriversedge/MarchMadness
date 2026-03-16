# March Madness 2026 -- Bracket Contest Hub

7-player NCAA tournament bracket contest. Deployed at marchmadnesstourney.netlify.app.

## Architecture

Vanilla JS, no build step, no framework. Netlify Functions for API proxies. Netlify Blobs for shared state persistence.

```
index.html              -- App shell, 3-tab bottom nav (Dashboard, Bracket, Rules)
css/madness.css         -- Dark theme, mobile-first, CSS variables
js/config.js            -- Players, colors, 64-team bracket data, scoring rules, round dates
js/state.js             -- localStorage load/save, game results, elimination tracking
js/scoring.js           -- Standings calculation, round-by-round points, max possible
js/draft.js             -- Snake draft with randomizer, team assignment, localStorage persistence
js/dashboard.js         -- Leaderboard, expandable player cards, live ticker
js/bracket.js           -- 64-team bracket (region view + full bracket), Final Four layout
js/api.js               -- ESPN scoreboard polling, team name matching, score normalization
js/app.js               -- Init, tab nav, admin panel, rules page, shared state publish/load
sw.js                   -- Service worker (bump CACHE_VERSION on every deploy)
netlify/functions/
  ncaa-proxy.js         -- ESPN scoreboard API CORS proxy (60s cache)
  save-state.js         -- Admin: saves draft + game state to Netlify Blobs
  load-state.js         -- Public: loads shared state from Netlify Blobs
```

## Players

| ID | Name | Color |
|----|------|-------|
| CB | Clifford | #ef4444 (Red) |
| MB | Michelle | #3b82f6 (Blue) |
| CH | Caitlin | #22c55e (Green) |
| TH | Tom | #f59e0b (Amber) |
| DH | Deneen | #a855f7 (Purple) |
| CL | Cami | #06b6d4 (Cyan) |
| CK | Chuck | #f97316 (Orange) |

## Scoring

Points per win by round: 1 (R64), 2 (R32), 3 (S16), 4 (E8), 5 (F4), 6 (Championship). Max per team: 21 points.

## Key Concepts

- **DRAFT_ASSIGNMENTS**: Team-to-player mapping. Loaded from localStorage (set during draft) or from server (Netlify Blobs). This is the source of truth for who owns which team.
- **BRACKET**: 63-game tree built from TEAMS. Games 1-32 are R64, 33-48 R32, 49-56 S16, 57-60 E8, 61-62 F4, 63 Championship. Later rounds reference source games for winner advancement.
- **ESPN API**: Public scoreboard endpoint (`groups=100` for tournament games). Team matching uses a comprehensive NAME_MAP in api.js. Unmatched teams log to console.
- **Shared state**: Admin publishes draft + game results to Netlify Blobs via save-state function (requires ADMIN_PIN env var). All visitors load shared state on page load via load-state function.
- **Font size**: User preference stored in localStorage (`mm_fontsize`). Applied via `data-fontsize` attribute on `<html>`.

## Commands

- `node --check js/*.js` -- Syntax-check all JS files. Run before every commit.
- `npx serve .` -- Local dev server (Netlify functions won't work locally).

## Netlify Config

- **Repo**: github.com/redriversedge/MarchMadness
- **Build**: No build command, publish directory is `.`
- **Environment variables**: `ADMIN_PIN` (required for publishing state)
- **Blobs**: Used by save-state/load-state functions (auto-enabled)

## Code Conventions

- All JS uses `var` (ES5 style). No `let`/`const`, no arrow functions, no template literals.
- Global modules use IIFE pattern.
- State changes go through State.setGameResult() or State.setGameStatus().
- Manual overrides (from admin results entry) are flagged with `manualOverride: true` so ESPN API doesn't clobber them.

## Do NOT

- Use `let`, `const`, arrow functions, or template literals
- Hardcode ESPN team IDs (use the NAME_MAP in api.js for matching)
- Commit node_modules/
- Push directly without syntax checking first
