'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectSocket } from '@/lib/socket';
import { useGameStore, getOrCreatePlayerToken } from '@/store/gameStore';

export default function NewRoomPage() {
  const router = useRouter();
  const setRoomId = useGameStore(s => s.setRoomId);
  const setPlayerRole = useGameStore(s => s.setPlayerRole);

  useEffect(() => {
    const name = sessionStorage.getItem('operatorName');
    if (!name) { router.replace('/'); return; }

    const token = getOrCreatePlayerToken();
    const gridSize = parseInt(sessionStorage.getItem('gridSize') ?? '5');
    const socket = connectSocket();

    socket.emit('room:create', { playerToken: token, playerName: name, gridSize });

    socket.once('room:created', ({ roomId, playerRole }: { roomId: string; playerRole: 'p1' | 'p2' }) => {
      setRoomId(roomId);
      setPlayerRole(playerRole);
      router.push(`/room/${roomId}`);
    });
  }, [router, setRoomId, setPlayerRole]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="font-label text-[10px] uppercase tracking-widest text-secondary/40 animate-pulse">
        GENERATING_SESSION_KEY...
      </span>
    </div>
  );
}
