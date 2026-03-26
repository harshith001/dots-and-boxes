# Phase 1: Foundation & Game Engine — Research

**Researched:** 2026-03-26
**Domain:** Next.js 14 App Router · Node.js/Express/Socket.io · SVG game board · Zustand · TypeScript monorepo scaffold
**Confidence:** HIGH

---

## Summary

Phase 1 establishes the complete project scaffold and a fully playable local (hot-seat) Dots & Boxes game. All network and multiplayer concerns are deferred to Phase 2 — the backend in this phase exists only as an empty Express + Socket.io server that can be started. The game logic runs entirely in the browser via a Zustand store, with `applyMove()` as a pure function.

The stack is locked: Next.js 14 App Router (frontend), Node.js + Express + Socket.io (backend, separate process), Zustand (client state), SVG (board rendering), TypeScript throughout. Prior research has already established the exact data structures and algorithms — this research adds the scaffold commands, coordinate math, test infrastructure, and hot-seat wiring that the planner needs to build concrete tasks.

**Primary recommendation:** Scaffold with `create-next-app` (TypeScript + Tailwind + App Router, no src dir, no turbopack for Phase 1 stability), initialize the backend as a plain `npm init` + Express package, place shared types in a `shared/` sibling directory, wire both with `concurrently` from a root `package.json`, and implement the entire game as a Zustand store + SVG board before any socket work.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | 5×5 dot grid renders correctly (hLines 5×4, vLines 4×5, boxes 4×4) | SVG coordinate math section; geometry pure function pattern |
| GAME-02 | Player can click an undrawn line segment to draw it | Hit-area approach (invisible wide rect), pointer-events-none toggle |
| GAME-03 | Drawing a line that completes a box claims it for the current player | `applyMove()` + `findCompletedBoxes()` algorithm from architecture research |
| GAME-04 | Completing a box grants the player another turn | Turn management in `applyMove()` — `boxesGained > 0` guard |
| GAME-05 | Game ends when all 16 boxes are claimed; player with most boxes wins | `filledBoxes === totalBoxes` check; `determineWinner()` |
| GAME-06 | Board disabled (pointer-events-none) during opponent's turn | Zustand `isMyTurn` selector → CSS class on SVG wrapper |
| INFRA-01 | Next.js frontend with App Router and Tailwind CSS | `create-next-app` flags; Tailwind config |
| INFRA-02 | Node.js + Socket.io backend as separate process | Express + Socket.io minimal scaffold |
| INFRA-05 | Zustand for frontend game state management | Store shape; hot-seat wiring |
| INFRA-06 | Project runs locally with `npm run dev` in both frontend and backend | `concurrently` root script |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | Frontend framework — App Router | Locked decision |
| react / react-dom | (bundled with next) | UI rendering | Implicit |
| typescript | 6.0.2 | Type safety across frontend + backend + shared | Locked decision |
| zustand | 5.0.12 | Client game state | Locked decision — surgical re-renders, callable outside React |
| socket.io | 4.8.3 | WebSocket server (Phase 2 runtime, Phase 1 scaffold) | Locked decision |
| socket.io-client | 4.8.3 | WebSocket client (Phase 2 runtime, Phase 1 scaffold) | Must match server version |
| express | 5.2.1 | HTTP server wrapping Socket.io | Standard minimal server |
| concurrently | 9.2.1 | Run frontend + backend with single `npm run dev` | Standard mono-repo dev tool |
| tailwindcss | (bundled in create-next-app) | Utility CSS | Locked decision |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cors | 2.8.6 | Allow frontend origin on backend | Required for cross-origin Socket.io in dev |
| tsx | 4.21.0 | Run TypeScript backend without separate compile step | Dev-mode only; replaces ts-node |
| @types/node | 25.5.0 | Node.js type definitions | Backend TypeScript |
| @types/express | 5.0.6 | Express type definitions | Backend TypeScript |
| @types/cors | 2.8.19 | CORS type definitions | Backend TypeScript |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| concurrently | npm workspaces + turborepo | Overkill for 2-package mono-repo in Phase 1 |
| tsx (backend) | ts-node | tsx is faster cold start, no config needed |
| SVG | HTML Canvas | Canvas requires manual hit detection; SVG is React-diffable |
| Zustand | React Context | Context causes full subtree re-render on any state change |

