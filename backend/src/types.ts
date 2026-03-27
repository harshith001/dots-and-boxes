// Source: shared/types.ts — copied for Phase 1
// TODO Phase 2: move to shared npm workspace
export type Player = 'p1' | 'p2';

export interface Move {
  type: 'h' | 'v';
  row: number;
  col: number;
}

export interface LocalGameState {
  hLines: boolean[][];
  vLines: boolean[][];
  boxes: (Player | null)[][];
  scores: { p1: number; p2: number };
  currentTurn: Player;
  status: 'active' | 'finished';
  winner: Player | 'draw' | null;
}

// --- Multiplayer Types ---

export type RoomStatus = 'waiting' | 'active' | 'finished';

export interface RoomPlayer {
  playerToken: string;   // persistent UUID, survives reconnect
  socketId: string;      // current socket.id (changes on reconnect)
  name: string;
  role: Player;          // 'p1' | 'p2'
  connected: boolean;
}

export interface Room {
  id: string;
  status: RoomStatus;
  players: RoomPlayer[];
  gameState: LocalGameState;
  createdAt: number;
}

// Socket event payloads

export interface CreateRoomPayload {
  playerToken: string;
  playerName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerToken: string;
  playerName: string;
}

export interface MakeMovePayload {
  roomId: string;
  playerToken: string;
  move: Move;
}

export interface LeaveRoomPayload {
  roomId: string;
  playerToken: string;
}

export interface RoomCreatedEvent {
  roomId: string;
  playerRole: Player;
  inviteUrl: string;
}

export interface GameStateEvent {
  gameState: LocalGameState;
  room: Pick<Room, 'id' | 'status' | 'players'>;
}
