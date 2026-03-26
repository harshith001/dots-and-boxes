# Research: Game Architecture — State, Socket.io, Bot AI

**Focus:** Game state model, Socket.io event design, room management, bot opponent

---

## Game State Data Structure

```ts
// Shared types (used by both server and client)
interface GameState {
  roomId: string;
  gridSize: number;          // 5 for a 5x5 dot grid (4x4 boxes)

  // hLines[row][col]: true = line drawn between dot(row,col) and dot(row,col+1)
  // Dimensions: (gridSize) rows × (gridSize-1) cols
  hLines: boolean[][];

  // vLines[row][col]: true = line drawn between dot(row,col) and dot(row+1,col)
  // Dimensions: (gridSize-1) rows × (gridSize) cols
  vLines: boolean[][];

  // boxes[row][col]: null = unclaimed, 'p1'|'p2' = claimed by player
  // Dimensions: (gridSize-1) × (gridSize-1)
  boxes: (null | 'p1' | 'p2')[][];

  scores: { p1: number; p2: number };
  currentTurn: 'p1' | 'p2';
  status: 'waiting' | 'active' | 'finished';
  winner: 'p1' | 'p2' | 'draw' | null;

  players: {
    p1: { id: string; username: string; isBot: boolean };
    p2: { id: string; username: string; isBot: boolean } | null;
  };
}

interface Move {
  type: 'h' | 'v';   // horizontal or vertical line
  row: number;
  col: number;
}
```

**Critical dimension gotcha:** For a 5×5 dot grid (which has 4×4 = 16 boxes):
- `hLines`: 5 rows × 4 cols (not 4×4)
- `vLines`: 4 rows × 5 cols (not 4×4)
- `boxes`: 4 rows × 4 cols

Off-by-one here breaks box detection silently.

---

## `applyMove()` — Server-Authoritative Game Loop

```ts
function applyMove(state: GameState, move: Move, playerId: string): GameState {
  const { type, row, col } = move;

  // 1. Validate it's player's turn and line not already drawn
  const playerKey = state.players.p1.id === playerId ? 'p1' : 'p2';
  if (state.currentTurn !== playerKey) throw new Error('Not your turn');
  if (type === 'h' && state.hLines[row][col]) throw new Error('Line exists');
  if (type === 'v' && state.vLines[row][col]) throw new Error('Line exists');

  // 2. Draw line (immutable update)
  const newHLines = state.hLines.map(r => [...r]);
  const newVLines = state.vLines.map(r => [...r]);
  if (type === 'h') newHLines[row][col] = true;
  else newVLines[row][col] = true;

  // 3. Check for completed boxes
  const completedBoxes = findCompletedBoxes(newHLines, newVLines, state.boxes);
  const newBoxes = applyBoxClaims(state.boxes, completedBoxes, playerKey);
  const boxesGained = completedBoxes.length;

  // 4. Update scores
  const newScores = {
    ...state.scores,
    [playerKey]: state.scores[playerKey] + boxesGained,
  };

  // 5. Turn management: if boxes completed, same player goes again
  const nextTurn = boxesGained > 0 ? playerKey : (playerKey === 'p1' ? 'p2' : 'p1');

  // 6. Check game over
  const totalBoxes = (state.gridSize - 1) ** 2;
  const filledBoxes = newScores.p1 + newScores.p2;
  const isFinished = filledBoxes === totalBoxes;

  return {
    ...state,
    hLines: newHLines,
    vLines: newVLines,
    boxes: newBoxes,
    scores: newScores,
    currentTurn: nextTurn,
    status: isFinished ? 'finished' : 'active',
    winner: isFinished ? determineWinner(newScores) : null,
  };
}
```

**Server authority:** `applyMove()` runs only on server. Server broadcasts the resulting state to both clients — clients never advance state themselves.

---

## Socket.io Event Table

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `game:join_queue` | C→S | `{ username }` | Quick match |
| `game:create_room` | C→S | `{ username }` | Returns `roomCode` |
| `game:join_room` | C→S | `{ username, roomCode }` | Invite link flow |
| `game:state` | S→C | `GameState` | Full state sync |
| `game:make_move` | C→S | `Move` | Client submits move |
| `game:move_made` | S→C | `{ move, newState }` | Broadcast to room |
| `game:opponent_joined` | S→C | `{ username }` | P2 connected |
| `game:opponent_left` | S→C | `{}` | Disconnection |
| `reaction:send` | C→S | `{ emoji }` | Rate-limited |
| `reaction:receive` | S→C | `{ emoji }` | To opponent only |
| `chat:send` | C→S | `{ messageIndex }` | 0-2 index |
| `chat:receive` | S→C | `{ messageIndex, sender }` | |

