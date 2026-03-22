# AGENT TASK: Using Stitch MCP and Skill — V3 Final: UI Overhaul + Bug Fixes

---

> **PRIME DIRECTIVE — READ BEFORE TOUCHING ANY FILE:**
>
> This document has two work categories:
> - **BUG FIXES (Parts A & B):** Surgical logic corrections only. Touch only the files named.
> - **UI OVERHAUL (Part C):** Complete visual rebuild. ALL existing functionality, state, event handlers, algorithm logic, and store files remain 100% intact. Only JSX structure and CSS change.
>
> The 8 design PNG files in `./stitch/` are the **pixel-level ground truth** for every visual decision. Before writing a single line of CSS for any module, open its PNG from stitch/, extract exact hex colors, pixel measurements, font sizes, border radii, and component shapes, then implement them faithfully.
>
> **Stitch MCP usage:** For each module, call Stitch MCP to read the corresponding PNG design file before coding that module. Do not rely on memory or approximation — read the file, then code.

---

## PART A — BUG FIX: Flow Control ARQ Protocols

The three ARQ simulations run but produce protocol-incorrect behavior. Fix the simulation engines only — do not touch the UI, timeline renderer, or store shape.

### A.1 — Stop-and-Wait: Correct Protocol Behavior

**The single invariant that must hold:** Sender transmits exactly ONE frame, then enters a strict blocking wait. It cannot send frame N+1 under ANY circumstance until ACK N has been received AND verified.

```typescript
// CORRECT state machine — replace current engine:
// State: IDLE → SENDING_F0 → WAITING_ACK0 → (ACK received) → SENDING_F1 → ...
// Sequence numbers alternate strictly: 0, 1, 0, 1, ...

// On FRAME LOSS:
//   - Frame never reaches receiver (receiver does nothing)
//   - Sender timeout fires after (Tt + 2*Tp + margin) time units
//   - Sender retransmits SAME frame with SAME seq number
//   - Timeout and retransmit repeat until ACK received

// On ACK LOSS:
//   - Frame arrives correctly at receiver
//   - Receiver sends ACK N, but ACK is lost in channel
//   - Sender timeout fires (it never saw the ACK)
//   - Sender retransmits same frame (DUPLICATE)
//   - Receiver detects duplicate via seq number mismatch → re-sends ACK, does NOT deliver to upper layer

// CRITICAL BUG TO FIX: Check if sender is sending frame N+1 before ACK N arrives.
// If yes → that is the bug. Enforce: nextFrameAllowed = false until ackReceived = true.

// Efficiency formula (display in UI):
// η = Tt / (Tt + 2 × Tp)   [where Tt = transmission time, Tp = propagation delay]
// At Tt=1, Tp=2: η = 1 / (1 + 4) = 0.20 = 20%
```

### A.2 — Go-Back-N: Correct Protocol Behavior

**The critical invariant:** On ANY error (loss or corruption) at frame N, the receiver **discards all frames after N** (including correctly received N+1, N+2...) and the sender **retransmits ALL frames from N onward** up to the current window end — not just frame N.

```typescript
// CORRECT GBN behavior:
// Window size W: sender may have up to W unACKed frames in flight simultaneously.
// Receiver window = 1: receiver only accepts the NEXT EXPECTED frame in sequence.

// On frame N LOST:
//   Step 1: Receiver receives N+1, N+2... → DISCARDS all (wrong order)
//            For each discarded frame, send NAK or simply do not ACK
//   Step 2: Sender timeout or NAK received
//   Step 3: Sender goes back to N, retransmits [N, N+1, N+2, ..., base+W-1]
//            This is the defining characteristic of GBN — full window retransmit

// CRITICAL BUG TO FIX: If only frame N is being retransmitted on error,
// that is SELECTIVE REPEAT behavior, not GBN. GBN must retransmit the ENTIRE
// outstanding window from the error point.

// ACK type: CUMULATIVE. ACK N means "received everything up to and including N".
// Window slides forward on each cumulative ACK received.

// Efficiency:
// If W ≥ 1 + 2a (where a = Tp/Tt): η = 1.0
// Else: η = W / (1 + 2a)
```

### A.3 — Selective Repeat: Correct Protocol Behavior

**The critical invariant:** On loss of frame N, the receiver **buffers** all correctly received out-of-order frames (N+1, N+2...) and the sender retransmits **only frame N**.

```typescript
// CORRECT SR behavior:
// Sender window = W, Receiver window = W (unlike GBN where receiver window = 1)

// On frame N LOST:
//   Step 1: Receiver receives N+1, N+2... → BUFFERS them (does NOT discard)
//            Sends individual ACK for each buffered frame
//   Step 2: Receiver sends NAK N (or timeout at sender side)
//   Step 3: Sender retransmits ONLY frame N — not the full window
//   Step 4: When frame N arrives, receiver delivers N, N+1, N+2... in sequence
//            (gaps filled, buffer flushed in order)

// CRITICAL BUG TO FIX: If receiver is discarding out-of-order frames,
// copy-pasted from GBN → wrong. SR receiver MUST buffer them.
// If retransmit sends more than just frame N → wrong.

// Sequence number space: must be ≥ 2W to prevent ambiguity.

// Individual ACKs (not cumulative like GBN).

// Efficiency: same formula as GBN theoretically
// η = W / (1 + 2a) when W < 1 + 2a, else η = 1.0
```

### A.4 — Timeline SVG Arrow Geometry (Fix if Wrong)

```typescript
// Correct coordinate mapping for the ladder diagram:
const SENDER_X   = 120;   // px, left column
const RECEIVER_X = svgWidth - 120;  // px, right column
const ROW_H      = 48;    // px per simulation time unit
const TOP_PAD    = 60;    // px
const toY = (t: number) => TOP_PAD + t * ROW_H;

// Data frame arrow (Sender → Receiver):
// x1=SENDER_X,   y1=toY(frame.sentAt)
// x2=RECEIVER_X, y2=toY(frame.sentAt + Tp)

// ACK arrow (Receiver → Sender):
// x1=RECEIVER_X, y1=toY(frame.receivedAt)
// x2=SENDER_X,   y2=toY(frame.receivedAt + Tp)

// Lost frame: draw only to midpoint, place ✗ symbol there:
// midX = (SENDER_X + RECEIVER_X) / 2
// midY = toY(frame.sentAt + Tp / 2)

// Timeout line: horizontal dashed on sender column:
// x1=SENDER_X-20, y1=toY(timeoutAt), x2=SENDER_X+20, y2=toY(timeoutAt)
```

### A.5 — Flow Control Acceptance Criteria
- [ ] Stop-and-Wait: seq alternates 0→1→0→1; sender NEVER sends next frame before ACK arrives
- [ ] Stop-and-Wait: on frame loss → TIMEOUT label appears → RETX same seq → ACK arrives → next frame
- [ ] Go-Back-N: on loss of frame 2 (W=4) → frames 2,3,4,5 ALL retransmitted; receiver discards 3,4 before retransmit
- [ ] Selective Repeat: on loss of frame 2 → ONLY frame 2 retransmitted; frames 3,4 buffered at receiver
- [ ] Selective Repeat: after frame 2 retransmit → frames 2,3,4 delivered in order from buffer
- [ ] All efficiency % values match the formulas above (verify with Tp=2, W=4: GBN η = 4/5 = 80%)

---

## PART B — BUG FIX: Discrete Math Free Explore & Challenge Modes

Both buttons exist but do nothing. Implement the full functionality.

### B.1 — Free Explore Mode (Default Active Mode)

