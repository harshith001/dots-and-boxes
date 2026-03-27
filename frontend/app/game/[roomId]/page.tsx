'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { connectSocket, getSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { EmojiPanel } from '@/components/game/EmojiPanel';
import { ChatPanel } from '@/components/game/ChatPanel';
import type { GameStateEvent, Move, EmojiReaction, EmojiReceivedEvent, ChatReceivedEvent } from '@/types/game';

interface FloatingEmoji {
  id: number;
  emoji: EmojiReaction;
  x: number; // percent 10–80
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
      setLog(prev => [...prev.slice(-20), `[${now}] TURN: ${turn}`]);
    }

    function onOpponentDisconnected() {
      setOpponentDisconnected(true);
      setLog(prev => [...prev, '[WARN] OPPONENT_DISCONNECTED.']);
    }

    function onEmojiReceived(event: EmojiReceivedEvent) {
      const id = ++emojiIdCounter.current;
      const x = Math.floor(Math.random() * 70) + 10; // 10–80%
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

  // Scroll telemetry log to bottom
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

  const isMyTurn = gameState?.currentTurn === playerRole;
  const p1Score = gameState?.scores.p1 ?? 0;
  const p2Score = gameState?.scores.p2 ?? 0;
  const isFinished = gameState?.status === 'finished';

  const myRole = playerRole ?? 'p1';
  const oppRole = myRole === 'p1' ? 'p2' : 'p1';
  const myScore = myRole === 'p1' ? p1Score : p2Score;
  const oppScore = myRole === 'p1' ? p2Score : p1Score;
  const myIsActive = isMyTurn && !isFinished;
  const oppIsActive = !isMyTurn && !isFinished;

  return (
    <div className="min-h-screen bg-background text-primary font-body overflow-hidden">
      {/* TopNav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-variant/20">
        <div className="font-headline text-lg font-bold tracking-tighter uppercase">KINETIC_GRID</div>
        <div className="hidden md:flex items-center gap-8">
          <span className="font-label text-[10px] tracking-widest text-secondary">
            ROOM: <span className="text-primary-fixed">{roomId}</span>
          </span>
          <span className="font-label text-[10px] tracking-widest text-secondary">
            OPERATOR: <span className="text-primary">{myName}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary hover:text-primary-fixed cursor-pointer transition-colors">help</span>
        </div>
      </header>

      {/* SideNav */}
      <aside className="fixed left-0 top-0 h-full hidden lg:flex flex-col items-center py-20 z-40 bg-surface w-20 border-r border-surface-variant/20">
        <div className="mb-12 flex flex-col items-center">
          <div className="font-headline text-white font-black text-xs tracking-tighter">
            {playerRole?.toUpperCase() ?? 'OP'}
          </div>
          <div className="text-primary-fixed text-[8px] font-bold tracking-[0.2em]">
            {isMyTurn ? 'YOUR_TURN' : 'WAITING'}
          </div>
        </div>
        <div className="flex flex-col gap-10">
          {[
            { icon: 'grid_4x4', label: 'GRID', active: true },
            { icon: 'leaderboard', label: 'LB', active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={icon}
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-100 ${
                active
                  ? 'text-primary-fixed border-r-2 border-primary-fixed pr-2'
                  : 'text-surface-container-highest hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-label text-[9px] tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="relative h-screen flex items-center justify-center pt-16 lg:pl-20">
        {/* Left Telemetry Panel */}
        <section className="hidden xl:flex fixed left-24 top-20 bottom-20 w-56 z-30 flex-col">
          <div className="bg-surface/10 backdrop-blur-xl border-l border-t border-outline-variant/20 p-4 h-full flex flex-col">
            <header className="flex justify-between items-center mb-4">
              <h2 className="font-headline text-[10px] tracking-[0.3em] uppercase text-secondary">Telemetry_Feed</h2>
              <span className="w-2 h-2 bg-primary-fixed block" />
            </header>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed text-secondary/60"
            >
              {log.map((entry, i) => (
                <div key={i} className={entry.includes('[SYSTEM]') || entry.includes('[WARN]') ? 'text-primary-fixed' : ''}>
                  {entry}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <div className="flex items-center gap-2 text-[10px] font-headline tracking-widest text-outline">
                <span className="animate-pulse">_</span> LIVE_FEED
              </div>
            </div>
          </div>
        </section>

        {/* 3-column board layout */}
        <div className="flex items-center gap-4 px-4">
          {/* Left PlayerCard — me */}
          <div className="w-44 shrink-0">
            <PlayerCard
              name={myName}
              score={myScore}
              role={myRole}
              isActive={myIsActive}
              isMe={true}
            />
          </div>

          {/* Center — board + turn indicator + social */}
          <div className="flex flex-col items-center gap-4">
            {/* Turn indicator */}
            <div className="font-label text-[10px] tracking-widest uppercase">
              {isFinished ? (
                <span className="text-primary-fixed">GAME_COMPLETE</span>
              ) : isMyTurn ? (
                <span className="text-primary-fixed animate-pulse">YOUR_TURN ▸</span>
              ) : (
                <span className="text-secondary/60">OPPONENT_CALCULATING...</span>
              )}
            </div>

            {/* Game board with floating emojis */}
            {gameState && (
              <div className="relative">
                <GameBoard
                  gameState={gameState}
                  onLineClick={handleLineClick}
                  isMyTurn={isMyTurn && !isFinished}
                />
                {floatingEmojis.map(fe => (
                  <span
                    key={fe.id}
                    className="animate-emoji-float"
                    style={{ left: `${fe.x}%`, bottom: '20%' }}
                  >
                    {fe.emoji}
                  </span>
                ))}
              </div>
            )}

            {!gameState && (
              <div className="font-label text-[10px] tracking-widest text-secondary/40 animate-pulse">
                ESTABLISHING_GRID_CONNECTION...
              </div>
            )}

            {/* Social panels */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <EmojiPanel onSend={handleEmojiSend} />
              <ChatPanel
                onSend={handleChatSend}
                log={chatLog}
                myRole={myRole}
                myName={myName}
              />
            </div>

            {/* Mobile score fallback */}
            <div className="flex md:hidden items-center gap-6 font-headline mt-2">
              <div className="text-center">
                <div className="text-[9px] tracking-widest text-secondary truncate max-w-[80px]">{myName}</div>
                <div className="text-2xl font-bold text-primary">{myScore}</div>
              </div>
              <div className="text-secondary/30">—</div>
              <div className="text-center">
                <div className="text-[9px] tracking-widest text-secondary truncate max-w-[80px]">{opponentName || 'OPPONENT'}</div>
                <div className="text-2xl font-bold text-primary-fixed">{oppScore}</div>
              </div>
            </div>
          </div>

          {/* Right PlayerCard — opponent */}
          <div className="w-44 shrink-0">
            <PlayerCard
              name={opponentName || 'OPPONENT'}
              score={oppScore}
              role={oppRole}
              isActive={oppIsActive}
              isMe={false}
            />
          </div>
        </div>

        {/* Opponent disconnected overlay */}
        {opponentDisconnected && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="font-headline text-2xl tracking-tighter">OPPONENT_DISCONNECTED</h2>
              <p className="font-label text-[10px] tracking-widest text-secondary/60">GRID SESSION TERMINATED</p>
              <button
                onClick={() => router.push('/lobby')}
                className="px-8 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
              >
                RETURN_TO_LOBBY
              </button>
            </div>
          </div>
        )}

        {/* Game end overlay */}
        {isFinished && !opponentDisconnected && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center">
            <div className="relative bg-surface-container border border-outline-variant/20 p-12 max-w-md w-full text-center space-y-8">
              <div className="absolute top-0 left-0 w-8 h-px bg-primary-fixed" />
              <div className="absolute top-0 left-0 w-px h-8 bg-primary-fixed" />
              <h2 className="font-headline text-3xl font-bold tracking-tighter">
                {gameState.winner === null
                  ? 'DRAW_DETECTED'
                  : gameState.winner === playerRole
                    ? 'VICTORY_CONFIRMED'
                    : 'DEFEAT_LOGGED'}
              </h2>
              <div className="font-label text-[10px] tracking-widest text-secondary/60">
                FINAL_SCORE: {p1Score} — {p2Score}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/lobby')}
                  className="px-8 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-widest hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
                >
                  PLAY_AGAIN
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 border border-outline-variant/40 text-secondary font-headline font-bold tracking-widest hover:text-primary transition-colors"
                >
                  EXIT_GRID
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
