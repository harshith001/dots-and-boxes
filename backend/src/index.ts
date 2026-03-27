import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './rooms.js';
import { pickBotMove } from './bot.js';
import type {
  CreateRoomPayload, JoinRoomPayload, MakeMovePayload, LeaveRoomPayload,
  EmojiSendPayload, ChatSendPayload
} from './types.js';

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
});

// Matchmaking queue: playerToken → { socketId, name }
const queue = new Map<string, { socketId: string; name: string }>();

// Emoji dedup: playerToken → last send timestamp (ms)
const emojiLastSent = new Map<string, number>();

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
  socket.on('room:create', ({ playerToken, playerName }: CreateRoomPayload) => {
    const room = roomManager.createRoom(playerToken, playerName);
    roomManager.setSocketId(playerToken, socket.id);
    socket.join(room.id);

    const inviteUrl = `${FRONTEND_URL}/room/${room.id}`;
    socket.emit('room:created', { roomId: room.id, playerRole: 'p1', inviteUrl });

    // Bot fallback after 5 seconds if still waiting
    setTimeout(() => {
      const current = roomManager.getRoom(room.id);
      if (current?.status === 'waiting') {
        roomManager.addBotToRoom(room.id);
        emitGameState(room.id);
        scheduleBotMove(room.id);
      }
    }, 5000);
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
  socket.on('queue:join', ({ playerToken, playerName }: CreateRoomPayload) => {
    // Remove stale entry for same token
    queue.delete(playerToken);

    // Find a waiting opponent
    const [opponentToken, opponentInfo] = [...queue.entries()][0] ?? [];
    if (opponentToken) {
      queue.delete(opponentToken);
      // Create room, join both
      const room = roomManager.createRoom(opponentToken, opponentInfo.name);
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
        const room = roomManager.createRoom(playerToken, playerName);
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