```typescript
// dmgtStore.ts additions — these must be wired to actual DOM events:

// [+ Add Object] button → opens inline form with:
//   Shape picker: ● circle  ■ square  ▲ triangle  ◆ diamond
//   Color picker: Blue | Red | Green | Yellow | Purple
//   Size picker:  S | M | L
//   [ADD] button → dispatches addObject(shape, color, size)
//   Object placed at random (x,y) within sandbox bounds

// [Randomize] button → calls:
function randomizeObjects() {
  const count = 8;
  const shapes = ['circle','square','triangle','diamond'];
  const colors = ['blue','red','green','yellow','purple'];
  const sizes  = ['small','medium','large'];
  const objects = Array.from({length: count}, (_,i) => ({
    id: `obj_${Date.now()}_${i}`,
    shape:  shapes[Math.floor(Math.random() * 4)],
    color:  colors[Math.floor(Math.random() * 5)],
    size:   sizes[Math.floor(Math.random() * 3)],
    x: 80 + Math.random() * (SANDBOX_W - 160),
    y: 80 + Math.random() * (SANDBOX_H - 160),
    evalState: 'neutral' as const
  }));
  set({ objects });
}

// Predicate evaluation must re-run every time objects array changes:
useEffect(() => {
  if (!predicateAST) {
    clearEvalStates(); return;
  }
  const result = evaluatePredicate(predicateAST, objects);
  applyEvalStates(result.witnesses, result.counterExamples);
}, [predicateAST, objects]);

// Object visual states (applied as data-eval attribute on each SVG object):
// data-eval="witness"        → green glow border, scale(1.05)
// data-eval="counterexample" → red glow border, pulse animation
// data-eval="neutral"        → full opacity, no border
// data-eval="unaffected"     → 50% opacity, greyed out

// Objects must be DRAGGABLE within the sandbox (use pointer events or Konva draggable)
```

### B.2 — Challenge Mode (6 Puzzles)

```typescript
// When [Challenge] button is clicked → mode = 'challenge'
// Load first incomplete challenge. Predicate builder is LOCKED (read-only display).
// User manipulates ONLY the objects in the sandbox.

const CHALLENGES = [
  {
    id: 'c1', title: 'Find the Blue Square', difficulty: 'Easy',
    predicateDisplay: '∃x : isBlue(x) ∧ isSquare(x)',
    targetValue: true,
    hint: 'Add at least one object that is both blue AND square.',
  },
  {
    id: 'c2', title: 'All Circles Are Red', difficulty: 'Easy',
    predicateDisplay: '∀x : isCircle(x) → isRed(x)',
    targetValue: true,
    hint: 'Every circle must be red. Or have no circles at all.',
  },
  {
    id: 'c3', title: 'Find the Counterexample', difficulty: 'Easy',
    predicateDisplay: '∀x : isLarge(x)',
    targetValue: false,    // user must make this FALSE
    hint: 'Add any object that is NOT large.',
  },
  {
    id: 'c4', title: 'Blue For Every Green', difficulty: 'Medium',
    predicateDisplay: '∀x : isGreen(x) → ∃y : isBlue(y)',
    targetValue: true,
    hint: 'For every green object you have, at least one blue object must exist.',
  },
  {
    id: 'c5', title: 'Size Hierarchy', difficulty: 'Medium',
    predicateDisplay: '∀x : isSmall(x) → ∃y : isLarge(y)',
    targetValue: true,
    hint: 'Every small object needs a large object to "back it up".',
  },
  {
    id: 'c6', title: 'No Blue Squares', difficulty: 'Hard',
    predicateDisplay: '¬∃x : isBlue(x) ∧ isSquare(x)',
    targetValue: true,
    hint: 'Squares and blue objects can exist — just not together.',
  },
];

// Challenge UI elements that must be functional:
// - Predicate shown in large read-only display box (cannot be edited)
// - "GOAL: Make this TRUE/FALSE" clearly shown
// - Live evaluation result updates as user adds/moves/removes objects
// - [💡 Hint] button reveals hint text
// - [Submit Solution] button: enabled only when evalResult === targetValue
// - On submit: success overlay + [Next Challenge] button
// - [← Free Explore] button exits challenge mode, unlocks predicate builder
// - Challenge progress: "Challenge 2 / 6" with [◀ Prev] [Next ▶] nav
```

### B.3 — Discrete Math Acceptance Criteria
- [ ] [Free Explore] button is active by default, predicate builder is editable
- [ ] [+ Add Object] opens form; clicking ADD places object in sandbox
- [ ] [Randomize] places 8 random objects immediately with varied shapes/colors/sizes
- [ ] Objects are draggable; re-evaluation fires on drag end
- [ ] Predicate changes → objects immediately update their green/red/grey visual states
- [ ] [Challenge] button switches mode; predicate builder becomes read-only
- [ ] All 6 challenges load and evaluate correctly
- [ ] Challenge 1 (∃ blue square) succeeds when blue square object added
- [ ] Challenge 3 (falsify ∀x:isLarge) succeeds when non-large object added
- [ ] Success overlay appears; [Next Challenge] advances correctly
- [ ] [← Free Explore] returns to editable free mode

---

## PART C — COMPLETE UI OVERHAUL

> **RULE:** Every design spec below was extracted pixel-by-pixel from the 8 PNG screenshots the user provided. Implement these specs exactly. Where the design shows a specific color, use that exact color. Where it shows a layout, replicate that layout. Zero deviation without explicit reason.
>
> **ALL FUNCTIONALITY IS PRESERVED.** Only JSX/CSS changes. Algorithm logic, Zustand stores, hooks, and utility functions are untouched.

---

### C.1 — Global Design Tokens

Extract from the designs. These values are visible across all 8 screenshots:

```css
/* tokens.css — exact values from the PNG designs */
:root {
  /* ── Core Backgrounds ─────────────────────────────── */
  --bg-app:         #0A0E1A;   /* Deepest dark, seen on all pages */
  --bg-surface:     #0D1520;   /* Slightly lifted surface */
  --bg-panel:       #111D2E;   /* Panel/sidebar background */
  --bg-card:        #0F1A28;   /* Card interiors */
  --bg-card-hover:  #162234;

  /* ── Grid/Texture Overlay ──────────────────────────── */
  /* The diagonal grid pattern visible on home page and module pages: */
  --grid-line-color: rgba(0, 200, 255, 0.06);
  /* Applied as: */
  /* background-image: linear-gradient(rgba(0,200,255,0.06) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,200,255,0.06) 1px, transparent 1px);
     background-size: 40px 40px; */

  /* ── Primary Accent: Cyan ──────────────────────────── */
  /* Dominant neon color across the app (seen on home portal, pathfinding path, etc.) */
  --cyan:           #00E5FF;
  --cyan-dim:       #00B8CC;
  --cyan-glow:      rgba(0, 229, 255, 0.35);
  --cyan-glow-lg:   rgba(0, 229, 255, 0.15);

  /* ── Secondary Accent: Magenta/Pink ───────────────── */
  /* Seen on home portal ring, OS module, sidebar active indicators */
  --magenta:        #FF00C8;
  --magenta-dim:    #CC00A0;
  --magenta-glow:   rgba(255, 0, 200, 0.35);

  /* ── Module Accent Colors (one per module, exact from PNGs) ── */
  --mod-pathfinding:  #00E5FF;   /* Cyan — pathfinding path glow */
  --mod-pathfinding-end: #FF3366; /* Red endpoint dot */
  --mod-ds-green:     #39FF14;   /* Insertion sort bars */
  --mod-ds-orange:    #FF8C00;   /* Selection sort bars */
  --mod-ds-blue:      #00BFFF;   /* Bubble sort bars */
  --mod-ds-purple:    #CC44FF;   /* Quick sort bars */
  --mod-det:          #00B8FF;   /* Signals waveform blue */
  --mod-det-glow:     rgba(0, 184, 255, 0.4);
  --mod-dmgt-cyan:    #00E5FF;   /* Discrete math object borders */
  --mod-dmgt-amber:   #F59E0B;   /* Discrete math accent */
  --mod-networks-blue:   #00B8FF; /* Sender panel */
  --mod-networks-orange: #FF8C00; /* Channel panel */
  --mod-networks-green:  #00FF88; /* Receiver panel */
  --mod-os-red:       #FF2244;   /* OS deadlock neon red */
  --mod-os-red-glow:  rgba(255, 34, 68, 0.5);

  /* ── Text ──────────────────────────────────────────── */
  --text-primary:   #E8F4FF;
  --text-secondary: #7BA4C4;
  --text-muted:     #3D6080;
  --text-mono:      #A8D8B8;    /* Green mono readout text */

  /* ── Borders ───────────────────────────────────────── */
  --border-default: rgba(0, 180, 255, 0.15);
  --border-panel:   rgba(0, 180, 255, 0.20);
  --border-glow:    rgba(0, 229, 255, 0.40);

  /* ── Typography ────────────────────────────────────── */
  /* Home page hero title: uppercase wide-spaced sans */
  --font-display: 'Orbitron', 'Exo 2', monospace;
  /* Module headers (Data Structures, Signals & Systems — bold italic): */
  --font-heading: 'Rajdhani', 'Exo 2', sans-serif;
  /* Sidebar, labels, mono readouts: */
  --font-mono:    'Courier Prime', 'JetBrains Mono', monospace;
  /* Body: */
  --font-body:    'DM Sans', sans-serif;

  /* ── Spacing ───────────────────────────────────────── */
  --sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 20px;  --sp-6: 24px;  --sp-8: 32px;  --sp-10: 40px;
  --sp-12: 48px; --sp-16: 64px;

  /* ── Radii ─────────────────────────────────────────── */
  --r-sm: 6px;   --r-md: 10px;  --r-lg: 14px;  --r-xl: 20px;

  /* ── Transitions ───────────────────────────────────── */
  --t-fast: 80ms ease;  --t-mid: 180ms ease;  --t-slow: 320ms ease;
}

/* Light mode (preserves functionality, adjusts surfaces) */
:root[data-theme="light"] {
  --bg-app:         #EFF4FA;
  --bg-surface:     #FFFFFF;
  --bg-panel:       #F0F6FF;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #EBF3FF;
  --text-primary:   #0D1A2E;
  --text-secondary: #2D5070;
  --text-muted:     #7090AA;
  --border-default: rgba(0, 100, 200, 0.15);
  --border-panel:   rgba(0, 100, 200, 0.20);
  --grid-line-color: rgba(0, 100, 200, 0.05);
  /* Accents stay bright — they work on light too */
}
```

