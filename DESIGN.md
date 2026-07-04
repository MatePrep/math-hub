---
name: MatePre
description: Práctica de matemáticas para preuniversitarios peruanos, con el rigor tranquilo de un cuaderno de academia.
colors:
  academia-blue: "oklch(0.34 0.13 265)"
  academia-blue-foreground: "oklch(0.985 0.008 85)"
  notebook-paper: "oklch(0.985 0.008 85)"
  deep-ink: "oklch(0.21 0.04 260)"
  card-white: "oklch(1 0 0)"
  secondary-paper: "oklch(0.94 0.015 85)"
  secondary-ink: "oklch(0.25 0.05 260)"
  muted-paper: "oklch(0.95 0.012 85)"
  muted-ink: "oklch(0.48 0.025 260)"
  amber-highlighter: "oklch(0.78 0.165 70)"
  amber-highlighter-foreground: "oklch(0.21 0.04 260)"
  destructive-red: "oklch(0.58 0.22 27)"
  success-green: "oklch(0.62 0.15 152)"
  border-paper: "oklch(0.9 0.015 85)"
  ring-blue: "oklch(0.34 0.13 265)"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.1rem + 2vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.academia-blue}"
    textColor: "{colors.academia-blue-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary-paper}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.notebook-paper}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.academia-blue}"
    textColor: "{colors.academia-blue-foreground}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
---

# Design System: MatePre

## 1. Overview

**Creative North Star: "El Cuaderno de Estudio" (The Study Notebook)**

MatePre is built to feel like a well-kept academia notebook, not a consumer app fighting for attention. The canvas is paper (Notebook Paper, `oklch(0.985 0.008 85)`), the ink is deep and legible, and the one recurring accent — Ámbar Resaltador — behaves like a highlighter pen: precise, occasional, never a wash of color. Fraunces carries the authority of a printed textbook heading; Inter carries the clarity of a well-typeset problem set. This system explicitly rejects the energetic, badge-covered, confetti-driven register that gamified study apps default to — MatePre has streaks, weekly goals, and a leaderboard, but they read as quiet accountability tools dressed in the same rigorous notebook language as everything else, never as playful mascots or celebratory motion.

Density stays comfortable, never cramped: content is organized in generously-padded cards and clear typographic hierarchy so a student scanning between exercises, a countdown, and a timer never has to squint. Every screen should read as if a demanding but approachable teacher assembled it — exact, unembellished, calm even during a timed exam session.

**Key Characteristics:**
- Paper background, deep ink text, one authoritative blue, one sparing amber highlight.
- Fraunces (serif, display) paired against Inter (sans, body/UI) — a textbook-heading-vs-problem-set contrast, not two similar sans-serifs.
- Flat, whisper-quiet elevation: borders and spacing carry hierarchy, not shadow depth.
- Rounded-but-restrained corners (10px controls, 16px cards) — soft enough to be approachable, not soft enough to feel like a toy.
- No gamified visual flourishes (no confetti, no cartoon badges, no bouncy motion) despite streak/goal/ranking mechanics.

## 2. Colors

The palette is deliberately narrow: one warm-neutral paper surface, one deep authoritative blue, one sparing amber highlight, plus the standard semantic reds/greens every form needs.

