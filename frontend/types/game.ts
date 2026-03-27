// Source: shared/types.ts — copied for Phase 1 (no monorepo tooling yet)
// TODO Phase 2: move to shared npm workspace

export type Player = 'p1' | 'p2';

export interface Move {
  type: 'h' | 'v';
  row: number;
  col: number;
}

export interface LocalGameState {
  hLines: boolean[][];      // 5 rows x 4 cols for 5x5 grid
  vLines: boolean[][];      // 4 rows x 5 cols for 5x5 grid
  boxes: (Player | null)[][]; // 4 rows x 4 cols
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

// --- Social Types ---

export type EmojiReaction = '😎' | '😂' | '😡' | '🔥' | '👏';

export interface EmojiSendPayload {
  roomId: string;
  playerToken: string;
  emoji: EmojiReaction;
}

export interface ChatSendPayload {
  roomId: string;
  playerToken: string;
  message: string;
}

export interface EmojiReceivedEvent {
  emoji: EmojiReaction;
  fromRole: Player;
}

export interface ChatReceivedEvent {
  message: string;
  fromRole: Player;
  fromName: string;
}