**Google Fonts — add to index.html:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?
  family=Orbitron:wght@400;500;600;700;900&
  family=Rajdhani:wght@400;500;600;700&
  family=Exo+2:wght@300;400;500;600;700;800&
  family=Courier+Prime:wght@400;700&
  family=JetBrains+Mono:wght@400;500&
  family=DM+Sans:wght@300;400;500;600&
  display=swap" rel="stylesheet">
```

---

### C.2 — Global App Shell & Sidebar

**From Screenshot 1 (Home) and Screenshot 2 (Data Structures):**

The sidebar is ~200px wide, dark (`#0A0F1C`), with:
- Top: "CS Lab" logo with a small icon (grid/circuit motif)
- Nav items: flat list, active item has a bright left border + slightly lighter background
- Bottom: `? Shortcuts` button + theme toggle sun icon

```tsx
/* Sidebar layout */
.app-sidebar {
  width: 200px;
  min-height: 100vh;
  background: #080D18;
  border-right: 1px solid var(--border-panel);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 40;
}

/* Logo area */
.sidebar-logo {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-default);
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.05em;
}
.sidebar-logo-icon {
  width: 26px; height: 26px;
  /* Circuit/grid icon in cyan */
  color: var(--cyan);
}

/* Nav item — from screenshot: flat, full-width */
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--t-fast);
  border-left: 3px solid transparent;
  letter-spacing: 0.02em;
}
.sidebar-nav-item:hover {
  color: var(--text-primary);
  background: rgba(0, 229, 255, 0.06);
}
/* Active state — from screenshots: bright left border, highlighted bg */
.sidebar-nav-item.active {
  color: var(--text-primary);
  background: rgba(0, 229, 255, 0.10);
  border-left-color: var(--cyan);  /* Cyan for most modules */
}
/* Each module's active state uses its own accent: */
.sidebar-nav-item.active[data-module="pathfinding"] { border-left-color: var(--cyan); }
.sidebar-nav-item.active[data-module="datastructures"] { border-left-color: var(--mod-ds-green); }
.sidebar-nav-item.active[data-module="det"] { border-left-color: var(--mod-det); }
.sidebar-nav-item.active[data-module="dmgt"] { border-left-color: var(--magenta); }
.sidebar-nav-item.active[data-module="networks"] { border-left-color: var(--mod-networks-blue); }
.sidebar-nav-item.active[data-module="os"] { border-left-color: var(--mod-os-red); }

/* Sidebar footer — from screenshots: shortcuts + theme toggle at bottom */
.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 10px;
}
.shortcuts-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border-default);
  border-radius: 20px;      /* pill shape from screenshot */
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--t-fast);
}
.shortcuts-btn:hover { border-color: var(--cyan); color: var(--cyan); }

.theme-toggle-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid var(--cyan);     /* Glowing circle from screenshot */
  background: transparent;
  color: var(--cyan);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 12px var(--cyan-glow);
  transition: all var(--t-fast);
}
.theme-toggle-btn:hover { box-shadow: 0 0 20px var(--cyan-glow); }
```

**Module top bar (breadcrumb — from screenshots 3, 4, 5):**
```
CS Lab  /  Discrete Math        [Speed: 8× toggle]  [★ pin]
```
```tsx
.module-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-default);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-muted);
  position: sticky;
  top: 0;
  z-index: 30;
}
.topbar-sep { color: var(--text-muted); }
.topbar-current { color: var(--text-primary); font-weight: 600; }
.topbar-back { color: var(--text-muted); text-decoration: none; }
.topbar-back:hover { color: var(--cyan); }

/* Speed pill — from screenshots 3 and 5: "Speed 8×" in a rounded pill top-right */
.speed-pill {
  margin-left: auto;
  background: rgba(0, 229, 255, 0.10);
  border: 1px solid var(--cyan);
  border-radius: 20px;
  padding: 4px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--cyan);
  cursor: pointer;
}
```

---

### C.3 — Home Page

**From Screenshot 1 — exact layout:**

```
Background: #0A0E1A with diagonal grid lines (cyan, 6% opacity, 40px pitch)
           + subtle diagonal pink lines at 90°offset (magenta, 3% opacity)
           These create the "sci-fi grid floor" visible in the image.

Header: "LEARN CS BY DOING" — Orbitron font, ~52px, #FFFFFF, letter-spacing 0.08em
Subtitle: "Not by memorising. Master concepts through interactive visualizations."
          Courier Prime, ~15px, #7BA4C4, letter-spacing 0.02em

Center: Large rotating portal animation (optional: CSS-only radial rings with rotation)
         "ENTER LAB" text centered in the portal, Orbitron, cyan

Module cards layout:
  Left featured card (large): PATHFINDING PLAYGROUND — ~240×320px
  Right featured card (large): DATA STRUCTURES MEMORY & FLOW — ~240×320px
  Bottom row 4 cards (smaller): Signals, Discrete Math, Networks, OS — ~220×220px each

Card design (from screenshot):
  Border: 1px solid with module accent color (cyan for pathfinding, pink for OS etc.)
  Background: very dark, ~#0A1520 with subtle inner glow at borders
  Corner decorations: small L-shaped corner marks in the accent color (like HUD brackets)
  Title: Orbitron or Exo 2, uppercase, 14-16px, accent color
  Subtitle below title: Courier Prime, ~11px, #7BA4C4
  Illustration: module-specific graphic (maze for pathfinding, linked list boxes for DS, etc.)
  Bottom stat line: "Complexity: O(V+E)" — Courier Prime, 11px, muted color
  Hover: border brightens, outer glow pulses, card lifts slightly
```