### Primary
- **Azul Academia Profundo** (`oklch(0.34 0.13 265)`, ≈ #1E3A8A): the brand's one authoritative color. Carries primary buttons, links, active nav states, focus rings, chart bars, and the logo mark. Read against Notebook Paper or white for foreground text (`academia-blue-foreground`, `oklch(0.985 0.008 85)`).

### Secondary
- **Papel Secundario** (`oklch(0.94 0.015 85)`, secondary-paper): low-emphasis surfaces — secondary buttons, active nav-link backgrounds, subtle section fills. Paired with Secondary Ink (`oklch(0.25 0.05 260)`) for text.

### Neutral
- **Papel de Cuaderno** (`oklch(0.985 0.008 85)`, notebook-paper): the page background. Warm, close to white, never stark.
- **Blanco Tarjeta** (`oklch(1 0 0)`, card-white): card and popover surfaces, one step brighter than the page so cards read as "paper laid on paper."
- **Tinta Profunda** (`oklch(0.21 0.04 260)`, deep-ink): primary text color. High-contrast against paper by design — never diluted to a lighter gray for "elegance."
- **Tinta Apagada** (`oklch(0.48 0.025 260)`, muted-ink): secondary/caption text (timestamps, helper copy, muted stat labels).
- **Borde de Papel** (`oklch(0.9 0.015 85)`, border-paper): the one hairline border color used everywhere — cards, inputs, dividers, table rows.

### Accent
- **Ámbar Resaltador** (`oklch(0.78 0.165 70)`, ≈ #F59E0B): the system's single decorative accent. Marks favorited exercises (filled star), the "slow question" badge, chart highlights, and the logo chip.

### Semantic
- **Rojo de Alerta** (`oklch(0.58 0.22 27)`, destructive-red): errors, incorrect answers, destructive actions.
- **Verde de Acierto** (`oklch(0.62 0.15 152)`, success-green): correct answers, passed status, positive deltas.

### Dark Mode
Dark mode inverts the paper metaphor rather than discarding it: background becomes deep ink-blue (`oklch(0.16 0.02 260)`), cards lift slightly lighter (`oklch(0.22 0.03 260)`), and Azul Academia Profundo brightens to `oklch(0.78 0.13 260)` so it still reads as the dominant color against the dark canvas. Ámbar Resaltador is the one token that does **not** shift between themes (`oklch(0.78 0.165 70)` in both) — the highlighter color stays constant, like real ink under any light.

### Named Rules
**The One Voice Rule.** Ámbar Resaltador appears on badges, active-state accents, and single point-of-emphasis moments only — never as a fill covering more than a small fraction of any screen. It marks emphasis the way a highlighter marks one sentence, not the way paint fills a wall. Azul Academia Profundo is the color allowed to carry real surface area (buttons, active nav, chart bars).

## 3. Typography

**Display Font:** Fraunces (with ui-serif, Georgia, serif fallback)
**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif fallback)

**Character:** A textbook-heading-vs-problem-set pairing: Fraunces' variable optical size gives headings and hero numbers a printed, slightly literary authority, while Inter keeps every control, label, and paragraph clean and fast to scan. The two families are never substituted for each other — Fraunces never appears in body copy, Inter never carries a page heading.

### Hierarchy
- **Display** (700, `clamp(1.5rem, 1.1rem + 2vw, 3rem)`, 1.1 line-height, -0.02em tracking): page-level `<h1>`s and the large score/result numbers (e.g. exam result percentage). Fraunces only.
- **Headline** (700, 1.25rem, 1.2 line-height, -0.02em tracking): section titles inside cards ("Tu panel", "Aciertos por tema", exam titles). Fraunces.
- **Title** (700, 1.125rem): smaller card/list titles (exam card headings, dialog titles). Fraunces, same tracking discipline as Headline.
- **Body** (400, 0.875rem, 1.5 line-height): the default for all UI copy, descriptions, and exercise statements. Inter. Cap prose blocks at ~70ch.
- **Label** (600, 0.75rem, 0.05em tracking, often uppercase): stat-card labels, form labels, badge text. Inter.

### Named Rules
**The No-Serif-in-the-Body Rule.** Fraunces is reserved for headings and hero-scale numbers only. If a font needs to be readable at 14px in a form or a data row, it's Inter — never Fraunces at small sizes, which is designed for display optical sizing and turns mushy below ~18px.

## 4. Elevation

**Papel plano, profundidad silenciosa (Flat paper, quiet depth).** MatePre surfaces sit almost flush with the page. There is no drop-shadow spotlighting, no floating-card skeuomorphism. Hierarchy comes from the hairline Border de Papel and generous internal spacing, not from shadow depth — a card is "raised" only by being a slightly brighter white than the paper behind it, plus the thinnest whisper of a Tailwind default shadow.

### Shadow Vocabulary
- **Susurro** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`, Tailwind `shadow-sm`): inputs, secondary/outline/destructive buttons. Barely perceptible — a hint that the control is interactive, not a spotlight.
- **Base** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`, Tailwind `shadow`): cards and primary buttons. Still subtle; never darkens further on hover (hover state changes background opacity, not shadow depth).

### Named Rules
**The Whisper Shadow Rule.** Shadows never grow to signal "hover" or "active" — background/opacity changes carry that signal instead. A shadow that gets visibly darker or larger on interaction is skeuomorphic noise this system rejects.

## 5. Components

