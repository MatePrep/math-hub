<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Design Context

This project has `PRODUCT.md` and `DESIGN.md` at the repo root (managed by the `impeccable` skill). Read them before making UI/UX decisions.

- **Register:** product (app UI serving a workflow, not a marketing surface).
- **Users:** Peruvian preuniversitario students prepping for admission exams (UNI, San Marcos, PUCP, UNALM, UNFV).
- **Brand personality:** rigorous, approachable, clear ("El Cuaderno de Estudio" — like a well-kept academia notebook, not a gamified consumer app).
- **Visual system:** notebook-paper background, one authoritative blue (`academia-blue`), one sparing amber highlight, Fraunces (display) + Inter (body), flat/whisper-shadow elevation. See `DESIGN.md` for full tokens and component rules.

Live-mode config lives at `.impeccable/live/config.json` (injects into `src/routes/__root.tsx`).
