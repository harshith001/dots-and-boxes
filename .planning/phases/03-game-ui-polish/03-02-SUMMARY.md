---
phase: "03"
plan: "02"
subsystem: "frontend/game-animations"
tags: [svg, animation, keyframes, line-draw, box-claim]
dependency-graph:
  requires: [03-01]
  provides: [line-draw-animation, box-claim-animation, modal-enter-animation]
  affects: [frontend/app/globals.css, frontend/components/game/GameBoard]
tech-stack:
  added: []
  patterns: [svg-stroke-dashoffset, css-custom-property-animation, useRef-tracking]
key-files:
  created: []
  modified:
    - frontend/app/globals.css
    - frontend/components/game/GameBoard.tsx
decisions:
  - "Replaced old box-claim keyframe (used rotate) with pure scale+opacity spring — cleaner, no rotation artifact"
  - "Used drawnLinesRef / claimedBoxesRef initialized in empty-dep useEffect so existing state at mount never animates"
  - "CSS custom property --line-length passed as inline CSSProperties cast to avoid TS error on unknown CSS var"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-26"
  tasks: 2
  files: 2
---

# Phase 03 Plan 02: SVG Line-Draw and Box-Claim Animations Summary

CSS keyframes for line-draw (stroke-dashoffset), box-claim (spring scale), and modal-enter added; GameBoard detects newly drawn lines and newly claimed boxes using stable refs initialized at mount.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add CSS keyframes and utility classes to globals.css | a9017db | globals.css |
| 2 | Update GameBoard with ref tracking and animation application | a9017db | GameBoard.tsx |

## Implementation Notes

**globals.css changes:**
- `@keyframes line-draw`: `stroke-dashoffset` from `var(--line-length)` to `0`, 200ms — requires `strokeDasharray={lineLength}` and `style={{ '--line-length': lineLength }}` on the SVG line element
- `@keyframes box-claim`: updated to scale 0.6→1.08→1 + opacity 0→1 (250ms cubic-bezier spring) — removed old rotate variant
- `@keyframes modal-enter`: scale 0.95 + translateY(8px) → identity, 300ms
- Added `.animate-line-draw` and `.animate-modal-enter` utility classes

**GameBoard.tsx changes:**
- `drawnLinesRef` initialized from `gameState.hLines`/`gameState.vLines` on mount — prevents re-animation of pre-existing lines
- `claimedBoxesRef` initialized from `gameState.boxes` on mount — prevents re-animation of pre-existing boxes
- `renderLine`: computes `lineLength = Math.hypot(x2-x1, y2-y1)`, detects `isNewlyDrawn`, applies `strokeDasharray`, `animate-line-draw`, and `--line-length` CSS var
- Box render: detects `isNewlyClaimed`, applies `animate-box-claim` + `transformBox: fill-box, transformOrigin: center`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- frontend/app/globals.css — FOUND (line-draw, box-claim updated, modal-enter, utility classes)
- frontend/components/game/GameBoard.tsx — FOUND (drawnLinesRef, claimedBoxesRef, animation logic)
- Commit a9017db — FOUND