### Installation

```bash
# Frontend (run from project root)
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-turbopack

# Install frontend extras
cd frontend && npm install zustand socket.io-client && cd ..

# Backend
mkdir backend && cd backend && npm init -y
npm install express socket.io cors
npm install -D typescript tsx @types/node @types/express @types/cors
npx tsc --init --target ES2020 --module NodeNext --moduleResolution NodeNext \
  --outDir dist --rootDir src --strict

# Root package (dev runner)
cd ..
npm init -y
npm install -D concurrently
```

### Version verification

Versions above were verified against npm registry on 2026-03-26:
- `next` 16.2.1 — latest stable
- `socket.io` / `socket.io-client` 4.8.3 — latest stable, must be equal
- `zustand` 5.0.12 — latest stable (Zustand 5 has breaking store API changes vs v4 — see Pitfalls)
- `concurrently` 9.2.1 — latest stable
- `tsx` 4.21.0 — latest stable
- `express` 5.2.1 — Express 5 is now stable (breaking changes from v4 — see Pitfalls)

---

## Architecture Patterns

### Recommended Project Structure

```
dots-and-boxes/              ← git root + root package.json
├── package.json             ← scripts: dev, dev:frontend, dev:backend
├── shared/
│   └── types.ts             ← GameState, Move, Player interfaces (copied into both)
├── frontend/                ← Next.js app (create-next-app output)
│   ├── app/
│   │   ├── page.tsx         ← Home: username entry + hot-seat start button
│   │   └── game/
│   │       └── page.tsx     ← Game screen (client component)
│   ├── components/
│   │   └── game/
│   │       ├── GameBoard.tsx    ← SVG board, purely presentational
│   │       └── ScoreBar.tsx     ← Score + turn indicator
│   ├── store/
│   │   └── gameStore.ts     ← Zustand store with hot-seat game logic
│   ├── lib/
│   │   ├── gameLogic.ts     ← applyMove, findCompletedBoxes, initGameState
│   │   └── socket.ts        ← Socket singleton (stub for Phase 2)
│   └── types/
│       └── game.ts          ← Re-export from shared (or direct copy)
└── backend/
    ├── src/
    │   ├── index.ts         ← Express + Socket.io setup, listen on PORT
    │   └── types.ts         ← Local copy of shared types
    ├── tsconfig.json
    └── package.json
```

**Shared types strategy:** For Phase 1 (no true monorepo tooling), copy `shared/types.ts` into `frontend/types/game.ts` and `backend/src/types.ts`. Phase 2 can upgrade to a local `npm link` or workspace reference. This avoids tsconfig path complexity in Phase 1.

### Pattern 1: SVG Grid Coordinate Math

**What:** Pure function that computes all dot, line, and box coordinates from `gridSize`.

**When to use:** Called at render time inside `GameBoard.tsx`, not stored in state.

```typescript
// frontend/lib/gridGeometry.ts
const DOT_SPACING = 80;   // px between dots in the viewBox
const DOT_RADIUS   = 6;
const LINE_WIDTH   = 6;
const HIT_WIDTH    = 20;  // invisible hit-area width for easy clicking
const PADDING      = 40;  // space around the outer dots

export function gridToViewBox(gridSize: number) {
  const size = PADDING * 2 + DOT_SPACING * (gridSize - 1);
  return { width: size, height: size }; // e.g. 400 × 400 for gridSize=5
}

export function dotPosition(row: number, col: number) {
  return {
    cx: PADDING + col * DOT_SPACING,
    cy: PADDING + row * DOT_SPACING,
  };
}

// Horizontal line: connects dot(row, col) — dot(row, col+1)
export function hLineCoords(row: number, col: number) {
  const x1 = PADDING + col * DOT_SPACING + DOT_RADIUS;
  const y1 = PADDING + row * DOT_SPACING;
  const x2 = PADDING + (col + 1) * DOT_SPACING - DOT_RADIUS;
  const y2 = y1;
  return { x1, y1, x2, y2 };
}

// Vertical line: connects dot(row, col) — dot(row+1, col)
export function vLineCoords(row: number, col: number) {
  const x1 = PADDING + col * DOT_SPACING;
  const y1 = PADDING + row * DOT_SPACING + DOT_RADIUS;
  const x2 = x1;
  const y2 = PADDING + (row + 1) * DOT_SPACING - DOT_RADIUS;
  return { x1, y1, x2, y2 };
}

// Box fill rect: top-left is dot(row, col), box is one cell below-right
export function boxRect(row: number, col: number) {
  const x = PADDING + col * DOT_SPACING + DOT_RADIUS;
  const y = PADDING + row * DOT_SPACING + DOT_RADIUS;
  const size = DOT_SPACING - DOT_RADIUS * 2;
  return { x, y, width: size, height: size };
}
```

