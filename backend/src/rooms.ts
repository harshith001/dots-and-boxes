import { v4 as uuidv4 } from 'uuid';
import type { Room, RoomPlayer, Move } from './types.js';
import { applyMove, createInitialState } from './gameEngine.js';

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(playerToken: string, playerName: string, gridSize = 5): Room {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const player: RoomPlayer = {
      playerToken,
      socketId: '',
      name: playerName,
      role: 'p1',
      connected: true,
    };
    const room: Room = {
      id: roomId,
      status: 'waiting',
      players: [player],
      gameState: createInitialState(gridSize),
      createdAt: Date.now(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, playerToken: string, playerName: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Reconnect existing player
    const existing = room.players.find(p => p.playerToken === playerToken);
    if (existing) {
      existing.connected = true;
      return room;
    }

    // Room full
    if (room.players.length >= 2) return null;

    // Join as p2
    room.players.push({
      playerToken,
      socketId: '',
      name: playerName,
      role: 'p2',
      connected: true,
    });
    room.status = 'active';
    return room;
  }

  applyMove(roomId: string, playerToken: string, move: Move): Room | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'active') return null;

    const player = room.players.find(p => p.playerToken === playerToken);
    if (!player) return null;

    // Validate it's this player's turn
    if (room.gameState.currentTurn !== player.role) return null;

    const nextState = applyMove(room.gameState, move, player.role);
    room.gameState = nextState;
    if (nextState.status === 'finished') room.status = 'finished';
    return room;
  }

  setSocketId(playerToken: string, socketId: string): void {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.playerToken === playerToken);
      if (player) {
        player.socketId = socketId;
        return;
      }
    }
  }

  markDisconnected(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.socketId = '';
        return room;
      }
    }
    return null;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByToken(playerToken: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.playerToken === playerToken)) return room;
    }
    return undefined;
  }

  addBotToRoom(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length !== 1 || room.status !== 'waiting') return null;
    room.players.push({
      playerToken: 'BOT_' + uuidv4().slice(0, 6),
      socketId: 'BOT',
      name: 'NEXUS_BOT',
      role: 'p2',
      connected: true,
    });
    room.status = 'active';
    return room;
  }

  // Cleanup rooms older than 2 hours
  cleanup(): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, room] of this.rooms.entries()) {
      if (room.createdAt < twoHoursAgo && room.status === 'finished') {
        this.rooms.delete(id);
      }
    }
  }
}

export const roomManager = new RoomManager();
