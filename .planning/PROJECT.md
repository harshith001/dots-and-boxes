# Dots & Boxes

## What This Is

A production-ready real-time multiplayer web game where players take turns drawing lines between dots on a 5x5 grid, claiming boxes and competing for the highest score. Supports quick matchmaking, private room invites, emoji reactions, predefined chat, a player stats dashboard, and a global leaderboard.

## Core Value

Players can jump into a real-time match instantly — either against a random opponent or an invited friend — and enjoy a smooth, low-latency game experience with polished UI.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 5x5 dot grid with line-drawing game mechanics (box claim, score, turn management)
- [ ] Real-time multiplayer via WebSockets (Socket.io)
- [ ] Quick Match (auto matchmaking) with bot fallback after 5 seconds
- [ ] Invite via link (room-based system)
- [ ] Opponent presence and turn status indicators
- [ ] Smooth animations: line drawing, box fill
- [ ] Live score display at top
- [ ] Emoji reaction panel (😎 😂 😡 🔥 👏) with real-time delivery and floating animation
- [ ] Predefined chat panel (3 messages: "Nice move", "Good game", "That was close")
- [ ] Dashboard screen: total matches, wins/losses, win rate, last 10 matches
- [ ] Leaderboard: top players ranked by wins with username, wins, rank
- [ ] Next.js frontend with Tailwind CSS
- [ ] Node.js backend with Socket.io

### Out of Scope

- Free-form chat — MVP constraint, predefined messages only
- Mobile-first responsive design — desktop-first, mobile is optional
- OAuth / external auth — simple username-based sessions for v1
- Video/audio calls — not relevant to game
- Paid features or subscriptions — not in scope

## Context

- Greenfield project, no existing codebase
- Tech stack locked: Next.js + Tailwind (frontend), Node.js + Socket.io (backend)
- Desktop-first UI, clean and modern aesthetic
- Bot opponent required if matchmaking finds no human within 5 seconds
- Mock backend acceptable for v1 as long as code is structured for real scaling

## Constraints

- **Tech Stack**: Next.js + Tailwind (frontend), Node.js + Socket.io (backend) — locked per spec
- **Performance**: Low latency is critical; interactions must feel instant
- **Scope**: Desktop-first; mobile responsiveness optional
- **Chat**: No free-form input — predefined messages only
- **Matchmaking**: Bot fallback within 5 seconds if no opponent found

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Socket.io over native WebSockets | Better reconnection handling, room management, and broader compatibility | — Pending |
| Next.js for frontend | SSR capability, file-based routing, strong ecosystem | — Pending |
| Simple username sessions (no auth) | Reduces v1 complexity; auth can be added in v2 | — Pending |
| Bot fallback after 5s | Guarantees playability even with low concurrent users | — Pending |
| Predefined chat only | Avoids moderation complexity while keeping social feel | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