For a 5×5 dot grid: viewBox is `"0 0 400 400"`, dots at positions 40,120,200,280,360 on each axis. hLines: 5 rows × 4 cols. vLines: 4 rows × 5 cols. Boxes: 4 rows × 4 cols.

### Pattern 2: `applyMove()` — Pure Function Game Loop

**What:** Immutable state transition. Takes current state + move, returns next state.

**When to use:** Called from Zustand store action in Phase 1 (hot-seat). Will be called on server in Phase 2.

```typescript
// frontend/lib/gameLogic.ts
export function findCompletedBoxes(
  hLines: boolean[][], vLines: boolean[][],
  existingBoxes: (null | 'p1' | 'p2')[][]
): Array<{ row: number; col: number }> {
  const completed: Array<{ row: number; col: number }> = [];
  const rows = existingBoxes.length;
  const cols = existingBoxes[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (existingBoxes[r][c] !== null) continue; // already claimed
      // Box (r,c) needs: top=hLines[r][c], bottom=hLines[r+1][c],
      //                  left=vLines[r][c], right=vLines[r][c+1]
      if (hLines[r][c] && hLines[r + 1][c] && vLines[r][c] && vLines[r][c + 1]) {
        completed.push({ row: r, col: c });
      }
    }
  }
  return completed;
}

export function initGameState(): LocalGameState {
  const N = 5;
  return {
    hLines: Array.from({ length: N }, () => Array(N - 1).fill(false)),
    vLines: Array.from({ length: N - 1 }, () => Array(N).fill(false)),
    boxes: Array.from({ length: N - 1 }, () => Array(N - 1).fill(null)),
    scores: { p1: 0, p2: 0 },
    currentTurn: 'p1' as const,
    status: 'active' as const,
    winner: null,
  };
}
```

**Critical index check for box boundaries:**
- `hLines[r][c]` — top of box at (r, c) — valid for r in 0..N-2, c in 0..N-2
- `hLines[r+1][c]` — bottom of box at (r, c) — r+1 goes up to N-1, which is valid (hLines has N rows)
- `vLines[r][c]` — left of box at (r, c) — valid for r in 0..N-2, c in 0..N-2
- `vLines[r][c+1]` — right of box at (r, c) — c+1 goes up to N-1, which is valid (vLines has N cols)

### Pattern 3: Zustand Store for Hot-Seat (Phase 1)

**What:** Local 2-player (same browser, alternating clicks) game state. No sockets.

```typescript
// frontend/store/gameStore.ts
'use client'; // Zustand stores that touch browser APIs need this guard indirectly
import { create } from 'zustand';
import { initGameState, applyMoveLogic } from '@/lib/gameLogic';
import type { LocalGameState, Move, Player } from '@/types/game';

interface GameStore {
  gameState: LocalGameState | null;
  startGame: () => void;
  makeMove: (move: Move) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  startGame: () => set({ gameState: initGameState() }),
  makeMove: (move) =>
    set((s) => {
      if (!s.gameState || s.gameState.status !== 'active') return s;
      return { gameState: applyMoveLogic(s.gameState, move) };
    }),
  resetGame: () => set({ gameState: null }),
}));
```

**Phase 1 hot-seat wiring:** Both players share one browser tab. `makeMove` is called for whichever player's turn it currently is. GAME-06 (`pointer-events-none` during opponent's turn) is a Phase 3 UI concern but the Zustand selector for it should exist now: `const isP1Turn = useGameStore(s => s.gameState?.currentTurn === 'p1')`.

