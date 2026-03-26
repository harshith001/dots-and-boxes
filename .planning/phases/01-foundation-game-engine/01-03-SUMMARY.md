---
phase: 01-foundation-game-engine
plan: 03
subsystem: game-ui
tags: [react, svg, tailwind, zustand, next-js, hot-seat]

# Dependency graph
requires:
  - phase: 01-02
    provides: "GameBoard imports gridGeometry; game/page.tsx imports useGameStore, GameBoard, PlayerCard, TurnLabel"
provides:
  - "SVG game board component: GameBoard.tsx (drawn/undrawn/hover lines, box fills, dots, disabled prop)"
  - "Player score card: PlayerCard.tsx (active ring, inactive opacity)"
  - "Turn indicator: TurnLabel.tsx (player-colored text)"
  - "Home screen: app/page.tsx (title, name input, Start Game link)"
  - "Game screen: app/game/page.tsx (3-column layout, wired to Zustand store, game-over + Play Again)"
affects: [02-multiplayer, socket-integration, game-screen-animations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client component boundary declared at page level (game/page.tsx) — sub-components inherit client context"
    - "SVG hover state managed via React useState on line key string — avoids CSS group-hover complexity with dynamic stroke values"
    - "useEffect guard pattern: only call startGame() when gameState is null — prevents double-invoke in React 19 StrictMode"

key-files:
  created:
    - frontend/components/game/GameBoard.tsx
    - frontend/components/game/PlayerCard.tsx
    - frontend/components/game/TurnLabel.tsx
    - frontend/app/game/page.tsx
  modified:
    - frontend/app/page.tsx

key-decisions:
  - "Hover state uses useState(hoveredLine: string | null) keyed by 'h-r-c'/'v-r-c' — simpler than CSS group-hover when stroke color is a JS value"
  - "Game page auto-starts via useEffect with null guard — safe in StrictMode, no double-start"
  - "resetGame sets gameState to null; Play Again in game page calls resetGame (not startGame) — home page is the canonical start entry point"

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 1 Plan 03: Game UI Summary

**SVG game board, player cards, turn label, home page, and game page — complete playable hot-seat Dots & Boxes game wired to Zustand store**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-26T17:00:00Z
- **Completed:** 2026-03-26T17:06:22Z
- **Tasks:** 2 (Task 3 is checkpoint:human-verify — pending)
- **Files modified:** 5

## Accomplishments

- GameBoard.tsx renders full SVG board: box fills (p1 blue / p2 red), h/v lines with idle/hover/drawn states, transparent hit areas, 5x5 dot grid. `disabled` prop applies `pointer-events-none` for Phase 2 wiring.
- PlayerCard.tsx: active player gets colored ring (blue/red), inactive gets opacity-60. Score displayed in player accent color.
- TurnLabel.tsx: player-colored "Player 1's turn" / "Player 2's turn" indicator.
- Home page: title, non-functional name input (Phase 2), Start Game link.
- Game page: 3-column layout (240px | flex-1 | 240px), turn label, game-over banner, Play Again button, Back to Home link.

## Task Commits

1. **Task 1: Game board and UI components** — `9d87330` (feat)
2. **Task 2: Home page + game page wiring** — `0b68a9a` (feat)

## Files Created/Modified

- `frontend/components/game/GameBoard.tsx` — SVG board component
- `frontend/components/game/PlayerCard.tsx` — player score card
- `frontend/components/game/TurnLabel.tsx` — turn indicator
- `frontend/app/game/page.tsx` — game screen (client component)
- `frontend/app/page.tsx` — home screen (updated from scaffold)

## Decisions Made

- Hover state tracks a `string | null` key (e.g. `h-0-1`) via `useState` — simpler and more reliable than CSS group-hover when the stroke is a raw hex value
- `useEffect` null guard prevents double `startGame()` in React 19 StrictMode double-invoke
- Name input is included as visual element only; value not wired until Phase 2 (multiplayer)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- **Name input** (`frontend/app/page.tsx`, uncontrolled input): value not wired to store. Intentional per plan: "username input is non-functional — the game uses 'Player 1' and 'Player 2' labels." Phase 2 will wire this to the multiplayer username flow.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Full hot-seat game is playable in browser after `npm run dev`
- `disabled` prop on GameBoard is wired and functional; Phase 2 will pass `disabled={gameState.currentTurn !== localPlayer}` for multiplayer
- All 25 existing Vitest tests continue to pass
- No blockers for Phase 2

## Self-Check: PASSED

Files confirmed present:
- frontend/components/game/GameBoard.tsx ✓
- frontend/components/game/PlayerCard.tsx ✓
- frontend/components/game/TurnLabel.tsx ✓
- frontend/app/game/page.tsx ✓
- frontend/app/page.tsx ✓

Commits confirmed:
- 9d87330 ✓
- 0b68a9a ✓

---
*Phase: 01-foundation-game-engine*
*Completed: 2026-03-26*
