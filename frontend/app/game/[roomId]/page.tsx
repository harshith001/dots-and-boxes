'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { connectSocket, getSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import { EmojiPanel } from '@/components/game/EmojiPanel';
import { ChatPanel } from '@/components/game/ChatPanel';
import type { GameStateEvent, Move, EmojiReaction, EmojiReceivedEvent, ChatReceivedEvent } from '@/types/game';

interface FloatingEmoji {
  id: number;
  emoji: EmojiReaction;
  x: number;
}

export default function MultiplayerGamePage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const applyServerState = useGameStore(s => s.applyServerState);
  const setOpponentDisconnected = useGameStore(s => s.setOpponentDisconnected);
  const gameState = useGameStore(s => s.gameState);
  const playerRole = useGameStore(s => s.playerRole);
  const opponentDisconnected = useGameStore(s => s.opponentDisconnected);

  const [opponentName, setOpponentName] = useState<string>('');
  const [log, setLog] = useState<string[]>(['[SYSTEM] CONNECTION ESTABLISHED.']);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [chatLog, setChatLog] = useState<ChatReceivedEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const emojiIdCounter = useRef(0);

  const myName = typeof window !== 'undefined'
    ? sessionStorage.getItem('operatorName') ?? 'OP_01'
    : 'OP_01';

  const gridSize = typeof window !== 'undefined'
    ? parseInt(sessionStorage.getItem('gridSize') ?? '5')
    : 5;

  const gridLabel = gridSize === 5 ? '5×5' : gridSize === 9 ? '9×9' : '13×13';

  useEffect(() => {
    const token = getOrCreatePlayerToken();
    const name = sessionStorage.getItem('operatorName') ?? 'OPERATOR';
    const socket = connectSocket();

    socket.emit('room:join', { roomId, playerToken: token, playerName: name });

    function onGameState(data: GameStateEvent) {
      applyServerState(data.gameState);
      const opp = data.room.players.find(p => p.playerToken !== token);
      if (opp) setOpponentName(opp.name);

      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const turn = data.gameState.currentTurn === 'p1' ? 'OP_01' : 'OP_02';
      setLog(prev => [...prev.slice(-40), `[${now}] TURN: ${turn}`]);
    }

    function onOpponentDisconnected() {
      setOpponentDisconnected(true);
      setLog(prev => [...prev, '[WARN] OPPONENT_DISCONNECTED.']);
    }

    function onEmojiReceived(event: EmojiReceivedEvent) {
      const id = ++emojiIdCounter.current;
      const x = Math.floor(Math.random() * 70) + 10;
      setFloatingEmojis(prev => [...prev, { id, emoji: event.emoji, x }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== id));
      }, 1900);
    }

    function onChatReceived(event: ChatReceivedEvent) {
      setChatLog(prev => [...prev, event]);
    }

    socket.on('game:state', onGameState);
    socket.on('opponent:disconnected', onOpponentDisconnected);
    socket.on('emoji:received', onEmojiReceived);
    socket.on('chat:received', onChatReceived);

    return () => {
      socket.off('game:state', onGameState);
      socket.off('opponent:disconnected', onOpponentDisconnected);
      socket.off('emoji:received', onEmojiReceived);
      socket.off('chat:received', onChatReceived);
      socket.emit('room:leave', { roomId, playerToken: token });
    };
  }, [roomId, applyServerState, setOpponentDisconnected]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function handleLineClick(move: Move) {
    const token = getOrCreatePlayerToken();
    getSocket().emit('room:move', { roomId, playerToken: token, move });
  }

  function handleEmojiSend(emoji: EmojiReaction) {
    const token = getOrCreatePlayerToken();
    getSocket().emit('emoji:send', { roomId, playerToken: token, emoji });
  }

  function handleChatSend(message: string) {
    const token = getOrCreatePlayerToken();
    getSocket().emit('chat:send', { roomId, playerToken: token, message });
  }

  const p1Score = gameState?.scores.p1 ?? 0;
  const p2Score = gameState?.scores.p2 ?? 0;
  const isFinished = gameState?.status === 'finished';

  const myRole = playerRole ?? 'p1';
  const isMyTurn = gameState?.currentTurn === myRole;
  const oppRole = myRole === 'p1' ? 'p2' : 'p1';
  const myScore = myRole === 'p1' ? p1Score : p2Score;
  const oppScore = myRole === 'p1' ? p2Score : p1Score;
  const isMyTurnActive = isMyTurn && !isFinished;
  const isOppTurnActive = !isMyTurn && !isFinished;

  const myAccent = myRole === 'p1' ? '#ffffff' : '#c3f400';
  const oppAccent = oppRole === 'p1' ? '#ffffff' : '#c3f400';

  return (
    <div className="h-screen bg-[#0a0a0a] text-white font-body flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-[#111111] border-b border-[#1e1e1e] shrink-0">
        <span className="font-headline font-bold tracking-tighter text-white text-lg">KINETIC_GRID</span>
        <div className="hidden md:flex items-center gap-8">
          <span className="font-label text-[10px] tracking-widest text-[#555555]">
            ROOM: <span className="text-[#c3f400]">{roomId}</span>
          </span>
          <span className="font-label text-[10px] tracking-widest text-[#555555]">
            OPERATOR: <span className="text-white">{myName}</span>
          </span>
        </div>
        <span
          className="material-symbols-outlined text-[#555555] hover:text-white cursor-pointer transition-colors"
          style={{ fontSize: '18px' }}
        >
          help
        </span>
      </header>

      {/* 3-column body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Panel (me) ── */}
        <div className="w-[180px] shrink-0 flex flex-col bg-[#0e0e0e] border-r border-[#1e1e1e]">
          {/* Role badge + turn indicator */}
          <div className="flex items-center gap-2 px-5 pt-5 pb-2">
            <div
              className="w-8 h-5 flex items-center justify-center font-headline text-[9px] font-bold tracking-widest shrink-0"
              style={{ border: `1px solid ${myAccent}25`, color: myAccent }}
            >
              {myRole.toUpperCase()}
            </div>
            {isMyTurnActive && (
              <>
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: myAccent }}
                />
                <span
                  className="font-label text-[8px] tracking-widest truncate"
                  style={{ color: myAccent }}
                >
                  YOUR_TURN
                </span>
              </>
            )}
          </div>

          {/* Name */}
          <div className="px-5 font-label text-[11px] tracking-widest text-[#555555] truncate">
            {myName}
          </div>

          {/* Score */}
          <div className="px-5 pt-2 pb-4 flex items-baseline gap-1.5">
            <span
              className="font-headline text-5xl font-black tabular-nums transition-all duration-300"
              style={{
                color: myAccent,
                textShadow: isMyTurnActive ? `0 0 24px ${myAccent}50` : 'none',
              }}
            >
              {myScore}
            </span>
            <span className="font-label text-[9px] tracking-widest text-[#333333]">PTS</span>
          </div>

          {/* Telemetry */}
          <div className="flex-1 flex flex-col overflow-hidden border-t border-[#1a1a1a] px-5 pt-3 min-h-0">
            <div className="font-label text-[8px] tracking-widest text-[#333333] mb-2 flex items-center gap-2">
              TELEMETRY_FEED
              <span className="w-1 h-1 bg-[#c3f400] animate-pulse" />
            </div>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9px] leading-relaxed"
            >
              {log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    color: entry.includes('[SYSTEM]')
                      ? '#c3f400'
                      : entry.includes('[WARN]')
                        ? '#ff6b35'
                        : '#3a3a3a',
                  }}
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>

          {/* Footer metadata */}
          <div className="px-5 pb-5 pt-3 border-t border-[#1a1a1a] space-y-2 shrink-0">
            <div>
              <div className="font-label text-[8px] text-[#2a2a2a] tracking-widest">GRID_SCALE</div>
              <div className="font-headline text-[10px] text-[#4a4a4a]">{gridLabel}</div>
            </div>
            <div>
              <div className="font-label text-[8px] text-[#2a2a2a] tracking-widest">STATUS</div>
              <div
                className="font-headline text-[10px]"
                style={{ color: isFinished ? '#3a3a3a' : '#c3f400' }}
              >
                {isFinished ? 'COMPLETE' : 'ACTIVE'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: board + emoji ── */}
        <div className="flex-1 flex flex-col items-center overflow-hidden py-4 px-4 gap-3">
          {/* Turn bar */}
          <div className="font-label text-[10px] tracking-widest uppercase w-full text-center shrink-0">
            {isFinished ? (
              <span className="text-[#c3f400]">GAME_COMPLETE</span>
            ) : isMyTurn ? (
              <span className="text-[#c3f400] animate-pulse">YOUR_TURN ▸</span>
            ) : (
              <span className="text-[#444444]">OPPONENT_CALCULATING...</span>
            )}
          </div>

          {/* Board — square container constrained by available height */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden">
            {gameState ? (
              <div className="relative" style={{ height: '100%', aspectRatio: '1 / 1', maxWidth: '100%' }}>
                <GameBoard
                  gameState={gameState}
                  onLineClick={handleLineClick}
                  isMyTurn={isMyTurn && !isFinished}
                />
                {floatingEmojis.map(fe => (
                  <span
                    key={fe.id}
                    className="animate-emoji-float absolute pointer-events-none"
                    style={{ left: `${fe.x}%`, bottom: '20%' }}
                  >
                    {fe.emoji}
                  </span>
                ))}
              </div>
            ) : (
              <div className="font-label text-[10px] tracking-widest text-[#333333] animate-pulse">
                ESTABLISHING_GRID_CONNECTION...
              </div>
            )}
          </div>

          {/* Emoji panel */}
          <div className="shrink-0">
            <EmojiPanel onSend={handleEmojiSend} />
          </div>
        </div>

        {/* ── Right Panel (opponent + comms) ── */}
        <div className="w-[220px] shrink-0 flex flex-col bg-[#0e0e0e] border-l border-[#1e1e1e]">
          {/* P2 info card */}
          <div className="bg-[#141414] px-5 pt-5 pb-4 shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-5 flex items-center justify-center font-headline text-[9px] font-bold tracking-widest shrink-0"
                style={{ border: `1px solid ${oppAccent}25`, color: oppAccent }}
              >
                {oppRole.toUpperCase()}
              </div>
              {isOppTurnActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: oppAccent }}
                />
              )}
            </div>
            <div className="font-label text-[11px] tracking-widest text-[#555555] truncate">
              {opponentName || 'AWAITING...'}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-headline text-5xl font-black tabular-nums transition-all duration-300"
                style={{
                  color: oppAccent,
                  textShadow: isOppTurnActive ? `0 0 24px ${oppAccent}50` : 'none',
                }}
              >
                {oppScore}
              </span>
              <span className="font-label text-[9px] tracking-widest text-[#333333]">PTS</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#1e1e1e] shrink-0" />

          {/* Comms Panel */}
          <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden min-h-0">
            {/* Voice section */}
            <div className="px-4 py-3 shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label text-[8px] tracking-widest text-[#555555]">VOICE_CHANNEL</span>
                <span className="font-label text-[7px] tracking-widest text-[#c3f400] border border-[#c3f40025] px-1.5 py-0.5">
                  WEBRTC·PENDING
                </span>
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-1.5 h-8 border border-[#1e1e1e] text-[#333333] font-label text-[8px] tracking-widest cursor-not-allowed"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mic_off</span>
                JOIN_VOICE
              </button>
            </div>

            {/* Chat divider */}
            <div className="h-px bg-[#1a1a1a] shrink-0" />

            {/* Chat */}
            <ChatPanel
              onSend={handleChatSend}
              log={chatLog}
              myRole={myRole}
            />
          </div>
        </div>
      </div>

      {/* Opponent disconnected overlay */}
      {opponentDisconnected && (
        <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <h2 className="font-headline text-2xl tracking-tighter">OPPONENT_DISCONNECTED</h2>
            <p className="font-label text-[10px] tracking-widest text-[#555555]">GRID SESSION TERMINATED</p>
            <button
              onClick={() => router.push('/lobby')}
              className="px-8 py-4 bg-[#c3f400] text-black font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(195,244,0,0.2)] transition-all"
            >
              RETURN_TO_LOBBY
            </button>
          </div>
        </div>
      )}

      {/* Game end overlay */}
      {isFinished && !opponentDisconnected && (
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="relative bg-[#111111] border border-[#222222] p-12 max-w-md w-full text-center space-y-8">
            <div className="absolute top-0 left-0 w-8 h-px bg-[#c3f400]" />
            <div className="absolute top-0 left-0 w-px h-8 bg-[#c3f400]" />
            <h2 className="font-headline text-3xl font-bold tracking-tighter">
              {gameState.winner === null
                ? 'DRAW_DETECTED'
                : gameState.winner === playerRole
                  ? 'VICTORY_CONFIRMED'
                  : 'DEFEAT_LOGGED'}
            </h2>
            <div className="font-label text-[10px] tracking-widest text-[#555555]">
              FINAL_SCORE: {p1Score} — {p2Score}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/lobby')}
                className="px-8 py-4 bg-[#c3f400] text-black font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(195,244,0,0.2)] transition-all"
              >
                PLAY_AGAIN
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 border border-[#222222] text-[#555555] font-headline font-bold tracking-widest hover:text-white transition-colors"
              >
                EXIT_GRID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
