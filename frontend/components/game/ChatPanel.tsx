'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatReceivedEvent } from '@/types/game';
import type { Player } from '@/types/game';

const MESSAGES = ['Nice move', 'Good game', 'That was close'] as const;
const BUTTON_COOLDOWN_MS = 1500;
const MAX_LOG = 6;

interface ChatPanelProps {
  onSend: (message: string) => void;
  log: ChatReceivedEvent[];
  myRole: Player;
  myName: string;
}

export function ChatPanel({ onSend, log, myRole, myName }: ChatPanelProps) {
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function handleClick(message: string) {
    if (Date.now() < (cooldowns[message] ?? 0)) return;
    onSend(message);
    setCooldowns(prev => ({ ...prev, [message]: Date.now() + BUTTON_COOLDOWN_MS }));
  }

  const recent = log.slice(-MAX_LOG);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Chat log */}
      <div
        ref={logRef}
        className="h-20 overflow-y-auto space-y-1 font-mono text-[10px] leading-relaxed border border-surface-variant/20 bg-surface-container-lowest p-2"
      >
        {recent.length === 0 && (
          <div className="text-secondary/30">NO_TRANSMISSIONS_YET</div>
        )}
        {recent.map((entry, i) => (
          <div key={i} className={entry.fromRole === myRole ? 'text-primary-fixed' : 'text-secondary/70'}>
            <span className="text-secondary/40">[{entry.fromName}]</span> {entry.message}
          </div>
        ))}
      </div>

      {/* Message buttons */}
      <div className="flex flex-wrap gap-1.5">
        {MESSAGES.map((msg) => {
          const onCooldown = Date.now() < (cooldowns[msg] ?? 0);
          return (
            <button
              key={msg}
              onClick={() => handleClick(msg)}
              disabled={onCooldown}
              className={`font-label text-[9px] tracking-widest uppercase px-2 py-1 border transition-all duration-100
                ${onCooldown
                  ? 'opacity-30 border-surface-variant/20 text-secondary/30 cursor-not-allowed'
                  : 'border-surface-variant/40 text-secondary hover:border-primary-fixed/40 hover:text-primary-fixed'
                }`}
            >
              {msg}
            </button>
          );
        })}
      </div>
    </div>
  );
}
