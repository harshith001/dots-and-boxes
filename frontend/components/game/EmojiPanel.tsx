'use client';

import { useState } from 'react';
import type { EmojiReaction } from '@/types/game';

const EMOJIS: EmojiReaction[] = ['😎', '😂', '😡', '🔥', '👏'];
const PANEL_COOLDOWN_MS = 2500;

interface EmojiPanelProps {
  onSend: (emoji: EmojiReaction) => void;
}

export function EmojiPanel({ onSend }: EmojiPanelProps) {
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  function handleClick(emoji: EmojiReaction) {
    if (Date.now() < cooldownUntil) return;
    onSend(emoji);
    setCooldownUntil(Date.now() + PANEL_COOLDOWN_MS);
  }

  const onCooldown = Date.now() < cooldownUntil;

  return (
    <div className={`flex items-center gap-2 transition-opacity duration-300 ${onCooldown ? 'opacity-30' : 'opacity-100'}`}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleClick(emoji)}
          disabled={onCooldown}
          className="text-2xl leading-none p-1.5 border border-surface-variant/30 bg-surface-container hover:bg-surface-container-high hover:border-primary-fixed/40 transition-all duration-100 disabled:cursor-not-allowed"
          aria-label={`Send ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