Use `io.to(roomId).emit()` to broadcast to all in room. Use `socket.to(roomId).emit()` to broadcast to others (not sender). Never use `socket.broadcast` — it bypasses room scoping.

---

## Room Store + Matchmaking Queue

```ts
// server/state.ts
interface Room {
  id: string;
  gameState: GameState;
  playerSocketIds: { p1: string; p2: string | null };
  playerTokens: { p1: string; p2: string | null }; // for reconnection
  botTimeout?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();
const queue: Array<{ socketId: string; username: string; token: string }> = [];

// Quick match: dequeue or enqueue
function handleJoinQueue(socket, username) {
  if (queue.length > 0) {
    const opponent = queue.shift()!;
    const roomId = generateRoomId();
    createRoom(roomId, opponent, { socketId: socket.id, username });
  } else {
    queue.push({ socketId: socket.id, username, token: generateToken() });
    // Start 5s bot fallback
    setTimeout(() => {
      if (stillInQueue(socket.id)) {
        dequeue(socket.id);
        createRoomWithBot(socket.id, username);
      }
    }, 5000);
  }
}

// Always dequeue on disconnect
socket.on('disconnect', () => {
  removeFromQueue(socket.id);
  handlePlayerDisconnect(socket.id);
});
```

---

## Reconnection with Persistent Player Token

**Problem:** `socket.id` changes on reconnect — room membership is lost.

**Solution:** Issue a persistent `playerToken` (UUID) when player first joins. Store in cookie or `localStorage`. On reconnect, re-associate `socket.id` with the `playerToken` and rejoin the Socket.io room.

```ts
socket.on('game:reconnect', ({ token }) => {
  const room = findRoomByToken(token);
  if (!room) { socket.emit('game:room_not_found'); return; }
  socket.join(room.id);
  updateSocketId(room, token, socket.id);
  socket.emit('game:state', room.gameState); // full state resync
});
```

---

## Bot AI — 3-Tier Decision Tree

```ts
function getBotMove(state: GameState): Move {
  // Tier 1: Complete a box (always take it)
  const winningMove = findBoxCompletingMove(state);
  if (winningMove) return winningMove;

  // Tier 2: Safe move (doesn't give opponent a box)
  const safeMove = findSafeMove(state);
  if (safeMove) return safeMove;

  // Tier 3: Sacrifice smallest chain (minimizes opponent gain)
  return findSmallestChainSacrifice(state);
}
```

- **Think delay:** `setTimeout(playBotMove, 600 + Math.random() * 400)` — feels natural, not instant
- **Hard timeout:** If bot hasn't moved in 5s (shouldn't happen), play a random valid move
- **Guard:** Always check `gameState.status === 'active'` before playing — bot must not move after game ends

---

## Orphaned Room Cleanup

```ts
// Rooms with no active sockets after 30s → delete
function scheduleRoomCleanup(roomId: string) {
  setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room) return;
    const bothGone = !io.sockets.adapter.rooms.has(roomId);
    if (bothGone) rooms.delete(roomId);
  }, 30_000);
}
```

---

## Recommended File Structure

```
server/
  index.ts          → Express + Socket.io setup
  state.ts          → rooms Map, queue array, matchmaking logic
  gameLogic.ts      → applyMove, findCompletedBoxes, initGameState
  botAI.ts          → getBotMove decision tree
  types.ts          → GameState, Move, Room interfaces

shared/
  types.ts          → Shared interfaces imported by both server + client
```

---

## Key Gotchas

1. **Off-by-one grid dimensions** — hLines is `N × (N-1)`, vLines is `(N-1) × N` for N-dot grid
2. **`socket.id` on reconnect** — use persistent playerToken, not socket.id as player ID
3. **Bot plays after game ends** — always guard with `status === 'active'` check
4. **Orphaned rooms** — schedule cleanup 30s after last disconnect; don't leak memory
5. **`io.to()` vs `socket.to()`** — `io.to()` includes sender, `socket.to()` excludes sender
6. **Same-turn-on-box-claim** — `applyMove` must detect all boxes from a single move (one move can claim multiple boxes at corners)
7. **Queue dequeue on disconnect** — critical; otherwise disconnected players block matchmaking
8. **Bot cooldown timer leak** — clear `botTimeout` when second player joins before the 5s fires

---

## RESEARCH COMPLETE