```tsx
// App background — the diagonal grid
.home-page {
  min-height: 100vh;
  background-color: #0A0E1A;
  background-image:
    linear-gradient(rgba(0,229,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px),
    linear-gradient(135deg, rgba(255,0,200,0.03) 1px, transparent 1px),
    linear-gradient(45deg, rgba(255,0,200,0.03) 1px, transparent 1px);
  background-size: 40px 40px, 40px 40px, 80px 80px, 80px 80px;
  padding: 40px 40px 40px 240px;   /* left: sidebar offset */
}

/* Hero text */
.home-hero-title {
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 58px);
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.08em;
  text-align: center;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.home-hero-subtitle {
  font-family: var(--font-mono);
  font-size: 14px;
  color: #7BA4C4;
  text-align: center;
  letter-spacing: 0.04em;
  margin-bottom: 48px;
}

/* Cards grid — from screenshot: 2 large + 4 small */
.home-cards-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;  /* large | portal | large */
  grid-template-rows: auto auto;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.home-featured-cards {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;
}
.home-bottom-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

/* Module card */
.module-card {
  background: rgba(10, 20, 35, 0.90);
  border: 1px solid var(--card-accent-color, var(--cyan));
  border-radius: var(--r-lg);
  padding: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 300ms ease;
  text-decoration: none;
  display: block;
}
/* HUD corner brackets */
.module-card::before,
.module-card::after {
  content: '';
  position: absolute;
  width: 12px; height: 12px;
  border-color: var(--card-accent-color, var(--cyan));
  border-style: solid;
}
.module-card::before {
  top: 6px; left: 6px;
  border-width: 2px 0 0 2px;
}
.module-card::after {
  bottom: 6px; right: 6px;
  border-width: 0 2px 2px 0;
}
.module-card:hover {
  border-color: var(--card-accent-color, var(--cyan));
  box-shadow: 0 0 24px var(--card-glow, var(--cyan-glow)),
              inset 0 0 40px rgba(0,0,0,0.3);
  transform: translateY(-3px);
}
.module-card-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--card-accent-color, var(--cyan));
  margin-bottom: 4px;
}
.module-card-stat {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 12px;
  border-top: 1px solid var(--border-default);
  padding-top: 8px;
}
```

**Card accent colors (each module gets its own):**
```
Pathfinding:     --card-accent-color: #00E5FF  (cyan)
Data Structures: --card-accent-color: #39FF14  (neon green → from DS screenshot)
Signals:         --card-accent-color: #00B8FF  (signal blue)
Discrete Math:   --card-accent-color: #FF00C8  (magenta)
Networks:        --card-accent-color: #FF8C00  (orange → channel color from screenshot)
OS:              --card-accent-color: #FF2244  (alert red)
```

---

### C.4 — Module 1: Pathfinding Playground

**From Screenshot 7 — exact layout and specs:**

```
Page title: "Pathfinding Playground" — large, Rajdhani Bold ~48px, white
Subtitle: "Visualize graph traversal algorithms in real-time" — DM Sans, 16px, muted

LEFT PANEL (glassmorphic card, ~220px wide):
  Background: rgba(10, 20, 35, 0.7) + backdrop-filter: blur(12px)
  Border: 1px solid rgba(0,229,255,0.20)
  Border-radius: 12px
  Sections:
    "Draw Tool" header — Courier Prime, 11px uppercase, #7BA4C4
    Radio grid (2 columns):
      ● Wall   ○ Erase
      ○ Erase  ● Start
      ○ Weight ○ End
    (Active radio = filled circle in cyan)

    "Grid size: 10" — Courier Prime, 13px
    Horizontal slider — cyan filled track, glowing thumb

    "A* Heuristic" header — same style
    ○ Manhattan  (active → filled cyan dot)
    ○ Euclidean
    ○ Chebyshev

    [Clear Grid] button — full width, border: 1px solid rgba(255,255,255,0.2),
                          bg: rgba(255,255,255,0.05), Courier Prime 13px

MAIN CANVAS:
  Background: #060D18
  Border: 1px solid rgba(0,229,255,0.15)
  Border-radius: 10px
  Grid lines: cyan at 5% opacity
  Grid cells: dark
  Wall cells: #1A2030 (dark fill, no glow)
  Path line: bright neon pink/red (#FF2244) → the glowing curved line in screenshot
  Start node: small filled cyan circle
  End node: small filled red/pink circle
  Explored cells: per-algorithm tinted fill

BOTTOM PLAYBACK CONTROLS:
  Positioned below canvas, centered
  A pill-shaped dark container: border-radius: 40px, bg: rgba(10,20,35,0.85)
  backdrop-filter: blur(10px), border: 1px solid rgba(0,229,255,0.30)
  Inner box with progress bar: "0:00 ──────────●────── 0:50"
  Control buttons row: |⏮| |⏪| |⏸/▶| |⏩| |⏭|
  Each button: circular, 36px, no border, icon in white/cyan
```

```tsx
// Pathfinding page structure:
<div className="pathfinding-page">
  <PageHeader
    title="Pathfinding Playground"
    subtitle="Visualize graph traversal algorithms in real-time"
  />
  <div className="pathfinding-body">
    <aside className="pathfinding-tools-panel glass-panel">
      <DrawToolSection />
      <GridSizeSection />
      <HeuristicSection />
      <ClearGridButton />
    </aside>
    <div className="pathfinding-canvas-area">
      <AlgorithmTabBar />      {/* BFS / DFS / Dijkstra / A* tabs + Race Mode */}
      <GridRacePanel />         {/* 1 or 4 grid canvases */}
      <PlaybackControls />      {/* pill-shaped media controls */}
    </div>
  </div>
</div>

/* Glass panel style */
.glass-panel {
  background: rgba(10, 18, 30, 0.70);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 229, 255, 0.20);
  border-radius: var(--r-lg);
  padding: var(--sp-5);
}

/* Playback controls pill */
.playback-pill {
  background: rgba(8, 16, 28, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 229, 255, 0.30);
  border-radius: 40px;
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 20px auto 0;
  max-width: 600px;
}
.playback-track {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}
.playback-progress-bar {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}
.playback-progress-fill {
  height: 100%;
  background: var(--cyan);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--cyan-glow);
}
.playback-controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.playback-btn {
  width: 36px; height: 36px;
  border: none; background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--t-fast);
}
.playback-btn:hover { color: var(--cyan); }
.playback-btn.primary {
  width: 44px; height: 44px;
  background: rgba(0, 229, 255, 0.15);
  border: 1px solid var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 12px var(--cyan-glow);
}
```

---

### C.5 — Module 2: Data Structures

**From Screenshot 2 — exact layout and specs:**

```
Page header: "Data Structures" — Rajdhani Bold, ~72px, white, left-aligned inside a
             dark card with rounded top: bg #0D1520, border-radius: 14px,
             padding: 24px 32px
Subtitle: "Sorting visualization race and interactive linked list" — DM Sans, ~15px, muted

4 Algorithm cards side by side (full width, equal columns):
  Card 1 — Insertion Sort:
    Border: 2px solid #39FF14 (neon green)
    Box-shadow: 0 0 20px rgba(57,255,20,0.3)
    Title: "Insertion Sort" — Rajdhani Bold, 22px, #39FF14
    Stats: "Avg: O(n²)" / "Ops: 0" / "Swaps: 0" — Courier Prime, 13px, white
    Bar chart: green bars (#39FF14) on dark bg, filling lower 2/3 of card

  Card 2 — Selection Sort:
    Border: 2px solid #FF8C00 (orange)
    Box-shadow: 0 0 20px rgba(255,140,0,0.3)
    Title: orange, bars orange

  Card 3 — Bubble Sort:
    Border: 2px solid #00BFFF (sky blue)
    Box-shadow: 0 0 20px rgba(0,191,255,0.3)
    Title: sky blue, bars sky blue

  Card 4 — Quick Sort:
    Border: 2px solid #CC44FF (purple)
    Box-shadow: 0 0 20px rgba(204,68,255,0.3)
    Title: purple, bars purple

BOTTOM CONTROLS (centered, below cards):
  Dark pill container: bg rgba(10,18,30,0.9), border: 1px solid rgba(255,255,255,0.15)
  border-radius: 40px, padding: 10px 24px
  Left side: |⏪| |▶| |⏩| control buttons
  Middle: speed slider — filled cyan track
  Right: "Speed: 8x" label + large cyan play button (square-ish, rounded, ~50px)
  The cyan play button is the most prominent element: bg: var(--cyan),
  color: #000, border-radius: 12px, box-shadow: 0 0 16px var(--cyan-glow)
```

