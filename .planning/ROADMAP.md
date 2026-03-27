# Roadmap: Dots & Boxes

**Milestone:** v1.0 — Production-Ready MVP
**Target:** Playable multiplayer game with stats and leaderboard

---

## Overview

Start with a working local game engine and project scaffolding, layer in real-time multiplayer, polish the UI, add social features, then close with persistence and stats. Each phase delivers something playable or observable — no phase is purely infrastructure.

## Phases

- [x] **Phase 1: Foundation & Game Engine** - Next.js + Node.js scaffold with a fully playable local Dots & Boxes game (completed 2026-03-26)
- [ ] **Phase 2: Multiplayer Core** - Real-time matches via Socket.io with matchmaking, private rooms, and bot fallback
- [ ] **Phase 3: Game UI Polish** - 3-column layout, animations, score bar, turn indicators, and end-game modal
- [ ] **Phase 4: Social Features** - Emoji reactions with floating animation and predefined chat
- [ ] **Phase 5: Stats & Leaderboard** - SQLite persistence, session cookies, player dashboard, and global leaderboard

## Phase Details

### Phase 1: Foundation & Game Engine
**Goal**: A working local Dots & Boxes game runs in the browser with correct game mechanics and full project scaffolding
**Depends on**: Nothing (first phase)
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, INFRA-01, INFRA-02, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. The 5x5 dot grid renders with clickable line segments (hLines 5x4, vLines 4x5)
  2. Clicking an undrawn line draws it, and completing a box claims it for the current player with a visual indicator
  3. Completing a box grants the current player another turn; not completing one switches turns
  4. When all 16 boxes are claimed, the game ends and the winner is identified
  5. Both `npm run dev` commands (frontend and backend) start without errors and connect to each other
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Project scaffold (Next.js frontend, Node.js backend, shared types, Vitest)
- [x] 01-02-PLAN.md — Game engine TDD (game logic, grid geometry, Zustand store)
- [x] 01-03-PLAN.md — Game UI (SVG board, player cards, pages, hot-seat wiring)

**UI hint**: yes

---

### Phase 2: Multiplayer Core
**Goal**: Two players can find each other and play a real-time match — via quick match, private room invite, or against a bot fallback
**Depends on**: Phase 1
**Requirements**: MULTI-01, MULTI-02, MULTI-03, MULTI-04, MULTI-05, MULTI-06, MULTI-07, MULTI-08
**Success Criteria** (what must be TRUE):
  1. A player can enter a username and join a quick match queue; two players in queue are paired and start a game
  2. If no opponent joins within 5 seconds, a bot is assigned and the game starts automatically
  3. A player can create a private room, share the invite link, and a second player can join via that link
  4. Game state updates (moves, turn changes, scores) appear in real-time on both players' screens
  5. If a player's connection drops and reconnects, they rejoin their game with correct state restored
  6. The remaining player sees an opponent-disconnected message when the other player leaves
**Plans**: 0/3 plans complete

Plans:
- [x] 02-01-PLAN.md — KINETIC_GRID design system + Setup Screen (INITIALIZE_OPERATOR)
- [x] 02-02-PLAN.md — Socket.io backend + room engine + lobby page
- [ ] 02-03-PLAN.md — Invite Screen, multiplayer game page, live board sync

**UI hint**: yes (Stitch project 14285055703179592596 — 4 screens: Cyber-Noir App, Minimal Board, Setup Screen, Invite Screen)

---

### Phase 3: Game UI Polish
**Goal**: The game screen looks and feels polished — correct layout, smooth animations, and clear visual feedback for every game event
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. The game screen renders as a 3-column layout (left panel, center board, right panel) with the board centered
  2. Live scores update at the top in real-time as boxes are claimed
  3. The current player's turn is highlighted; the opponent is visually dimmed; the board is unclickable on the opponent's turn
  4. Drawing a line plays a stroke-reveal animation (~200ms); claiming a box plays a scale-up pulse
  5. When the game ends, a modal overlays the board showing the winner, final scores, and Play Again / Dashboard buttons
**Plans**: 2/2 plans complete
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — 3-column layout with PlayerCard active/dim states (completed 2026-03-26)
- [x] 03-02-PLAN.md — SVG line-draw and box-claim animations (completed 2026-03-26)

---

### Phase 4: Social Features
**Goal**: Players can send emoji reactions and predefined chat messages to each other during a match
**Depends on**: Phase 3
**Requirements**: EMOJI-01, EMOJI-02, EMOJI-03, EMOJI-04, CHAT-01, CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. The emoji panel shows 5 reactions; clicking one sends it to the opponent and it floats up over their board
  2. The emoji panel is dimmed for 2.5s after use; the server silently drops duplicate sends within 2s
  3. The chat panel shows 3 predefined message buttons; clicking one appears in both players' chat logs
  4. Each chat button has a 1.5s per-button cooldown after sending
**Plans**: 2/2 plans complete
**UI hint**: yes

Plans:
- [x] 04-01-PLAN.md — Social socket events — emoji dedup + chat broadcast (completed 2026-03-26)
- [x] 04-02-PLAN.md — Emoji reactions + predefined chat with floating animation (completed 2026-03-26)

---

### Phase 5: Stats & Leaderboard
**Goal**: Player sessions persist across visits, and players can view their match history, personal stats, and a ranked global leaderboard
**Depends on**: Phase 4
**Requirements**: INFRA-03, INFRA-04, DASH-01, DASH-02, DASH-03, LEAD-01, LEAD-02, LEAD-03
**Success Criteria** (what must be TRUE):
  1. A player's username session persists via HttpOnly cookie; returning to the site restores their identity without re-entering a name
  2. The dashboard screen shows total matches, wins, losses, and win rate
  3. The dashboard shows the last 10 matches with opponent name, result, and score
  4. The leaderboard shows the top players ranked by wins with rank, username, and win count
  5. The leaderboard data refreshes at most every 30 seconds (polling, not live push)
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Game Engine | 3/3 | Complete   | 2026-03-26 |
| 2. Multiplayer Core | 2/3 | In Progress|  |
| 3. Game UI Polish | 2/2 | Complete | 2026-03-26 |
| 4. Social Features | 2/2 | Complete | 2026-03-26 |
| 5. Stats & Leaderboard | 0/TBD | Not started | - |
