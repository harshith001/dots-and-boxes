---
phase: 1
slug: foundation-game-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.1 + React Testing Library 16.3.2 |
| **Config file** | `frontend/vitest.config.ts` — Wave 0 gap (must be created) |
| **Quick run command** | `cd frontend && npx vitest run lib/gameLogic --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run lib/gameLogic --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| GAME-01 | TBD | 0 | GAME-01 | unit | `npx vitest run lib/gameLogic` | ❌ W0 | ⬜ pending |
| GAME-02 | TBD | 0 | GAME-02 | unit | `npx vitest run lib/gameLogic` | ❌ W0 | ⬜ pending |
| GAME-03 | TBD | 0 | GAME-03 | unit | `npx vitest run lib/gameLogic` | ❌ W0 | ⬜ pending |
| GAME-04 | TBD | 0 | GAME-04 | unit | `npx vitest run lib/gameLogic` | ❌ W0 | ⬜ pending |
| GAME-05 | TBD | 0 | GAME-05 | unit | `npx vitest run lib/gameLogic` | ❌ W0 | ⬜ pending |
| GAME-06 | TBD | 1 | GAME-06 | unit (component) | `npx vitest run components/game/GameBoard` | ❌ W0 | ⬜ pending |
| INFRA-01 | TBD | 1 | INFRA-01 | smoke (manual) | `npm run dev:frontend` — observe no crash | manual | ⬜ pending |
| INFRA-02 | TBD | 1 | INFRA-02 | smoke (manual) | `npm run dev:backend` — observe "Server listening" log | manual | ⬜ pending |
| INFRA-05 | TBD | 0 | INFRA-05 | unit | `npx vitest run store/gameStore` | ❌ W0 | ⬜ pending |
| INFRA-06 | TBD | 1 | INFRA-06 | smoke (manual) | `npm run dev` from root — observe both logs | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/vitest.config.ts` — configure jsdom environment, path aliases
- [ ] `frontend/vitest.setup.ts` — import `@testing-library/jest-dom`
- [ ] `frontend/__tests__/lib/gameLogic.test.ts` — stubs for GAME-01 through GAME-05
- [ ] `frontend/__tests__/store/gameStore.test.ts` — stubs for INFRA-05
- [ ] `frontend/__tests__/components/GameBoard.test.tsx` — stubs for GAME-06

**Framework install (Wave 0):**
```bash
cd frontend && npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Next.js dev server starts | INFRA-01 | Process startup can't be unit tested | Run `npm run dev:frontend`, observe no crash in terminal |
| Node.js backend starts | INFRA-02 | Process startup can't be unit tested | Run `npm run dev:backend`, observe "Server listening on port 3001" |
| Root concurrently works | INFRA-06 | Multi-process orchestration | Run `npm run dev` from root, verify both frontend and backend logs appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