In Phase 2, `makeMove` is replaced by `socket.emit('game:make_move', move)` and `setGameState` is called from the socket `game:state` handler instead.

### Pattern 4: Root `package.json` dev script

```json
{
  "scripts": {
    "dev": "concurrently --names \"FE,BE\" --prefix-colors \"cyan,yellow\" \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"",
    "dev:frontend": "npm run dev --prefix frontend",
    "dev:backend": "npm run dev --prefix backend"
  }
}
```

Backend `package.json` dev script:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts"
  }
}
```

### Pattern 5: Minimal Backend Scaffold (Phase 1)

Phase 1 only needs the backend to start without errors (INFRA-02, INFRA-06). Full game logic moves to server in Phase 2.

```typescript
// backend/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`Server listening on :${PORT}`));
```

### Anti-Patterns to Avoid

- **Storing grid geometry in state:** Line/dot positions are derived from `gridSize` — compute at render time, never put in Zustand or useState
- **Using `socket.id` as player identity:** Will break on reconnect (Phase 2 concern, but avoid building this assumption into Phase 1 types)
- **Zustand store with `immer` mutation for Phase 1:** Adds dependency complexity; plain spread immutability is sufficient at this scale
- **Putting game logic in React components:** `applyMove`, `findCompletedBoxes`, `initGameState` must live in `lib/gameLogic.ts`, not inside component files
- **`'use client'` on page.tsx without cause:** Only mark components that use browser APIs or hooks as client components; keep page.tsx a server component that wraps a client game component

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript execution in Node dev | Custom babel/webpack pipeline | `tsx watch` | tsx handles ESM + TS in one command, zero config |
| Running two dev servers | Shell scripts / Makefile | `concurrently` | Handles process cleanup on Ctrl+C, color-coded output |
| WebSocket reconnection | Manual socket.id tracking + retry loops | Socket.io built-in reconnection | Exponential backoff, transport fallback, already configured |
| State subscription outside React | `useEffect` polling / event emitters | Zustand `.getState()` + `.subscribe()` | Direct access without hooks needed for socket callbacks |

**Key insight:** The game logic itself (`applyMove`, `findCompletedBoxes`) is small enough to hand-roll — but all infrastructure (process management, TypeScript execution, socket reconnection) should use established tools.

---

## Common Pitfalls

### Pitfall 1: Zustand 5 Breaking API Changes

**What goes wrong:** Zustand 5 (latest) changed the `create` import — `import create from 'zustand'` (default import, v4) no longer works.

**Why it happens:** Zustand 5 switched to named exports only.

**How to avoid:** Use `import { create } from 'zustand'` (named import). This is what the Code Examples section shows.

**Warning signs:** TypeScript error "Module has no default export" when importing zustand.

### Pitfall 2: Express 5 Breaking Changes

**What goes wrong:** Express 5 (5.2.1, now stable) changed error handling middleware signature and some router behaviors vs Express 4.

**Why it happens:** Express 5 is the current `npm install express` default as of 2025.

**How to avoid:** Phase 1 backend is minimal (no routes, no middleware beyond cors) — not affected. For Phase 2+, be aware that `app.param()` and async route errors behave differently. See Express 5 migration guide.

**Warning signs:** Middleware that worked in Express 4 examples silently not firing.

### Pitfall 3: Off-by-One Grid Dimensions

**What goes wrong:** Using `(N-1) × (N-1)` for both hLines and vLines — box detection silently fails for edge cells.

**Why it happens:** Intuition says "4×4 grid of boxes means 4×4 line arrays" — incorrect.

**How to avoid:** For gridSize N: `hLines` is `N rows × (N-1) cols`, `vLines` is `(N-1) rows × N cols`.

For N=5: `hLines[5][4]` and `vLines[4][5]`. Validate with `console.assert(hLines.length === 5 && hLines[0].length === 4)` in `initGameState`.

**Warning signs:** Box completion works for interior boxes but not boxes touching the right or bottom edge.

### Pitfall 4: Next.js App Router SSR + Socket.io

**What goes wrong:** Importing socket.io-client in a server component crashes the build (`window is not defined`).

**Why it happens:** App Router renders components on the server by default.

**How to avoid:** `lib/socket.ts` may only be imported inside `'use client'` components. Gate socket-dependent rendering behind `useEffect` + `useState(false)` (`isMounted` pattern).

**Warning signs:** Build error "ReferenceError: window is not defined" or "document is not defined".

### Pitfall 5: React StrictMode Double-Invoke

**What goes wrong:** Socket connects twice in development, receiving events twice.

**Why it happens:** React StrictMode double-invokes effects in development to catch side effect bugs.

**How to avoid:** Use `autoConnect: false` in socket constructor + call `socket.connect()` in useEffect. The singleton pattern in `lib/socket.ts` means a second `getSocket()` call returns the existing instance.

**Warning signs:** Seeing "client connected" twice in backend console for one page load.

### Pitfall 6: Multiple Boxes from One Move

**What goes wrong:** A single line draw can complete two boxes simultaneously (corner placement). Counting only one box grants only one extra turn.

**Why it happens:** Each line borders at most 2 boxes. `findCompletedBoxes` must scan all unclaimed boxes, not stop at the first completed one.

**How to avoid:** `findCompletedBoxes` returns an array — iterate all `(N-1)²` unclaimed cells and collect all completions. Score increment is `completedBoxes.length`, not `1`.

---

## Code Examples

### `GameBoard.tsx` — SVG Structure Skeleton

```tsx
// Source: derived from RESEARCH-frontend.md SVG patterns + grid geometry above
'use client';
import { hLineCoords, vLineCoords, dotPosition, boxRect, gridToViewBox } from '@/lib/gridGeometry';
import type { LocalGameState, Move } from '@/types/game';