```tsx
// Sorting card component:
.sorting-card {
  border: 2px solid var(--algo-color);
  border-radius: var(--r-xl);
  background: rgba(8, 15, 26, 0.90);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 0 20px var(--algo-glow);
  transition: box-shadow var(--t-mid);
}
.sorting-card:hover {
  box-shadow: 0 0 32px var(--algo-glow);
}
.sorting-card-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--algo-color);
  margin-bottom: 4px;
}
.sorting-card-stats {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
}
.sorting-bars-container {
  flex: 1;
  min-height: 180px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--r-md);
  padding: 8px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  overflow: hidden;
}
.sort-bar {
  flex: 1;
  background: var(--algo-color);
  border-radius: 2px 2px 0 0;
  transition: height 0.08s ease;
  opacity: 0.85;
  min-width: 4px;
}
.sort-bar.comparing {
  opacity: 1;
  filter: brightness(1.4);
  box-shadow: 0 0 8px var(--algo-color);
}
.sort-bar.sorted {
  opacity: 1;
  filter: brightness(1.2);
}

/* Bottom controls */
.sorting-controls-pill {
  background: rgba(8, 16, 28, 0.92);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 40px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px auto 0;
  width: fit-content;
}
.play-btn-large {
  width: 52px; height: 44px;
  background: var(--cyan);
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 0 16px var(--cyan-glow);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--t-fast);
}
.play-btn-large:hover { box-shadow: 0 0 28px var(--cyan-glow); transform: scale(1.05); }
```

---

### C.6 — Module 3: Signals & Systems

**From Screenshot 8 — exact layout and specs:**

```
Page title: "Signals & Systems" — Very large, ~80px, Rajdhani or similar WIDE bold font,
            white, upper-left, NOT centered. Bold italic feel.
Breadcrumb: "CS Lab / Signals & Systems" — below title, muted mono

Speed toggle + theme toggle: top-right corner

LEFT PANEL (~300px):
  Header: "Wave Combiner & Frequency Analysis" — 14px, muted
  Sub-header: "Wave Channels (1/8)" — even more muted
  Channel strip for each active channel:
    Top: colored dot (channel color) + "15Hz" frequency label + blue toggle switch (on/off)
    Sliders row 1: "Freq" label left, "5.0 Hz" value right, slider below
    Sliders row 2: "Amp" label, "1.00" value, slider
    Sliders row 3: "Phase" label, "0°" value, slider
    All sliders: same track style (filled left portion in channel color)
  [+ Add Channel] button — full width, dashed border, centered "+" icon + text

MAIN CANVAS (occupies ~78% of width):
  Background: very dark blue-black #050A10
  Tab bar above canvas: [~ Time Domain] [| Frequency Domain] [Square] [Sawtooth] [AM]
  The WAVEFORM: glowing multi-layered cyan/blue sine wave with blur trails
    — Multiple slightly offset copies of the wave rendered with decreasing opacity
    — Glow achieved with: canvas.shadowBlur = 15, canvas.shadowColor = '#00B8FF'
    — Or CSS: filter: drop-shadow(0 0 8px #00B8FF)
    — The wave fills most of the canvas vertically (thick, prominent)
  Background circuit/grid pattern in the canvas: very faint
```

```tsx
/* Signals page layout */
.signals-page {
  display: flex;
  height: 100vh;
  padding-left: 200px;  /* sidebar */
  background: #060A10;
}

.signals-title {
  font-family: 'Rajdhani', 'Exo 2', sans-serif;
  font-size: clamp(48px, 6vw, 88px);
  font-weight: 800;
  color: #FFFFFF;
  line-height: 0.95;
  letter-spacing: -0.01em;
  /* NOT uppercase, normal sentence case as in screenshot */
}

.signals-left-panel {
  width: 300px;
  flex-shrink: 0;
  background: rgba(6, 10, 18, 0.95);
  border-right: 1px solid var(--border-default);
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channel-strip {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--r-md);
  padding: 14px;
}
.channel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.channel-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--channel-color);
  box-shadow: 0 0 6px var(--channel-color);
}
.channel-freq-label {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--channel-color);
  font-weight: 700;
  flex: 1;
}
/* Toggle switch (on/off per channel) */
.channel-toggle {
  width: 40px; height: 22px;
  border-radius: 11px;
  background: #00B8FF;
  position: relative;
  cursor: pointer;
  transition: background var(--t-fast);
}
.channel-toggle.off { background: rgba(255,255,255,0.15); }
.channel-toggle-thumb {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px; right: 2px;
  transition: right var(--t-fast);
}
.channel-toggle.off .channel-toggle-thumb { right: auto; left: 2px; }

.channel-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.channel-slider-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  width: 38px;
  flex-shrink: 0;
}
.channel-slider-value {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  width: 50px;
  text-align: right;
  flex-shrink: 0;
}
.channel-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.15);
  cursor: pointer;
}

/* Add Channel button */
.add-channel-btn {
  width: 100%;
  padding: 14px;
  border: 1px dashed rgba(255,255,255,0.20);
  border-radius: var(--r-md);
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--t-fast);
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.add-channel-btn:hover {
  border-color: var(--cyan);
  color: var(--cyan);
  background: rgba(0,229,255,0.05);
}

/* Domain tab bar */
.domain-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--r-md);
  margin-bottom: 8px;
}
.domain-tab {
  padding: 6px 14px;
  border-radius: var(--r-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--t-fast);
  border: none; background: none;
  display: flex; align-items: center; gap: 6px;
}
.domain-tab.active {
  background: rgba(0, 184, 255, 0.20);
  color: #00B8FF;
  border: 1px solid rgba(0,184,255,0.40);
}

/* Waveform canvas container */
.wave-canvas-container {
  flex: 1;
  position: relative;
  background: #040810;
  border-radius: 0 0 var(--r-lg) var(--r-lg);
  overflow: hidden;
}
.wave-canvas-container canvas {
  width: 100%; height: 100%;
  /* The glow effect is applied in the canvas drawing code */
}
```

---

### C.7 — Module 4: Discrete Math

**From Screenshot 3 — exact layout and specs:**

```
Breadcrumb: "CS Lab / Discrete Math" — top, mono font, muted
Speed pill: top right "Speed 8×"
Pin button: top right ★

Large title: "Discrete Math & Logic" — Exo 2 or similar, ~64px, white bold, left
Subtitle: "Predicate Sandbox" — mono, muted

"⚡ LOGIC FORGE ⚡" — decorative label in cyan/teal, small mono font

TAB BAR: [Predicate Sandbox] [Proof Workbench] [Free Explore] [Challenge]
         Active tab: cyan/teal background pill, white text
         Inactive: transparent, muted text

LEFT PANEL (~420px):
  "Quantifier" header — mono, muted
  Two large buttons: [∀] [∃]
    Each: 52px square, border-radius 8px, dark bg
    Selected: cyan border + bg-tint
    Font: 24px symbol

  "Predicate P(x)" header
  Predicate chip buttons (pill/badge style):
    isBlue | isRed | isGreen | isYellow | isCircle | isSquare | isTriangle | isSmall | isMedium | isLarge
    Each: small pill, bg: rgba(0,229,255,0.10), border: 1px solid rgba(0,229,255,0.25)
    Font: Courier Prime, 11px, cyan
    Layout: flex-wrap

  Expression display: "∃x : issquare(x)" — large centered box
    bg: rgba(0,0,0,0.3), border: 1px solid rgba(0,229,255,0.20)
    Font: Courier Prime, ~20px, white/cyan

  [⚡ Evaluate] button: full width, bg: rgba(57,255,20,0.20), border: 1px solid #39FF14
    font: Courier Prime, green text

  Result box: "✓ TRUE" — green text, Exo 2 bold large
              "2 witnesses, 5 counter-examples" — mono, smaller

  "Evaluation Trace" section — scrollable, mono 11px, green text
    Each line: "3: Testing object obj:1 (Blue square) - true"

SANDBOX (right side, fills remaining width):
  Header: "Logic Sandbox — 7 objects" + [+ Add Object] [Randomize] [Clear] buttons
  Background: dark with a fine dot-grid (cyan dots at very low opacity)
  Objects rendered as SVG shapes on the canvas:
    Each object has a colored border (green = witness, red = counterexample)
    Inside: shape icon (●○▲◆) in the object's color
    Object size indicator label inside (S/M/L)
    Objects arranged in a loose 2-row grid in the design
```

