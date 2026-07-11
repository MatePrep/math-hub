## Design Context

This project has `PRODUCT.md` and `DESIGN.md` at the repo root (managed by the `impeccable` skill). Read them before making UI/UX decisions.

- **Register:** brand (primary — the public/marketing site); the authenticated product app runs a distinct, secondary "product" register.
- **Users:** Peruvian preuniversitario students prepping for admission exams (UNI, San Marcos, PUCP, UNALM, UNFV) across every course their exam covers, not just math.
- **Brand personality:** bold and competitive ("modo examen" / "La Hoja de Respuestas") on the public site — real exam stakes, never gamified (no confetti/mascots/badges).
- **Two coexisting visual systems** (see `DESIGN.md` for full tokens and component rules):
  - **Public site** (`.at` scope): dark ink-navy (`at-background`), amber-gold primary (`at-primary`), teal "correct" accent (`at-success`), Bricolage Grotesque (display) + Public Sans (body) + JetBrains Mono (measured figures: timers, scores, ranks).
  - **Authenticated app** (post-signup): warm notebook-paper light theme, one authoritative blue (`app-primary`), one sparing amber highlight (`app-highlighter`), Fraunces (display) + Inter (body), flat/whisper-shadow elevation.
  - The two never mix on the same screen; the signup wall is the boundary.

Live-mode config lives at `.impeccable/live/config.json` (injects into `src/routes/__root.tsx`).
