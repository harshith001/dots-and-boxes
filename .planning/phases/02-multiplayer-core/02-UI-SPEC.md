# UI Spec: Phase 2 — KINETIC_GRID Design System

**Source**: Stitch project 14285055703179592596 (4 screens)
**Identity**: KINETIC_GRID — Cyber-Noir Tactical Dots & Boxes
**Status**: Design reference locked 2026-03-26

---

## Design Token System

### Colors (Tailwind config extension)

```js
colors: {
  "surface":                "#131313",   // page background
  "surface-container-lowest": "#0e0e0e", // deepest backgrounds
  "surface-container-low":  "#1c1b1b",   // cards/panels (dark)
  "surface-container":      "#201f1f",   // panels
  "surface-container-high": "#2a2a2a",   // elevated cards
  "surface-container-highest": "#353534",// highest elevation
  "surface-variant":        "#353534",   // borders/dividers
  "outline-variant":        "#444933",   // subtle borders
  "outline":                "#8e9379",   // muted borders
  "primary":                "#ffffff",   // primary text
  "secondary":              "#c6c6c7",   // secondary text
  "on-surface":             "#e5e2e1",
  "on-surface-variant":     "#c4c9ac",
  "primary-fixed":          "#c3f400",   // ELECTRIC LIME — main accent (Player 2)
  "primary-fixed-dim":      "#abd600",   // dimmed lime
  "on-primary-fixed":       "#161e00",   // dark text on lime
  "on-primary":             "#283500",
  "background":             "#131313",
}
```

**Key**: `#CCFF00` / `#c3f400` = Electric Lime — used for: active player accent, CTAs, highlights, Player 2 color.
White (`#ffffff`) = Player 1 color, primary text.

### Typography

```js
fontFamily: {
  "headline": ["Space Grotesk"],   // titles, labels, buttons — ALL CAPS + tracking-widest
  "body":     ["Inter"],           // body text, subtle info
  "label":    ["Space Grotesk"],   // metadata labels
}
```

Google Fonts CDN URLs:
- `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap`
- Material Symbols Outlined: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap`

### Border Radius

All components use `borderRadius: "0px"` — sharp corners everywhere (no rounded corners).
Only `full` (9999px) is retained for pill shapes (status dots, ping animations).

### Spacing & Layout

- Top nav: `h-14`, `fixed top-0 w-full z-50`
- Sidebar: `w-20`, `fixed left-0 top-14`, `lg:flex hidden`
- Main content offset: `pt-14 pl-20` (on large screens)
- Max content width: `max-w-xl` for modals/forms

---

## Global Design Patterns

### Terminal Label Pattern

Small metadata labels use:
```
font-label text-[10px] uppercase tracking-[0.2em] text-secondary/60
```

Examples: `SYSTEM_STATUS: OPERATIONAL`, `LATENCY: 12ms`, `AUTH_SEQUENCE_PENDING`

### Section Header Pattern

```
font-headline text-[10px] tracking-[0.3em] uppercase text-secondary
```

### Panel Container Pattern

```
bg-surface-container-high/40 backdrop-blur-xl border border-outline-variant/10 p-10
```
No border-radius. Subtle glass-effect backgrounds.

### Corner Accent Pattern (Invite Screen)

Top-left corner decoration using absolute positioned elements:
```
absolute top-0 left-0 w-8 h-px bg-primary-fixed  (horizontal)
absolute top-0 left-0 w-px h-8 bg-primary-fixed  (vertical)
```

### Input Pattern

```
bg-transparent border-0 border-b border-outline-variant/30 py-4
font-headline text-xl text-primary placeholder:text-surface-variant
focus:ring-0 focus:border-primary-fixed
```

### CTA Button Pattern

Primary action:
```
w-full h-16 bg-primary-fixed text-on-primary-fixed
font-headline font-bold uppercase tracking-widest
hover:shadow-[0_0_20px_rgba(204,255,0,0.2)]
active:scale-[0.98]
```

### Status Dot (Ping) Pattern

```html
<div class="relative flex h-2 w-2">
  <span class="animate-ping absolute h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-fixed"></span>