```tsx
/* Discrete Math layout */
.dmgt-page {
  display: flex;
  height: 100vh;
  padding-left: 200px;
  background: #0A0E1A;
  background-image: radial-gradient(circle, rgba(0,229,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Quantifier buttons */
.quantifier-btn {
  width: 52px; height: 52px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 24px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--t-fast);
  display: flex; align-items: center; justify-content: center;
}
.quantifier-btn.active {
  border-color: var(--cyan);
  background: rgba(0,229,255,0.12);
  color: var(--cyan);
  box-shadow: 0 0 12px var(--cyan-glow);
}

/* Predicate chips */
.predicate-chip {
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(0,229,255,0.08);
  border: 1px solid rgba(0,229,255,0.22);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--cyan);
  cursor: pointer;
  transition: all var(--t-fast);
  white-space: nowrap;
}
.predicate-chip:hover, .predicate-chip.active {
  background: rgba(0,229,255,0.20);
  border-color: var(--cyan);
}

/* Expression display */
.expression-display {
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(0,229,255,0.22);
  border-radius: var(--r-md);
  padding: 14px;
  font-family: var(--font-mono);
  font-size: 18px;
  color: var(--text-primary);
  text-align: center;
  min-height: 52px;
  display: flex; align-items: center; justify-content: center;
  margin: 12px 0;
}

/* Evaluate button */
.evaluate-btn {
  width: 100%;
  padding: 12px;
  background: rgba(57, 255, 20, 0.15);
  border: 1px solid #39FF14;
  border-radius: var(--r-md);
  color: #39FF14;
  font-family: var(--font-mono);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--t-fast);
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.evaluate-btn:hover {
  background: rgba(57, 255, 20, 0.25);
  box-shadow: 0 0 16px rgba(57,255,20,0.30);
}

/* Result box */
.result-box {
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(57,255,20,0.30);
  border-radius: var(--r-md);
  padding: 14px;
}
.result-true { font-family: 'Exo 2', sans-serif; font-size: 24px; font-weight: 700; color: #39FF14; }
.result-false { font-family: 'Exo 2', sans-serif; font-size: 24px; font-weight: 700; color: #FF2244; }
.result-detail { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

/* Evaluation trace */
.eval-trace {
  background: rgba(0,0,0,0.3);
  border-radius: var(--r-sm);
  padding: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #A8D8B8;
  max-height: 180px;
  overflow-y: auto;
  line-height: 1.7;
}

/* Sandbox objects */
.sandbox-object {
  cursor: grab;
  user-select: none;
  transition: filter var(--t-fast);
}
.sandbox-object[data-eval="witness"] {
  filter: drop-shadow(0 0 6px #39FF14);
}
.sandbox-object[data-eval="counterexample"] {
  filter: drop-shadow(0 0 6px #FF2244);
  animation: objectPulse 0.5s ease;
}
.sandbox-object-border-witness    { stroke: #39FF14; stroke-width: 2.5; }
.sandbox-object-border-counter    { stroke: #FF2244; stroke-width: 2.5; }
.sandbox-object-border-neutral    { stroke: rgba(255,255,255,0.20); stroke-width: 1.5; }
@keyframes objectPulse {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
```

---

### C.8 — Module 5: Computer Networks

**Two sub-views — Error Detection (Screenshot 4) and Flow Control (Screenshot 5):**

#### Error Detection Sub-view (Screenshot 4):

```
Page title: "Networks — Error Detection" — Exo 2 Bold, ~40px, white, left
Subtitle: "Data Link Layer" — mono, muted

Top bar with logo "CS Lab" + breadcrumb + "Log in" button (top right)

TAB BAR: [Error Detection ●] [Flow Control] — pill tabs
         Then: [Parity] [Checksum] [CRC ●] — sub-tabs
         Then: CRC polynomial dropdown + Bits slider + [Random] [Reset] buttons

THREE PANELS (equal width, side by side):
  SENDER panel:
    Background: rgba(0, 150, 220, 0.10)
    Border: 1px solid rgba(0, 184, 255, 0.40)
    Border-radius: 12px
    Header: "SENDER" — Exo 2 Bold, 20px, #00B8FF
    "Data" label, bit cells in a grid
    "FCS (CRC)" label, FCS bits below

  CHANNEL panel:
    Background: rgba(255, 140, 0, 0.10)
    Border: 2px solid #FF8C00
    Header: "CHANNEL — Click to flip bits" — Exo 2 Bold, 20px, #FF8C00
    Bit cells — same grid, orange border per cell
    "Flipped bits: 0" — mono, muted, bottom

  RECEIVER panel:
    Background: rgba(0, 200, 100, 0.10)
    Border: 1px solid rgba(0, 255, 136, 0.40)
    Header: "RECEIVER" — Exo 2 Bold, 20px, #00FF88
    Received bits grid
    [✓ ACCEPT] or [✗ REJECT] button at bottom
      ACCEPT: bg rgba(0,255,136,0.20), border 1px solid #00FF88, text #00FF88, glow
      REJECT: bg rgba(255,34,68,0.20), border 1px solid #FF2244, text #FF2244, glow

BIT CELLS (from screenshot — prominent square buttons):
  Size: ~52px × 52px each
  Background: rgba(255,255,255,0.08)
  Border: 1px solid panel-accent-color
  Border-radius: 8px
  Font: Exo 2 Bold, 22px, white
  Hover (channel cells): background brightens, cursor: pointer
  On flip: brief scale animation + color flash
```

```tsx
/* Bit cell */
.bit-cell {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.07);
  border: 1px solid var(--panel-border-color);
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: default;
  transition: all var(--t-fast);
  user-select: none;
}
.bit-cell.flippable { cursor: pointer; }
.bit-cell.flippable:hover {
  background: rgba(255, 140, 0, 0.20);
  border-color: #FF8C00;
  transform: scale(1.05);
}
.bit-cell.just-flipped {
  animation: bitFlip 0.3s ease;
  border-color: #FF8C00;
  color: #FF8C00;
}
@keyframes bitFlip {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); background: rgba(255,140,0,0.30); }
  100% { transform: scale(1); }
}

/* Accept/Reject button */
.verdict-btn {
  width: 100%;
  padding: 14px;
  border-radius: var(--r-md);
  font-family: 'Exo 2', sans-serif;
  font-size: 18px;
  font-weight: 700;
  cursor: default;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 12px;
}
.verdict-btn.accept {
  background: rgba(0,255,136,0.15);
  border: 1px solid #00FF88;
  color: #00FF88;
  box-shadow: 0 0 20px rgba(0,255,136,0.25);
}
.verdict-btn.reject {
  background: rgba(255,34,68,0.15);
  border: 1px solid #FF2244;
  color: #FF2244;
  box-shadow: 0 0 20px rgba(255,34,68,0.25);
  animation: rejectShake 0.4s ease;
}
@keyframes rejectShake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}
```

#### Flow Control Sub-view (Screenshot 5):

```
Title: "Networks – Flow Control Redesign" — Exo 2 Bold, ~56px, white bold
Subtitle: "Data Link Layer" — mono, muted
"NETWORK MONITOR" badge + red/green blinking LED dots — top left

PROTOCOL TABS: [Stop And Wait] [Go Back N] [Selective Repeat ●]
               Selected: cyan background, white text, rounded pill
"ERROR PROB:" label + slider (0 to 1) + "0.000" readout box
[Start] [Reset] buttons — top right, pill shaped

SENDER BUFFER bar (full width horizontal):
  "SENDER BUFFER (Window: 4)" — mono label
  Row of numbered boxes: 0 | 1 | 2 | 3 | [4] | 5 | 6 | 7 | 8 | 9 | 10 ...
  Current window highlighted with bright fill
  Active/current frame has extra highlight
  Numbers in Exo 2, 14px

MIDDLE SECTION (the "channel" animation area):
  Dark panel with circuit background
  Diagonal animated lines/packets traveling from sender to receiver
  Lost packet shown as RED colored diagonal (vs. normal cyan)
  Packets rendered as small rectangles with slight tilt (perspective)

RECEIVER BUFFER bar:
  Same style as sender buffer — "RECEIVER BUFFER" label
  Boxes fill in as packets arrive

BOTTOM STATS (3 columns, very large numbers):
  SUCCESS:          RETRANSMISSIONS:     EFFICIENCY:
  250               15                   94.3%
  (Exo 2 or Orbitron, ~64px, SUCCESS=green, RETRANSMISSIONS=red, EFFICIENCY=cyan)
```

