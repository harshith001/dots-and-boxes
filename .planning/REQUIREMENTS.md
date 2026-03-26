# Requirements: Dots & Boxes

**Defined:** 2026-03-26
**Core Value:** Players can jump into a real-time match instantly and enjoy a smooth, low-latency game with polished UI

---

## v1 Requirements

### Game Mechanics

- [ ] **GAME-01**: 5×5 dot grid renders correctly (hLines 5×4, vLines 4×5, boxes 4×4)
- [ ] **GAME-02**: Player can click an undrawn line segment to draw it
- [ ] **GAME-03**: Drawing a line that completes a box claims it for the current player
- [ ] **GAME-04**: Completing a box grants the player another turn
- [ ] **GAME-05**: Game ends when all 16 boxes are claimed; player with most boxes wins
- [ ] **GAME-06**: Board is disabled (pointer-events-none) during opponent's turn

### Multiplayer

- [ ] **MULTI-01**: Player can enter a username and start a quick match session
- [ ] **MULTI-02**: Quick match places player in a matchmaking queue
- [ ] **MULTI-03**: If no opponent found within 5 seconds, a bot opponent is assigned
- [ ] **MULTI-04**: Player can create a private room and receive a shareable invite link
- [ ] **MULTI-05**: Second player can join a private room via the invite link
- [ ] **MULTI-06**: Both players receive real-time game state updates via Socket.io
- [ ] **MULTI-07**: Player reconnection is handled via persistent player token (not socket.id)
- [ ] **MULTI-08**: Opponent disconnect is surfaced to the remaining player

### UI / UX

- [ ] **UI-01**: Centered game board with clean 3-column layout (left panel, board, right panel)
- [ ] **UI-02**: Live score display at top, updated in real-time
- [ ] **UI-03**: Current player's turn is visually highlighted; opponent is dimmed
- [ ] **UI-04**: Line draw animation (stroke-dashoffset reveal, ~200ms)
- [ ] **UI-05**: Box fill animation (scale-up pulse) when a box is claimed
- [ ] **UI-06**: Game end modal overlays the board with winner, scores, and CTAs

### Emoji Reactions

- [ ] **EMOJI-01**: Emoji panel shows 5 reactions: 😎 😂 😡 🔥 👏
- [ ] **EMOJI-02**: Clicking emoji sends it to opponent via Socket.io
- [ ] **EMOJI-03**: Received emoji displays as floating animation over the board
- [ ] **EMOJI-04**: Client-side 2.5s cooldown prevents spam; server silently drops within 2s

### Chat

- [ ] **CHAT-01**: Chat panel shows 3 predefined message buttons: "Nice move", "Good game", "That was close"
- [ ] **CHAT-02**: Clicking a message sends it to opponent and appears in both players' chat logs
- [ ] **CHAT-03**: Per-button 1.5s cooldown after sending

### Dashboard

- [ ] **DASH-01**: Dashboard screen shows total matches played
- [ ] **DASH-02**: Dashboard shows wins, losses, and win rate
- [ ] **DASH-03**: Dashboard shows last 10 matches with opponent name, result, and score

### Leaderboard

- [ ] **LEAD-01**: Leaderboard shows top players ranked by wins
- [ ] **LEAD-02**: Leaderboard displays rank, username, and win count
- [ ] **LEAD-03**: Leaderboard refreshes at most every 30 seconds (no live push needed)

### Infrastructure

- [x] **INFRA-01**: Next.js frontend with App Router and Tailwind CSS
- [x] **INFRA-02**: Node.js + Socket.io backend as separate process
- [ ] **INFRA-03**: SQLite (better-sqlite3) for player stats and match history persistence
- [ ] **INFRA-04**: Username-based sessions via HttpOnly cookie (no OAuth)
- [ ] **INFRA-05**: Zustand for frontend game state management
- [x] **INFRA-06**: Project runs locally with `npm run dev` in both frontend and backend

---

## v2 Requirements

### Auth & Accounts

- **AUTH-01**: OAuth login (Google / GitHub)
- **AUTH-02**: Password-based account creation
- **AUTH-03**: Profile avatars

### Gameplay

- **GAME-07**: Configurable grid size (3×3, 4×4, 6×6)
- **GAME-08**: Spectator mode
- **GAME-09**: Game replay from move history

### Social

- **SOCL-01**: Friends list
- **SOCL-02**: Match history between two specific players
- **SOCL-03**: Achievements / badges

### Infrastructure

- **INFRA-07**: PostgreSQL migration path from SQLite
- **INFRA-08**: Redis for matchmaking queue (horizontal scale)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Free-form chat | MVP constraint — moderation complexity, predefined messages sufficient |
| Mobile-first responsive design | Desktop-first; mobile is optional stretch goal |
| Video/audio calls | Not relevant to game experience |
| Real-time leaderboard push | 30s polling sufficient; live push is over-engineering for v1 |
| Payment / premium features | Not in scope |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAME-01 | Phase 1 | Pending |
| GAME-02 | Phase 1 | Pending |
| GAME-03 | Phase 1 | Pending |
| GAME-04 | Phase 1 | Pending |
| GAME-05 | Phase 1 | Pending |
| GAME-06 | Phase 1 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Complete |
| MULTI-01 | Phase 2 | Pending |
| MULTI-02 | Phase 2 | Pending |
| MULTI-03 | Phase 2 | Pending |
| MULTI-04 | Phase 2 | Pending |
| MULTI-05 | Phase 2 | Pending |
| MULTI-06 | Phase 2 | Pending |
| MULTI-07 | Phase 2 | Pending |
| MULTI-08 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| EMOJI-01 | Phase 4 | Pending |
| EMOJI-02 | Phase 4 | Pending |
| EMOJI-03 | Phase 4 | Pending |
| EMOJI-04 | Phase 4 | Pending |
| CHAT-01 | Phase 4 | Pending |
| CHAT-02 | Phase 4 | Pending |
| CHAT-03 | Phase 4 | Pending |
| INFRA-03 | Phase 5 | Pending |
| INFRA-04 | Phase 5 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| LEAD-01 | Phase 5 | Pending |
| LEAD-02 | Phase 5 | Pending |
| LEAD-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