### Buttons
- **Shape:** rounded-md (10px), 36px height by default (`sm`: 32px, `lg`: 40px, `icon`: 36×36px square).
- **Primary:** Azul Academia Profundo fill, Academia Blue Foreground text, Base shadow. Hover dims to 90% opacity — no color swap, no shadow growth.
- **Secondary:** Papel Secundario fill, Secondary Ink text, Susurro shadow.
- **Outline:** Notebook Paper fill, Deep Ink text, Border de Papel stroke, Susurro shadow; hover fills with the neutral accent tint.
- **Ghost:** no fill, no border, no shadow at rest; hover adds the neutral accent tint only.
- **Link:** Azul Academia Profundo text, underline appears on hover only.
- **Destructive:** Rojo de Alerta fill, matching foreground, Susurro shadow.

### Badges (Chips)
- **Style:** rounded-md (10px), `2px 10px` padding, 0.75rem semibold text, four variants (default/secondary/destructive/outline) mirroring the button palette.
- **Use:** difficulty tags, topic tags, university + year tags, status labels ("Lento", "Correcta"). Never filled with Ámbar Resaltador as a background — amber marks emphasis via icon/text color, badges stay on the blue/neutral/semantic palette.

### Cards / Containers
- **Corner Style:** rounded-xl (16px).
- **Background:** Blanco Tarjeta on Notebook Paper.
- **Shadow Strategy:** Base shadow (see Elevation) plus a Border de Papel hairline — the border does most of the definition work, the shadow is secondary.
- **Internal Padding:** 24px (`CardHeader`/`CardContent` at `p-6`), compact variants at 16–20px for dense list-style cards (exercise cards, stat tiles).

### Inputs / Fields
- **Style:** Border de Papel stroke, transparent fill, rounded-md, Susurro shadow, 36px height.
- **Focus:** a single 1px Azul Academia Profundo ring (`focus-visible:ring-1 ring-ring`) — no glow, no border-color shift beyond the ring.
- **Disabled:** 50% opacity, pointer-events removed.

### Navigation
- **Style:** sticky header, translucent Notebook Paper background with backdrop blur, Border de Papel bottom hairline. Nav links are Inter medium-weight text at 80% ink opacity, gaining a Papel Secundario pill background on hover/active — never an underline-only pattern.
- **Mobile:** collapses into a right-side sheet panel with the same link list stacked vertically at larger touch targets.

### Stat Tiles (signature component)
Small dashboard cards (used across the panel: streak, accuracy, weekly-goal progress, countdown) pairing a small icon chip (Azul Academia Profundo at 10% opacity background, full-strength icon) with an uppercase Label above a large Display-weight number. This is the primary way MatePre surfaces progress data — always icon + label + number, never a bare number alone.

### Favorite Star (signature component)
A borderless icon button (outline star, Muted Ink) that fills solid Ámbar Resaltador with no border when active. Appears consistently across exercise cards, exam-taking views, and practice mode — one of the few places amber fills a shape rather than just tinting text, because it's the exception the "highlighter" metaphor is built to allow (marking one thing as special).

## 6. Do's and Don'ts

### Do:
- **Do** keep Azul Academia Profundo (`oklch(0.34 0.13 265)`) as the only color allowed real surface area; every other hue is either neutral or a small accent.
- **Do** use Fraunces exclusively for Display/Headline/Title roles and Inter for everything else — never mix them within the same text role.
- **Do** keep shadows at Susurro/Base strength only; if a shadow is noticeably dark or grows on hover, it's too strong for this system.
- **Do** dress streaks, weekly goals, and the leaderboard in the same notebook visual language as every other screen — quiet stat tiles and badges, not celebratory UI.
- **Do** verify body text contrast against Notebook Paper/Blanco Tarjeta; Tinta Profunda is the default, don't lighten it "for elegance."

### Don't:
- **Don't** introduce a second accent hue; Ámbar Resaltador is the only decorative color and it never exceeds a small fraction of any screen (the One Voice Rule).
- **Don't** add gamified visual flourishes — no confetti, no cartoon badges, no bouncy/elastic motion, no mascot — even though streaks/goals/ranking are inherently game-like mechanics.
- **Don't** use `border-left`/`border-right` accent stripes on cards or list items; use the existing hairline border + badge/icon system instead.
- **Don't** use gradient text or `background-clip: text` for emphasis; emphasis comes from Fraunces weight/size or the amber accent, never a gradient.
- **Don't** darken or enlarge shadows on hover/active states; signal interaction through background opacity or the focus ring instead (the Whisper Shadow Rule).
- **Don't** set Fraunces below ~18px; it's a display face and turns mushy at body sizes (the No-Serif-in-the-Body Rule).