```tsx
/* Protocol tab bar */
.protocol-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 30px;
  padding: 4px;
  width: fit-content;
}
.protocol-tab {
  padding: 8px 20px;
  border-radius: 26px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--t-fast);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.protocol-tab.active {
  background: var(--cyan);
  color: #000;
  font-weight: 700;
}

/* Buffer row */
.buffer-row {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  padding: 14px 16px;
  margin: 12px 0;
}
.buffer-row-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
}
.buffer-cells {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
}
.buffer-cell {
  min-width: 36px; height: 36px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all var(--t-fast);
}
.buffer-cell.in-window {
  background: rgba(0,229,255,0.15);
  border-color: var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 8px var(--cyan-glow);
}
.buffer-cell.current {
  background: rgba(0,229,255,0.30);
  transform: scale(1.08);
  box-shadow: 0 0 14px var(--cyan-glow);
}
.buffer-cell.received { background: rgba(0,255,136,0.15); border-color: #00FF88; color: #00FF88; }
.buffer-cell.lost     { background: rgba(255,34,68,0.15);  border-color: #FF2244; color: #FF2244; }

/* Stats row */
.flow-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px;
  text-align: center;
}
.flow-stat-label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.flow-stat-value {
  font-family: 'Orbitron', monospace;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 700;
  line-height: 1;
}
.stat-success      { color: #39FF14; text-shadow: 0 0 20px rgba(57,255,20,0.5); }
.stat-retransmit   { color: #FF2244; text-shadow: 0 0 20px rgba(255,34,68,0.5); }
.stat-efficiency   { color: var(--cyan); text-shadow: 0 0 20px var(--cyan-glow); }
```

---

### C.9 — Module 6: Operating Systems & Deadlock

**From Screenshot 6 — exact layout and specs:**

```
BACKGROUND: Pure black (#000000) — unique among all modules
            This is intentional — the neon red glows need a pure black background

Page title: "OS - Deadlock Detection" — Exo 2 Bold, 36px, #FF2244 (red/pink)
Subtitle: "Resource Allocation Graph" — mono, muted

TOP BUTTON ROW (right-aligned):
  [+ Process] [+ Resource] [Clear All] [Classic Deadlock] [Safe State]
  Each: border: 1px solid #FF2244, border-radius: 6px, bg transparent,
        color: #FF2244, font: mono, hover: bg rgba(255,34,68,0.15)

LEFT PANEL (~440px):
  "Selected: P1"
  "Type: Process"
  "Instances: 1"
  → These are in a dark bordered box, mono font

  If deadlock: "DEADLOCK DETECTED:" — large, red, bold
               "Cycle: P1 -> R1 -> P2 -> R2 -> P1" — mono, smaller
               → Box has red border + red background tint

  "Coffman Conditions:" section:
    ✓ Mutual Exclusion
    ✓ Uncleantated [sic — show "Unclaimable"]
    ✓ Hold & Wait
    ✓ No Preemption
    ✓ Circular Wait
    → All checkmarks in #FF2244

  Stats boxes:
    Success / Retransmissions / Efficiency / Speed
    → Horizontal bars, red-tinted

CANVAS (right ~66% of width):
  [✏ Draw] [↖ Select] tabs | [P-R Request] [R-P Assign] edge type buttons
  Background: very dark (#050505)
  Nodes:
    Process (P1, P2): circles, ~72px diameter
      Border: 2px solid #FF2244, box-shadow: 0 0 20px rgba(255,34,68,0.6)
      Background: rgba(20,0,0,0.9)
      Label: Exo 2 Bold, 18px, white
    Resource (R1, R2, R3): squares, ~72px
      Border: 2px solid #FF2244, box-shadow: 0 0 20px rgba(255,34,68,0.6)
      Background: rgba(20,0,0,0.9)

  Edges: lines with arrowheads
    DEADLOCK state: ALL nodes and edges glow intense red
    The cycle shown as glowing red circular path connecting P1→R1→P2→R2→P3→R3→P1
    Box-shadow on deadlock cycle edges: 0 0 16px #FF2244
    Animation: slow rotation / pulsing on the cycle highlight
```

```tsx
/* OS page */
.os-page {
  background: #030303;   /* Near-pure black — critical for the neon effect */
  min-height: 100vh;
  padding-left: 200px;
}

/* OS title */
.os-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 36px;
  font-weight: 800;
  color: #FF2244;
  text-shadow: 0 0 20px rgba(255,34,68,0.5);
}

/* Action buttons */
.os-action-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255,34,68,0.6);
  border-radius: 6px;
  background: transparent;
  color: #FF2244;
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--t-fast);
  letter-spacing: 0.02em;
}
.os-action-btn:hover {
  background: rgba(255,34,68,0.12);
  border-color: #FF2244;
  box-shadow: 0 0 10px rgba(255,34,68,0.30);
}

/* Process node in Konva/SVG */
/* Apply these styles to Konva Circle or SVG circle: */
.rag-process-node {
  /* Konva config: */
  /* fill: 'rgba(20,0,0,0.9)'
     stroke: '#FF2244'
     strokeWidth: 2.5
     shadowColor: '#FF2244'
     shadowBlur: 20
     shadowOpacity: 0.8
     radius: 36 */
}
/* In deadlock (cycle member): increase shadowBlur to 40, add pulsing animation */

/* Resource node */
.rag-resource-node {
  /* Konva config: */
  /* fill: 'rgba(20,0,0,0.9)'
     stroke: '#FF2244'
     strokeWidth: 2.5
     shadowColor: '#FF2244'
     shadowBlur: 20
     shadowOpacity: 0.8
     width: 72, height: 72 */
}

/* Edge (Konva Arrow) */
/* Normal: stroke: '#FF4466', strokeWidth: 1.5 */
/* Deadlock cycle: stroke: '#FF2244', strokeWidth: 2.5, shadowColor: '#FF2244', shadowBlur: 15 */

/* Deadlock detected panel */
.deadlock-alert {
  background: rgba(255, 34, 68, 0.10);
  border: 1px solid #FF2244;
  border-radius: var(--r-md);
  padding: 14px;
  margin: 12px 0;
}
.deadlock-alert-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #FF2244;
  text-shadow: 0 0 10px rgba(255,34,68,0.5);
  margin-bottom: 6px;
}
.deadlock-cycle-path {
  font-family: var(--font-mono);
  font-size: 13px;
  color: #FF6680;
}

/* Coffman conditions */
.coffman-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.coffman-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
}
.coffman-check { color: #FF2244; font-size: 14px; }

/* Canvas mode buttons */
.rag-mode-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255,255,255,0.04);
  border-radius: var(--r-sm);
}
.rag-mode-tab {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--t-fast);
  display: flex; align-items: center; gap: 6px;
}
.rag-mode-tab.active {
  border-color: #FF2244;
  background: rgba(255,34,68,0.12);
  color: #FF2244;
}

/* Instance dots inside resource nodes */
/* Rendered as small circles in the Konva layer */
/* Filled dot = assigned instance, hollow = available */
```

---

### C.10 — Shared UI Components

#### StepController (Universal Playback)

The playback component appears in multiple styles across the designs:
- Screenshot 7 (Pathfinding): Media-player pill with progress bar
- Screenshot 2 (Sorting): Compact pill with speed slider + large play button

Use the Pathfinding pill style as the default. Apply the Sorting variant specifically in the sorting module.

```tsx
/* Keyboard Shortcuts Overlay — must be functional */
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shortcuts-card {
  background: #0D1520;
  border: 1px solid var(--border-panel);
  border-radius: var(--r-xl);
  padding: 32px;
  max-width: 560px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.shortcuts-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 24px;
  letter-spacing: 0.06em;
}
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-default);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-secondary);
}
.shortcut-keys {
  display: flex;
  gap: 4px;
}
.shortcut-key {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-primary);
}
```

---

## PART D — Implementation Order

Execute in this exact order. Commit after each numbered group.

