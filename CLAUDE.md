# March Madness 2026 -- Bracket Contest Hub

7-player NCAA tournament bracket contest. Deployed at marchmadnesstourney.netlify.app.
Repo: github.com/redriversedge/MarchMadness

## Architecture

Vanilla JS, no build step, no framework. Netlify Functions for API proxies. Netlify Blobs for shared state persistence.

```
index.html              -- App shell, 4-tab bottom nav (Dashboard, Bracket, Scores, Rules)
css/madness.css         -- Dark theme, mobile-first, CSS variables, font size support
js/config.js            -- Players, colors, 64-team bracket data, scoring rules, round dates
js/state.js             -- localStorage load/save, game results, elimination tracking, undo
js/scoring.js           -- Standings calculation, round-by-round points, max possible
js/draft.js             -- Snake draft with randomizer, team assignment, localStorage persistence
js/dashboard.js         -- Leaderboard, expandable player cards, live ticker
js/bracket.js           -- 64-team bracket (region view + full bracket), Final Four bracket layout
js/api.js               -- ESPN scoreboard polling, comprehensive team name matching, auto-scoring
js/app.js               -- Init, tab nav, admin panel (PIN-protected results + reassignment), scores page, shared state publish/load
sw.js                   -- Service worker (bump CACHE_VERSION on every deploy)
package.json            -- @netlify/blobs dependency
netlify/functions/
  ncaa-proxy.js         -- ESPN scoreboard API CORS proxy (60s cache)
  save-state.js         -- Admin: saves draft + game state to Netlify Blobs (requires ADMIN_PIN)
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

Points per win by round: 1 (R64), 2 (R32), 3 (S16), 4 (E8), 5 (F4), 100 (Championship). Max per team: 115 points. The championship winner's owner automatically wins the contest. Most total points wins.

## Key Concepts

- **DRAFT_ASSIGNMENTS**: Team-to-player mapping. Loaded from localStorage (set during draft) or from shared-state.json (committed to repo). This is the source of truth for who owns which team.
- **BRACKET**: 63-game tree built from TEAMS. Games 1-32 are R64, 33-48 R32, 49-56 S16, 57-60 E8, 61-62 F4, 63 Championship. Later rounds reference source games for winner advancement.
- **ESPN API**: Public scoreboard endpoint (`groups=100` for tournament games). Team matching uses a comprehensive NAME_MAP in api.js with abbreviations, display names, and partial matches. Unmatched teams log to console. Polls every 3 min during live games, 15 min otherwise.
- **ESPN is the source of truth**: ESPN final results always override manual entries. Manual picks are placeholders until official scores arrive. If you accidentally pick the wrong winner, ESPN will auto-correct it.
- **Shared state**: Admin exports state as shared-state.json, commits to repo, and pushes. Netlify auto-deploys and all visitors load shared state on page load. No Netlify Blobs dependency.
- **Results PIN**: Manual results entry requires PIN (1126) to unlock. Each completed game has an "Undo" button to clear the result.
- **Team Reassignment**: Admin > Reassign tab (PIN: 1126) allows reassigning teams to different players after the draft. Saves to localStorage and updates DRAFT_ASSIGNMENTS live. Publish to server afterward to share.
- **Scores page**: Fourth tab showing all games organized by round with live scores (with period detail), final scores, or start date/time for scheduled games. Includes First Four play-in games. Shows team owners with color-coded badges. Has a Refresh button to manually trigger ESPN fetch. Auto-refreshes when ESPN polls complete. Games within each round sort: live first, then scheduled (by start time), then final at the bottom. Completed rounds sink below active/upcoming rounds. First Four section moves to the bottom when all play-in games are final.
- **Play-in team names**: Teams from First Four games (e.g., "Miami OH/SMU") resolve to the winner's name once the play-in game is final. Uses `getTeamDisplayName()` helper in config.js with a `PLAY_IN_TEAMS` mapping. Applied across scores, bracket, and dashboard.
- **Full bracket layout**: East (top-left), South (bottom-left), West (top-right), Midwest (bottom-right), matching the official NCAA bracket layout.
- **Font size**: User preference (Normal/Large/X-Large) stored in localStorage (`mm_fontsize`). Applied via `data-fontsize` attribute on `<html>`.

## Round Dates

- R64: Mar 20-21
- R32: Mar 22-23
- Sweet 16: Mar 27-28
- Elite 8: Mar 29-30
- Final Four: Apr 5
- Championship: Apr 7

## Admin Workflow

1. Run snake draft in Admin > Draft (randomize order, pick teams)
2. Use Admin > Reassign (PIN: 1126) to fix any team assignments after the draft
3. Export state file in Admin > Settings > "Export State File", drop in repo root as shared-state.json, commit and push
4. Share the URL with everyone
5. Scores auto-update from ESPN during the tournament
6. Use Admin > Results (PIN: 1126) for manual corrections if needed
7. Re-publish after any manual changes

## Commands

- `node --check js/*.js` -- Syntax-check all JS files. Run before every commit.
- `npx serve .` -- Local dev server (Netlify functions won't work locally).

## Netlify Config

- **Build**: No build command, publish directory is `.`
- **Shared state**: Stored in `shared-state.json` at repo root (no Netlify Blobs dependency)

## Code Conventions

- All JS uses `var` (ES5 style). No `let`/`const`, no arrow functions, no template literals.
- Global modules use IIFE pattern.
- State changes go through State.setGameResult(), State.setGameStatus(), or State.clearGameResult().
- ESPN results always take priority. No manualOverride blocking.

## Do NOT

- Use `let`, `const`, arrow functions, or template literals
- Hardcode ESPN team IDs (use the NAME_MAP in api.js for matching)
- Block ESPN from overriding manual results
- Commit node_modules/
- Push directly without syntax checking first
