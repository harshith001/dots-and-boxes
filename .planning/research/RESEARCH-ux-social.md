# Research: UX & Social Features

**Focus:** Floating emoji animations, predefined chat, presence indicators, layout

---

## Floating Emoji Animation

Extend `tailwind.config.js` with a custom `floatUp` keyframe:
```js
keyframes: {
  floatUp: {
    '0%':   { transform: 'translateY(0)',     opacity: '1' },
    '100%': { transform: 'translateY(-120px)', opacity: '0' },
  }
},
animation: { 'float-up': 'floatUp 1.8s ease-out forwards' }
```

Mount each burst as a short-lived React component, remove on `animationend`. Randomize `left` offset (e.g. `Math.random() * 60 + 20` percent) so simultaneous reactions don't stack. No Framer Motion needed.

```tsx
function EmojiFloat({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  return (
    <div
      className="absolute animate-float-up text-3xl pointer-events-none z-50"
      style={{ left: `${Math.random() * 60 + 20}%`, bottom: 0 }}
      onAnimationEnd={onDone}
    >
      {emoji}
    </div>
  );
}
```

## Rate Limiting

- **Client-side:** 2.5s cooldown — dim panel (don't hide). Re-enable after timeout.
- **Server-side:** `Map<socketId, number>` storing last-sent timestamp. Silently drop events within 2s window.

```ts
const emojiCooldowns = new Map<string, number>();

socket.on('send_emoji', (emoji) => {
  const last = emojiCooldowns.get(socket.id) ?? 0;
  if (Date.now() - last < 2000) return; // silent drop
  emojiCooldowns.set(socket.id, Date.now());
  socket.to(roomId).emit('receive_emoji', emoji);
});
```

## Predefined Chat

- Fixed button grid (not a text input) — buttons labeled "Nice move", "Good game", "That was close"
- Scrollable message log above with `flex-col-reverse` so newest message appears at bottom
- Per-button cooldown (1.5s) to prevent spam but allow chaining different messages naturally

```tsx
const CHAT_MESSAGES = ['Nice move', 'Good game', 'That was close'];

// Render as buttons, disable individually for 1.5s after click
```

## Presence Indicator

Three states with colored dot: `🟢` connected / `🟡` idle / `🔴` disconnected

- Server emits `opponent_status` on Socket.io `disconnect`/`connect` events
- Idle detection: track last-activity timestamp, no extra socket event needed
- Show "Opponent disconnected" banner if disconnect persists > 10s

## Turn Indicator

- Highlight active player's score card: `ring-2 ring-blue-400 bg-blue-50`
- Dim opponent: `opacity-60`
- Disable board interaction on opponent's turn: `pointer-events-none` on the line-click layer
- "Your turn" / "Opponent's turn" text label above the board

## Layout — 3-Column Grid

```
grid-cols-[240px_1fr_240px]
```

| Left (240px)         | Center (flex-1)   | Right (240px)          |
|---------------------|-------------------|------------------------|
| Your score card     | Game board        | Opponent score card    |
| Chat panel          |                   | Emoji reaction panel   |
| Chat buttons        |                   | Received emoji floats  |

- Emoji bursts float over the board container (absolute positioned, z-50)
- Side panels beat overlays for desktop-first games — always visible
- Board centered with `mx-auto`, fixed pixel size (e.g. 480×480)

## Game End Screen

- Modal over frozen board (`fixed inset-0 bg-black/50 backdrop-blur-sm`), not page navigation
- Keeps board visible behind overlay (player can review)
- Content: Win/Loss/Draw heading, final scores, "Play Again" + "View Dashboard" CTAs
- CSS-only burst animation (scale up + fade): no confetti library needed

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
    <h2 className="text-3xl font-bold">{result === 'win' ? '🏆 You Win!' : '😞 You Lost'}</h2>
    <div className="flex gap-8 justify-center mt-4">
      <Score player="You" score={myScore} />
      <Score player="Opponent" score={theirScore} />
    </div>
    <div className="flex gap-3 mt-6">
      <button onClick={playAgain}>Play Again</button>
      <button onClick={goToDashboard}>Dashboard</button>
    </div>
  </div>
</div>
```

## Key Gotchas

- Clean up emoji float components on unmount (if game ends mid-animation)
- Always remove socket listeners in `useEffect` cleanup to avoid double-firing
- `pointer-events-none` on the board must be toggled atomically with the server's turn state — never derive from local state alone
- Chat message timestamps should come from server to avoid clock skew in log ordering

---

## RESEARCH COMPLETE