```
─── GROUP 1: Bug Fixes (Highest Priority) ─────────────────────────────
Step  1: Replace Stop-and-Wait engine with state-machine version (Part A)
Step  2: Replace Go-Back-N engine — fix full-window retransmit on error (Part A)
Step  3: Replace Selective Repeat engine — fix buffer-not-discard behavior (Part A)
Step  4: Fix timeline SVG arrow coordinate math (Part A)
Step  5: Verify efficiency calculations match formulas (Part A)
Step  6: Run acceptance criteria checks for all 3 protocols
         COMMIT: "fix: ARQ flow control protocol correctness"

─── GROUP 2: Discrete Math Functionality ──────────────────────────────
Step  7: Wire [+ Add Object] button to form + addObject() action (Part B)
Step  8: Wire [Randomize] button to randomizeObjects() (Part B)
Step  9: Implement predicate → object evaluation reactive loop (Part B)
Step 10: Implement object drag in sandbox (Part B)
Step 11: Implement [Challenge] button mode switch + challenge loading (Part B)
Step 12: Implement all 6 challenge definitions and success check (Part B)
Step 13: Implement success overlay + [Next Challenge] nav (Part B)
Step 14: Implement [Free Explore] button mode switch (Part B)
         COMMIT: "feat: discrete math free explore and challenge modes"

─── GROUP 3: Design Tokens & Global Shell ──────────────────────────────
Step 15: Load Google Fonts in index.html (Part C.1)
Step 16: Replace tokens.css with exact values from Part C.1
Step 17: Rebuild Sidebar component with specs from Part C.2
Step 18: Rebuild ModuleTopBar with breadcrumb and speed pill
Step 19: Wire theme toggle to actually update data-theme on <html>
Step 20: Wire keyboard shortcuts overlay to the Shortcuts button
         COMMIT: "feat: global design system and shell"

─── GROUP 4: Home Page ─────────────────────────────────────────────────
Step 21: Build HomePage with diagonal grid background (Part C.2)
Step 22: Build ModuleCard with HUD corner brackets and accent colors
Step 23: Implement staggered card entrance animation
Step 24: Implement card hover glow effects
         COMMIT: "feat: home page redesign"

─── GROUP 5: Pathfinding Module ────────────────────────────────────────
Step 25: Apply glassmorphic tool panel (Part C.3)
Step 26: Build pill-shaped playback controls (Part C.3)
Step 27: Apply grid canvas dark style with cyan gridlines
Step 28: Apply algorithm color channels to explored/path cells
         COMMIT: "feat: pathfinding module UI"

─── GROUP 6: Data Structures Module ────────────────────────────────────
Step 29: Build 4-card sorting layout with per-algo accent colors (Part C.4)
Step 30: Apply glowing neon borders to sorting cards
Step 31: Style sort bars with per-algo colors and glow on compare/swap
Step 32: Build compact bottom controls pill with large cyan play button
         COMMIT: "feat: data structures module UI"

─── GROUP 7: Signals & Systems Module ─────────────────────────────────
Step 33: Apply large bold title (Rajdhani 80px) upper-left (Part C.5)
Step 34: Build left panel with channel strips and toggle switches
Step 35: Apply domain tab bar above canvas
Step 36: Ensure waveform glow rendering (shadowBlur in canvas)
         COMMIT: "feat: signals module UI"

─── GROUP 8: Discrete Math Module ──────────────────────────────────────
Step 37: Apply dot-grid background to DMGT page (Part C.6)
Step 38: Build quantifier buttons (52px, cyan-active style)
Step 39: Build predicate chip pills
Step 40: Build expression display box + Evaluate button
Step 41: Build result box and evaluation trace panel
Step 42: Style sandbox objects with per-eval-state borders and glow
         COMMIT: "feat: discrete math module UI"

─── GROUP 9: Networks Module ───────────────────────────────────────────
Step 43: Build Error Detection 3-panel layout (Part C.7)
Step 44: Style SENDER/CHANNEL/RECEIVER panels with distinct accent colors
Step 45: Build large bit cell components (52px with neon borders)
Step 46: Build ACCEPT/REJECT verdict button with glow
Step 47: Build Flow Control protocol tab bar (Part C.7)
Step 48: Build buffer row visualization (numbered cells)
Step 49: Build stats row with large neon numbers (Orbitron 64px)
         COMMIT: "feat: networks module UI"

─── GROUP 10: OS Module ────────────────────────────────────────────────
Step 50: Set OS page background to near-pure black #030303 (Part C.8)
Step 51: Apply red (#FF2244) as module accent throughout
Step 52: Style RAG canvas nodes (Konva: red stroke, red glow shadow)
Step 53: Style deadlock alert panel with red border + glow
Step 54: Style Coffman conditions checklist
Step 55: Build Draw/Select mode tabs in OS canvas header
         COMMIT: "feat: OS module UI"

─── GROUP 11: Final Regression ──────────────────────────────────────────
Step 56: Navigate every module — verify layout, fonts, colors correct
Step 57: Toggle dark/light mode on every module — verify both work
Step 58: Run ARQ protocols — verify Stop-and-Wait, GBN, SR all correct
Step 59: Run pathfinding — verify walls and weights respected by all 4 algos
Step 60: Run sorting — verify all algorithm bars animate correctly
Step 61: Discrete Math — add object, evaluate predicate, run challenge
Step 62: Networks — flip bits in CRC mode, verify ACCEPT/REJECT
Step 63: OS — build deadlock cycle, verify red flash and cycle label
Step 64: Keyboard shortcuts — test ?, Space, →, ←, R, 1-6, H
Step 65: Accessibility — tab through each module with no mouse
         COMMIT: "v1.3.0: UI overhaul complete"
```

---

## PART E — Final Acceptance Checklist

### Visual Fidelity (must match screenshots)
- [ ] Home page has diagonal cyan+magenta grid background, exactly matching screenshot 1
- [ ] Module cards have HUD corner bracket decorations (L-shapes at corners)
- [ ] Pathfinding uses glassmorphic left panel + pill playback controls (screenshot 7)
- [ ] Data Structures has 4 glow-bordered algorithm cards with colored bars (screenshot 2)
- [ ] Signals uses large Rajdhani title + oscilloscope-style glowing waveform (screenshot 8)
- [ ] Discrete Math has quantifier buttons, predicate chips, evaluation trace panel (screenshot 3)
- [ ] Networks Error Detection has 3-panel layout with 52px bit cells (screenshot 4)
- [ ] Networks Flow Control has buffer rows + large neon stats (screenshot 5)
- [ ] OS page has pure black background + all-red neon nodes and deadlock glow (screenshot 6)
- [ ] Sidebar matches design: ~200px, module icons, active left border in module accent color

### Fonts
- [ ] Home hero: Orbitron, uppercase, wide letter-spacing
- [ ] Module titles: Rajdhani or Exo 2, bold, large
- [ ] Labels and mono readouts: Courier Prime / JetBrains Mono
- [ ] Stats (flow control big numbers): Orbitron

### Bug Fixes
- [ ] Stop-and-Wait never sends frame N+1 before ACK N arrives
- [ ] Go-Back-N retransmits full window (not just error frame) on error
- [ ] Selective Repeat buffers out-of-order frames (not discards)
- [ ] Free Explore objects respond to added objects in real time
- [ ] Challenge mode loads puzzle predicate read-only; success overlay fires on correct solution

### Functionality Preservation
- [ ] All 4 pathfinding algorithms still work with walls and weights
- [ ] Sorting race still runs all selected algorithms simultaneously
- [ ] Linked list insert/delete/reverse animations still work
- [ ] Wave combiner still renders composite waveform at 60fps
- [ ] CRC division visualization still works and updates on bit flip
- [ ] Deadlock detection (single-instance DFS + multi-instance Banker's) still correct
- [ ] Step player (play/pause/step/reset) works in every module
- [ ] Keyboard shortcuts all function (?, Space, →, ←, R, 1-6, H, Ctrl+Shift+D)
- [ ] Theme toggle (dark/light) works and persists across navigation

---

*End of V3 Final Prompt — CS Lab EdTech Platform*
*Version Target: v1.3.0 | Commit Groups: 11 | Steps: 65*
*Design Source: 8 PNG files in ./stitch/ (home, pathfinding, data-structures, signals, discrete-math, networks-error, networks-flow, os-deadlock)*