interface GameBoardProps {
  gameState: LocalGameState;
  onMove: (move: Move) => void;
  disabled: boolean;
}

export function GameBoard({ gameState, onMove, disabled }: GameBoardProps) {
  const N = 5;
  const { width, height } = gridToViewBox(N);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full max-w-[480px] ${disabled ? 'pointer-events-none' : ''}`}
    >
      {/* Box fills */}
      {gameState.boxes.map((row, r) =>
        row.map((owner, c) => owner && (
          <rect key={`box-${r}-${c}`} {...boxRect(r, c)}
            fill={owner === 'p1' ? '#3b82f6' : '#ef4444'} opacity={0.4} />
        ))
      )}

      {/* Horizontal lines */}
      {gameState.hLines.map((row, r) =>
        row.map((drawn, c) => {
          const coords = hLineCoords(r, c);
          return (
            <g key={`h-${r}-${c}`} onClick={() => !drawn && onMove({ type: 'h', row: r, col: c })}>
              <line {...coords} stroke={drawn ? '#1e293b' : '#e2e8f0'} strokeWidth={6} strokeLinecap="round" />
              {!drawn && <line {...coords} stroke="transparent" strokeWidth={20} className="cursor-pointer" />}
            </g>
          );
        })
      )}

      {/* Vertical lines — same pattern with vLineCoords */}

      {/* Dots (rendered last so they appear on top) */}
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => (
          <circle key={`dot-${r}-${c}`} {...dotPosition(r, c)} r={6} fill="#1e293b" />
        ))
      )}
    </svg>
  );
}
```

### `tsconfig.json` Path Alias (frontend)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

`create-next-app` sets this automatically when `--import-alias "@/*"` is used.

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend + backend runtime | Yes | v24.13.0 | — |
| npm | Package management | Yes | 11.6.2 | — |
| npx (create-next-app) | Frontend scaffold | Yes | bundled with npm | — |

Node v24 is well above the Next.js 16 minimum (Node 18.17+). No missing dependencies block execution.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 + React Testing Library 16.3.2 |
| Config file | `frontend/vitest.config.ts` — Wave 0 gap |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | `initGameState()` produces hLines[5][4], vLines[4][5], boxes[4][4] | unit | `npx vitest run lib/gameLogic` | Wave 0 |
| GAME-02 | `applyMove()` with undrawn line sets the correct array cell to true | unit | `npx vitest run lib/gameLogic` | Wave 0 |
| GAME-03 | `applyMove()` on box-completing line returns box claimed by current player | unit | `npx vitest run lib/gameLogic` | Wave 0 |
| GAME-04 | `applyMove()` on box-completing line keeps currentTurn unchanged | unit | `npx vitest run lib/gameLogic` | Wave 0 |
| GAME-05 | `applyMove()` on final box sets status='finished' and winner correctly | unit | `npx vitest run lib/gameLogic` | Wave 0 |
| GAME-06 | `GameBoard` receives `disabled=true` when `currentTurn !== myPlayer` | unit (component) | `npx vitest run components/game/GameBoard` | Wave 0 |
| INFRA-01 | `npm run dev` in frontend starts without error | smoke (manual) | `npm run dev:frontend` — observe no crash | manual |
| INFRA-02 | `npm run dev` in backend starts without error | smoke (manual) | `npm run dev:backend` — observe "Server listening" log | manual |
| INFRA-05 | `useGameStore.getState().startGame()` populates gameState correctly | unit | `npx vitest run store/gameStore` | Wave 0 |
| INFRA-06 | Root `npm run dev` starts both processes | smoke (manual) | `npm run dev` from root — observe both logs | manual |

### Sampling Rate

- **Per task commit:** `cd frontend && npx vitest run lib/gameLogic --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/vitest.config.ts` — configure jsdom environment, path aliases
- [ ] `frontend/vitest.setup.ts` — import `@testing-library/jest-dom`
- [ ] `frontend/__tests__/lib/gameLogic.test.ts` — covers GAME-01 through GAME-05
- [ ] `frontend/__tests__/store/gameStore.test.ts` — covers INFRA-05
- [ ] `frontend/__tests__/components/GameBoard.test.tsx` — covers GAME-06

**Framework install (Wave 0):**
```bash
cd frontend && npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `create` default import (Zustand v4) | `{ create }` named import (Zustand v5) | Zustand 5.0 (Oct 2024) | Import statement changes |
| Express 4.x | Express 5.x (now stable default) | Express 5.0 released 2024 | Async error handling built-in |
| `ts-node` for backend dev | `tsx` | 2023+ | Faster startup, zero config |
| Next.js Pages Router | App Router | Next.js 13+ | Layouts, server components |

---

## Open Questions

1. **Shared types — copy vs npm workspace**
   - What we know: For Phase 1 (no build pipeline), copying is simpler
   - What's unclear: Whether the plan should establish workspace infra now to avoid a refactor in Phase 2
   - Recommendation: Copy for Phase 1; leave a comment `// TODO Phase 2: move to shared npm workspace`; the planner should include a task to establish this in Phase 2 instead

2. **`applyMove` location in Phase 1**
   - What we know: In Phase 2, `applyMove` moves to the server (server-authoritative). In Phase 1, it runs in the Zustand store.
   - What's unclear: Whether to put it in `frontend/lib/gameLogic.ts` knowing it will be copied to `backend/src/gameLogic.ts` in Phase 2, or to put it in `shared/` from day one.
   - Recommendation: Put it in `frontend/lib/gameLogic.ts` for Phase 1 with a clear module boundary; Phase 2 copies it to backend. Shared/ folder exists as a placeholder for the types file.

---

## Sources

### Primary (HIGH confidence)

- npm registry (live query 2026-03-26) — all package versions verified
- `.planning/research/RESEARCH-game-architecture.md` — GameState types, applyMove algorithm, Socket.io patterns
- `.planning/research/RESEARCH-frontend.md` — Next.js + Socket.io integration, Zustand store shape, SVG approach
- Node.js v24.13.0 / npm 11.6.2 — verified via `node --version`

### Secondary (MEDIUM confidence)

- Zustand v5 named export change — documented in Zustand GitHub changelog, consistent with verified package version 5.0.12
- Express 5 stability — verified via npm (5.2.1 is latest, no prerelease tag)
- Next.js App Router SSR + socket.io gotcha — consistent across multiple sources, verified against Next.js docs pattern

### Tertiary (LOW confidence)

- None — all claims in this document are supported by primary or secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions live-verified from npm registry on 2026-03-26
- Architecture: HIGH — based on locked decisions in STATE.md + prior architecture research
- Pitfalls: HIGH — based on verified version changelogs (Zustand 5, Express 5) + architectural research
- Grid coordinate math: HIGH — pure arithmetic, verified by working through the N=5 case explicitly

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (Next.js + Zustand versions move fast; re-verify if > 30 days)