</div>
```

---

## Screen Specifications

### Screen 1: Setup Screen (Home Page — `/`)

**Purpose**: Player enters operator name + game starts
**File**: `frontend/app/page.tsx`

**Layout**: Full screen centered modal, `max-w-xl`, dot-grid background

**Structure**:
```
[TopNav] MONOCHROME_KINETIC_V1.0 | SYSTEM_STATUS: OPERATIONAL
[Body - centered panel]
  Terminal header decoration (3 small dots)
  AUTH_SEQUENCE_PENDING label
  [Panel]
    Title: INITIALIZE_OPERATOR (Space Grotesk, 3xl, bold, tracking-tighter)
    Subtitle: ESTABLISHING ENCRYPTED CONNECTION TO GRID_SERVER_01
    ---
    Label: INITIALIZING_OPERATOR_NAME
    Input: ENTER_ID (underline style, lime focus border)
    Cursor blink indicator (lime)
    ---
    [CTA] DEPLOY_INITIAL_SEQUENCE button (lime bg, dark text, h-16)
    Status row: pinging dot + SYNCING_ASSETS | VER_1.0.42_STABLE
  [/Panel]
  Footer: warning text + version
```

**Behavior**:
- Enter name → "DEPLOY" button enabled
- On submit → navigate to `/room/lobby` (matchmaking selection)

**Note**: Grid size selector from Stitch design is deferred to v2 (GAME-07). The app defaults to 5×5 dot grid (TACTICAL_FAST). The selector UI shell can remain as a placeholder.

---

### Screen 2: Invite Screen (`/room/[roomId]`)

**Purpose**: Show invite link; wait for opponent
**File**: `frontend/app/room/[roomId]/page.tsx`

**Layout**: Full screen centered modal, `max-w-xl`, dot-grid background with kinetic-glow

**Structure**:
```
[TopNav] minimal (same as Setup Screen)
[SideNav] GRID + LEADERBOARD icons (inactive)
[Centered panel with corner accents]
  Title: GENERATE_SESSION_KEY (headline, 3xl-4xl, bold, tracking-tighter)
  Divider with PROTOCOL_ALPHA_09 label
  ---
  Label: SESSION_URL
  Input (readonly): full invite URL
  [COPY_TO_CLIPBOARD] button (white bg, dark text)
  ---
  Status row:
    Ping dot (lime, animating) | AWAITING_OPPONENT...
    LATENCY: 12ms
  ---
  Footer metadata: GRID_SCALE | SECURITY | REGION
  Corner accents (lime)
  [CANCEL_AND_RETURN] back button
```

**Behavior**:
- Page created when host creates private room
- URL contains roomId
- Socket listens for `opponent:joined` → navigate to `/game/[roomId]`
- Copy button writes URL to clipboard

---

### Screen 3: Game Screen (`/game/[roomId]`)

**Purpose**: Active multiplayer game
**File**: `frontend/app/game/[roomId]/page.tsx`

**Layout**: Full screen with sidebar + left telemetry panel + centered board

**Structure**:
```
[TopNav] KINETIC_GRID | nav links | help + volume icons
[SideNav - 80px]
  OP_01 / ELITE (player identifier)
  Icons: GRID (active) | LB | TAC | SET
[Left Telemetry Panel - fixed left-24, w-64]
  "Telemetry_Feed" header + lime square indicator
  Scrollable move log (monospace, [timestamp] move descriptions)
  Command input at bottom
[Centered Game Board]
  Dot grid (radial-gradient dots on dark bg)
  Lines: white (P1) or lime (#CCFF00) (P2)
  Captured boxes: P1 = white/10 bg + white border, P2 = lime/10 bg + lime border
  Grid coordinate labels (A-L columns, 01-12 rows) — decorative
[Right Panel - implied, per roadmap Phase 3]
  Player cards (scores, turn status)
```

**Key design details**:
- Board uses dot-grid CSS background (radial-gradient white dots, 48px spacing)
- Drawn lines: 1px height/width colored divs (not SVG — or adapt existing SVG to match)
- Claimed boxes: absolute positioned divs with color tint
- Active player's lines: lime glow `shadow-[0_0_8px_rgba(204,255,0,0.4)]`
- Cursor: `cursor: crosshair` on board

**Note**: The current GameBoard uses SVG. The cyber-noir design uses div-based absolute positioning. Phase 2 implements the game screen shell using the new theme; full layout polish (Phase 3) will refine animations and the 3-column layout.

---

## Design System Implementation Notes

1. **Fonts**: Add Google Fonts `<link>` tags to `layout.tsx` `<head>`. Also configure `next/font/google` for Space Grotesk (or use CDN directly since Material Symbols also needs CDN).

2. **Tailwind config**: Add all color tokens to `tailwind.config.ts` under `extend.colors`. Set `borderRadius: { DEFAULT: '0px', lg: '0px', xl: '0px', full: '9999px' }`.

3. **globals.css**: Add `.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24; }` and `.dot-grid` background utility.

4. **Dark mode**: All screens use `dark` class on `<html>`. Ensure layout sets this.

5. **Font naming**: `font-headline` = Space Grotesk, `font-body` = Inter, `font-label` = Space Grotesk.
