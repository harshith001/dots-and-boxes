'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatReceivedEvent, Player } from '@/types/game';

const MAX_LOG = 30;

interface ChatPanelProps {
  onSend: (message: string) => void;
  log: ChatReceivedEvent[];
  myRole: Player;
}

export function ChatPanel({ onSend, log, myRole }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function handleSend() {
    const msg = input.trim();
    if (!msg) return;
    onSend(msg);
    setInput('');
  }

  const recent = log.slice(-MAX_LOG);

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
        <span className="font-label text-[8px] tracking-widest text-[#555555]">TACTICAL_CHAT</span>
        <div className="flex items-center gap-1 border border-[#c3f40030] bg-[#c3f40010] px-1.5 py-0.5">
          <div className="w-1 h-1 rounded-full bg-[#c3f400]" />
          <span className="font-label text-[7px] tracking-widest text-[#c3f400]">E2E</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 min-h-0">
        {recent.length === 0 ? (
          <div className="font-mono text-[9px] text-[#2a2a2a] py-2">NO_TRANSMISSIONS_YET</div>
        ) : (
          recent.map((entry, i) => {
            const isMe = entry.fromRole === myRole;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-2 py-1.5"
                  style={{ background: isMe ? 'rgba(195,244,0,0.1)' : '#1a1a1a' }}
                >
                  <div
                    className="font-label text-[7px] tracking-widest mb-0.5"
                    style={{ color: isMe ? '#c3f400' : '#555555' }}
                  >
                    {entry.fromName}
                  </div>
                  <div
                    className="font-mono text-[9px] leading-snug break-words"
                    style={{ color: isMe ? 'rgba(195,244,0,0.75)' : '#999999' }}
                  >
                    {entry.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex gap-1.5 shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="SEND_MESSAGE..."
          maxLength={120}
          className="flex-1 h-7 bg-transparent border border-[#1e1e1e] px-2 font-label text-[8px] tracking-widest text-white placeholder:text-[#2a2a2a] focus:outline-none focus:border-[#333333] transition-colors"
        />
        <button
          onClick={handleSend}
          className="w-7 h-7 flex items-center justify-center bg-[#c3f40015] border border-[#c3f40025] hover:bg-[#c3f40025] transition-colors"
        >
          <span className="material-symbols-outlined text-[#c3f400]" style={{ fontSize: '14px' }}>send</span>
        </button>
      </div>
    </div>
  );
}
