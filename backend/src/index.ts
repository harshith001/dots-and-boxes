import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { roomManager } from './rooms.js';
import { pickBotMove } from './bot.js';
import { recordMatch, getPlayerStats, getMatchHistory, getLeaderboard, upsertPlayer } from './db.js';
import type {
  CreateRoomPayload, JoinRoomPayload, MakeMovePayload, LeaveRoomPayload,
  EmojiSendPayload, ChatSendPayload
} from './types.js';

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Session (operator identity) ────────────────────────────────────────────

app.post('/api/session', (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const operatorName = name.trim().toUpperCase().slice(0, 24);
  upsertPlayer(operatorName);
  res.cookie('operatorName', operatorName, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  res.json({ operatorName });
});

app.get('/api/session', (req, res) => {
  const operatorName = (req.cookies as Record<string, string>)['operatorName'];
  if (!operatorName) {
    res.status(401).json({ error: 'no session' });
    return;
  }
  res.json({ operatorName });
});

app.delete('/api/session', (_req, res) => {
  res.clearCookie('operatorName');
  res.json({ ok: true });
});

// ── Stats & Leaderboard ────────────────────────────────────────────────────

app.get('/api/stats/:username', (req, res) => {
  const { username } = req.params;
  if (!username) {
    res.status(400).json({ error: 'username required' });
    return;
  }
  const stats = getPlayerStats(username);
  const history = getMatchHistory(username);
  res.json({ stats, history });
});

app.get('/api/leaderboard', (_req, res) => {
  res.json({ leaderboard: getLeaderboard() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
});

// Matchmaking queue: playerToken → { socketId, name }
const queue = new Map<string, { socketId: string; name: string }>();

// Emoji dedup: playerToken → last send timestamp (ms)
const emojiLastSent = new Map<string, number>();

// Track rooms whose match result has already been recorded
const recordedRooms = new Set<string>();

function emitGameState(roomId: string): void {
  const room = roomManager.getRoom(roomId);
  if (!room) return;
  io.to(roomId).emit('game:state', {
    gameState: room.gameState,
    room: { id: room.id, status: room.status, players: room.players },
  });
  if (room.gameState.status === 'finished') {
    io.to(roomId).emit('game:end', {
      winner: room.gameState.winner,
      scores: room.gameState.scores,
    });
    // Record match exactly once per room
    if (!recordedRooms.has(room.id)) {
      recordedRooms.add(room.id);
      const p1 = room.players.find(p => p.role === 'p1');
      const p2 = room.players.find(p => p.role === 'p2');
      if (p1 && p2 && p2.socketId !== 'BOT') {
        const scoreP1 = room.gameState.scores['p1'] ?? 0;
        const scoreP2 = room.gameState.scores['p2'] ?? 0;
        let winner: string | null = null;
        if (room.gameState.winner === 'p1') winner = p1.name;
        else if (room.gameState.winner === 'p2') winner = p2.name;
        // Ensure both players exist in DB
        upsertPlayer(p1.name);
        upsertPlayer(p2.name);
        recordMatch(room.id, p1.name, p2.name, winner, scoreP1, scoreP2);
      }
    }
  }
}

// Schedule bot move with 600ms delay (feels natural)
function scheduleBotMove(roomId: string): void {
  const room = roomManager.getRoom(roomId);
  if (!room || room.gameState.status !== 'active') return;
  const bot = room.players.find(p => p.socketId === 'BOT');
  if (!bot || room.gameState.currentTurn !== bot.role) return;

  setTimeout(() => {
    const currentRoom = roomManager.getRoom(roomId);
    if (!currentRoom) return;
    const move = pickBotMove(currentRoom.gameState);
    if (!move) return;
    roomManager.applyMove(roomId, bot.playerToken, move);
    emitGameState(roomId);
    // Chain bot moves (if bot gets another turn)
    scheduleBotMove(roomId);
  }, 600);
}

io.on('connection', (socket) => {
  console.log('[socket] connected', socket.id);

  // Create private room
  socket.on('room:create', ({ playerToken, playerName, gridSize }: CreateRoomPayload) => {
    const room = roomManager.createRoom(playerToken, playerName, gridSize ?? 5);
    roomManager.setSocketId(playerToken, socket.id);
    socket.join(room.id);

    const inviteUrl = `${FRONTEND_URL}/room/${room.id}`;
    socket.emit('room:created', { roomId: room.id, playerRole: 'p1', inviteUrl });

    // No bot fallback for private rooms — wait for the invited player indefinitely
  });

  // Join room (quick match or private invite)
  socket.on('room:join', ({ roomId, playerToken, playerName }: JoinRoomPayload) => {
    const room = roomManager.joinRoom(roomId, playerToken, playerName);
    if (!room) {
      socket.emit('error', { message: 'Room not found or full' });
      return;
    }
    roomManager.setSocketId(playerToken, socket.id);
    socket.join(roomId);
    emitGameState(roomId);
    scheduleBotMove(roomId);
  });

  // Quick match: add to queue or pair with waiting player
  socket.on('queue:join', ({ playerToken, playerName, gridSize }: CreateRoomPayload) => {
    // Remove stale entry for same token
    queue.delete(playerToken);

    // Find a waiting opponent
    const [opponentToken, opponentInfo] = [...queue.entries()][0] ?? [];
    if (opponentToken) {
      queue.delete(opponentToken);
      // Create room, join both
      const room = roomManager.createRoom(opponentToken, opponentInfo.name, gridSize ?? 5);
      roomManager.setSocketId(opponentToken, opponentInfo.socketId);

      const opponentSocket = io.sockets.sockets.get(opponentInfo.socketId);
      if (opponentSocket) opponentSocket.join(room.id);

      roomManager.joinRoom(room.id, playerToken, playerName);
      roomManager.setSocketId(playerToken, socket.id);
      socket.join(room.id);

      // Notify both
      opponentSocket?.emit('queue:matched', { roomId: room.id, playerRole: 'p1' });
      socket.emit('queue:matched', { roomId: room.id, playerRole: 'p2' });
      emitGameState(room.id);
    } else {
      // Wait in queue; bot fallback after 5s
      queue.set(playerToken, { socketId: socket.id, name: playerName });
      socket.emit('queue:waiting', {});

      setTimeout(() => {
        if (!queue.has(playerToken)) return; // already matched
        queue.delete(playerToken);
        const room = roomManager.createRoom(playerToken, playerName, gridSize ?? 5);
        roomManager.setSocketId(playerToken, socket.id);
        socket.join(room.id);
        socket.emit('queue:matched', { roomId: room.id, playerRole: 'p1' });
        roomManager.addBotToRoom(room.id);
        emitGameState(room.id);
        scheduleBotMove(room.id);
      }, 5000);
    }
  });

  // Make move
  socket.on('room:move', ({ roomId, playerToken, move }: MakeMovePayload) => {
    const room = roomManager.applyMove(roomId, playerToken, move);
    if (!room) {
      socket.emit('error', { message: 'Invalid move' });
      return;
    }
    emitGameState(roomId);
    scheduleBotMove(roomId);
  });

  // Emoji reaction
  socket.on('emoji:send', ({ roomId, playerToken, emoji }: EmojiSendPayload) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    const player = room.players.find(p => p.playerToken === playerToken);
    if (!player) return;

    const now = Date.now();
    const last = emojiLastSent.get(playerToken) ?? 0;
    if (now - last < 2000) return; // 2s dedup
    emojiLastSent.set(playerToken, now);

    io.to(roomId).emit('emoji:received', { emoji, fromRole: player.role });
  });

  // Chat message
  socket.on('chat:send', ({ roomId, playerToken, message }: ChatSendPayload) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    const player = room.players.find(p => p.playerToken === playerToken);
    if (!player) return;

    io.to(roomId).emit('chat:received', {
      message,
      fromRole: player.role,
      fromName: player.name,
    });
  });

  // Leave room
  socket.on('room:leave', ({ roomId, playerToken: _playerToken }: LeaveRoomPayload) => {
    roomManager.markDisconnected(socket.id);
    socket.leave(roomId);
    io.to(roomId).emit('opponent:disconnected', {});
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('[socket] disconnected', socket.id);
    // Remove from matchmaking queue
    for (const [token, info] of queue.entries()) {
      if (info.socketId === socket.id) { queue.delete(token); break; }
    }
    const room = roomManager.markDisconnected(socket.id);
    if (room && room.status === 'active') {
      io.to(room.id).emit('opponent:disconnected', {});
    }
  });
});

// Cleanup every hour
setInterval(() => roomManager.cleanup(), 60 * 60 * 1000);

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
