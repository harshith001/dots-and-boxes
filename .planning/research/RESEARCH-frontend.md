# Research: Frontend — Next.js + Socket.io + Game UI

**Focus:** App Router + Socket.io client, rendering approach, animations, state management

---

## Next.js + Socket.io Integration

**Use a separate Node.js backend** — do not use Next.js custom server for Socket.io. Reasons:
- Next.js custom server disables most App Router optimizations
- Clean separation makes deployment (Vercel frontend + Railway/Fly backend) straightforward
- Socket.io needs persistent TCP connections; serverless doesn't support this

**Client singleton pattern** (avoids SSR crash + StrictMode double-connect):

```ts
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
      autoConnect: false,
    });
  }
  return socket;
}
```

- `autoConnect: false` — connect explicitly when entering a game room
- Only import/use in `'use client'` components
- One `useEffect` that calls `socket.connect()` on mount and `socket.disconnect()` on unmount

**SSR gotcha:** Any component that imports `getSocket()` must have `'use client'` at the top. Socket.io's `window` access crashes SSR.

---

## Rendering Approach: SVG (Recommended)

Dots & Boxes grid has at most 84 lines (5×5 grid = 4×5 + 5×4 = 40 horizontal + 40 vertical lines). SVG wins:

| Approach | Pros | Cons |
|----------|------|------|
| **SVG** | Declarative, React-diffable, CSS-animatable, click-hittable | None for this scale |
| Canvas | Good for large dynamic scenes | Imperative, no React diff, manual hit detection |
| DOM divs | Familiar | Brittle positioning, not animatable cleanly |

**Grid geometry as pure function** (not stored in state):

```ts
export function getLineSegments(gridSize: number) {
  // Returns { hLines: [{x1,y1,x2,y2,row,col}], vLines: [...] }
  // Called at render time, not stored
}
```

**Line click hit area:** Render invisible `<rect>` or `<line strokeWidth={16}` over visible thin line for easy clicking.

---

## Animations

**Line draw effect** — CSS `stroke-dasharray` / `stroke-dashoffset`:

```css
@keyframes drawLine {
  from { stroke-dashoffset: 100%; }
  to   { stroke-dashoffset: 0; }
}

.line-drawn {
  stroke-dasharray: 100%;
  animation: drawLine 200ms ease-out forwards;
}
```

**Box fill effect** — CSS `scale` keyframe:

```css
@keyframes fillBox {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 0.7; }
}
```

**+1 score popup** — Absolutely positioned DOM `<div>` (not SVG) with `translateY` + `opacity`:

```tsx
// Short-lived component, mount → animate → unmount via onAnimationEnd
```

---

## State Management: Zustand

Over React Context — surgical re-renders via selectors, store actions callable from socket callbacks outside React tree.

```ts
// store/gameStore.ts
interface GameStore {
  gameState: GameState | null;
  myPlayerId: string | null;
  setGameState: (state: GameState) => void;
  applyMove: (move: Move) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  myPlayerId: null,
  setGameState: (gameState) => set({ gameState }),
  applyMove: (move) => set((s) => ({ gameState: applyMoveLocally(s.gameState!, move) })),
}));
```

Socket callbacks call `useGameStore.getState().setGameState(...)` directly — no hooks needed.

---

## Component Architecture

```
app/
  page.tsx              → Landing / Quick Match / Invite entry
  game/[roomId]/
    page.tsx            → Game screen (client component wrapper)
  dashboard/
    page.tsx            → Stats dashboard
  leaderboard/
    page.tsx            → Leaderboard

components/
  game/
    GameBoard.tsx       → SVG board, purely presentational
    ScoreBar.tsx        → Top score + turn indicator
    ChatPanel.tsx       → Predefined message buttons + log
    EmojiPanel.tsx      → Reaction buttons + float layer
    GameEndModal.tsx    → Win/loss overlay
  layout/
    GameLayout.tsx      → 3-col grid wrapper

hooks/
  useGameSocket.ts      → All socket.on/emit, bridges socket → Zustand
  useEmojiFloat.ts      → Float animation state management

lib/
  socket.ts             → Socket singleton
  gameLogic.ts          → Pure game state functions (shared with server types)
```

**Rule:** `GameBoard` receives only derived props (which lines exist, which boxes are filled, whose turn). No direct socket access. All socket events route through `useGameSocket`.

---

## Routing

- `/` — Home: enter username, choose Quick Match or Create Room
- `/game/[roomId]` — Active game
- `/dashboard` — Player stats (username from session cookie)
- `/leaderboard` — Global leaderboard (static-ish, revalidate every 30s)

---

## Key Gotchas

- **StrictMode double-connect:** `autoConnect: false` + explicit `socket.connect()` in `useEffect` prevents duplicate connections
- **Hydration mismatch:** Don't render socket-dependent UI on server — use `useState(false)` + `useEffect` to gate rendering
- **Zustand + SSR:** Initialize store with `null` defaults; hydrate after socket connects
- **SVG coordinate system:** Use `viewBox` with fixed dimensions (e.g. `480 480`), let CSS scale the element — don't compute pixel positions in JS
- **`pointer-events-none`** on board: set via CSS class toggled by Zustand `isMyTurn` selector — never derive from local React state

---

## RESEARCH COMPLETE
