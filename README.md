# AshenVale

A hero-collector auto-battler, restructured from the original single-file
prototype into a proper client/server project with real-time PvP.

## Folder structure

```
ashenvale/
├── shared/     Pure game data + battle engine (no React, no server code).
│               Used as an npm workspace package (@ashenvale/shared) by
│               both client and server, so the rules can never drift out
│               of sync between them.
│   ├── heroes.js     The 40-hero roster (ported from the original file)
│   ├── engine.js      Turn order, damage, buffs, unit construction, simulateBattle()
│   ├── pve.js          Procedural enemy team generators for the Campaign mode
│   └── index.js         Re-exports everything
│
├── server/     Node/Express + Socket.io real-time PvP server
│   └── src/
│       ├── index.js    Connection handling, matchmaking queue, rooms
│       └── match.js    Formation validation + authoritative battle streaming
│
└── client/     React (Vite) app — the game itself
    └── src/
        ├── context/GameContext.jsx   Save data: owned heroes, formation, gold (localStorage)
        ├── components/               HpBar, HeroChip, BattleView
        ├── screens/                  Home, Collection, Formation, Campaign, Multiplayer
        ├── socket.js                 socket.io-client instance
        └── App.jsx
```

## How multiplayer works

This is **real-time, server-authoritative PvP**:

1. Both players build a formation (up to 6 heroes) locally, then tap
   **Find Match** on the PvP Arena screen. The client sends only
   `{ heroId, star, ascension }` per hero — never raw stats.
2. The server validates the formation against the shared hero table
   (`sanitizeFormation` in `server/src/match.js`), so a client can't forge
   stats to cheat.
3. Once two players are queued, the server builds both sides with the
   shared engine and runs `simulateBattle()` **once, on the server**. That
   single deterministic result is the authoritative outcome.
4. The server then streams that result turn-by-turn to both sockets over
   Socket.io (`battle:step` events, ~1 turn/second), so both players watch
   the same fight unfold live and in sync — like a shared spectator feed,
   not two independent local simulations that could desync.
5. `battle:end` reports the outcome from each player's own perspective.

This preserves the original game's auto-battler design (heroes act on
their own via speed/energy, no manual per-turn input) while making the
outcome fair, synchronized, and impossible to fake client-side.

## Running it locally

You'll need Node 18+.

```bash
# from the ashenvale/ root
npm install          # installs and links all three workspaces
npm run dev           # starts the PvP server (:4000) and the client (:5173) together
```

Or run them separately:

```bash
npm run dev:server    # http://localhost:4000
npm run dev:client    # http://localhost:5173
```

Open `http://localhost:5173` in two separate browser tabs/windows (or on
two devices, after setting `VITE_SERVER_URL` on the client to your
machine's LAN IP) to test a real PvP match against yourself.

### Environment variables

- `server`: `PORT` (default 4000), `CLIENT_ORIGIN` (default `http://localhost:5173`, used for CORS)
- `client`: `VITE_SERVER_URL` (default `http://localhost:4000`) — put this in `client/.env`

## What was simplified from the original prototype

The original 1,787-line file also included a gacha summon system, an
armor/artifact inventory with equip UI, a Tower and Dungeon mode, and an
Arena ladder against AI squads. To keep this restructuring focused and
reviewable, this version keeps the full hero roster and the exact battle
math, but ships a leaner progression loop (starter roster, gold-for-star
leveling, one Campaign PvE mode) plus the new PvP mode. The `shared/`
engine already supports armor and artifacts (`armorBonus`, `artifact`
fields on units) — wiring up a shop/inventory screen on top of it would be
a natural next step and wouldn't require touching the server or the
battle math at all.

## Deploying the server

`server/` is a plain Express + Socket.io app — deploy it anywhere that
runs Node (Fly.io, Render, a VPS, etc.), set `CLIENT_ORIGIN` to your
deployed client's URL, and point the client's `VITE_SERVER_URL` at it.
