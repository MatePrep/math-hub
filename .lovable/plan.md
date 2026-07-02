
## Root cause of the current crash

`public.has_role(uuid, app_role)` has **zero EXECUTE grants** (they were revoked in an earlier turn). Every RLS policy on `exercises`, `topics`, `exams`, `exam_questions`, etc. calls `public.has_role(auth.uid(), 'admin')`, so as soon as the student's "Iniciar examen" flow touches any of those tables Postgres throws `permission denied for function has_role` and the server function crashes. Fix: `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;` (SECURITY DEFINER keeps it safe — it only reads `user_roles`).

## Schema replacement

Rename/replace the exam domain to match the requested model. Keep `exercises` as the underlying question bank (it already stores statement/choices/correct_choice/solution) and rename it conceptually to `questions` via a view alias — no data loss.

New/changed tables:

- `exams` — add `exam_type text check in ('standard','template')` default `'standard'`, `allow_multiple_attempts bool default false`. Keep `max_attempts`, `time_limit_min`, `passing_score`, `status`, `question_order`.
- `exam_template_rules` (new): `id`, `exam_id fk`, `topic_id fk`, `difficulty_filter difficulty_level nullable`, `question_count int check > 0`, `position int`.
- `exam_attempts` (rename of `exam_sessions`): `id`, `exam_id fk nullable` (nullable to keep supporting universidad simulacros), `student_id uuid = auth.uid()`, `status text ('in_progress','submitted','graded')`, `started_at`, `finished_at`, `score`, `total`, `time_limit_min`, `answers jsonb`, `flagged jsonb`.
- `exam_attempt_questions` (new, replaces the `question_ids[]` array on the session): `id`, `attempt_id fk`, `position int`, `points numeric default 1`, `question_id fk exercises(id)`, snapshot columns `statement_md`, `statement_image_path`, `choices jsonb`, `correct_choice int`, `solution_md`, `selected_choice int nullable`, `is_correct bool nullable`.

Migration steps in one SQL migration:

1. `ALTER TABLE exams ADD exam_type`, `allow_multiple_attempts`.
2. `CREATE TABLE exam_template_rules` + GRANTs + RLS (admin manage, authenticated select for their exam start).
3. Rename `exam_sessions` → `exam_attempts`; rename `user_id` → `student_id`. Update indexes/FKs.
4. `CREATE TABLE exam_attempt_questions` + GRANTs + RLS (student can select/update rows where the parent attempt is theirs; admin all).
5. Backfill: for each existing `exam_attempts` row with a `question_ids[]`, insert one `exam_attempt_questions` per id copying snapshot columns from `exercises`. Then drop `question_ids`.
6. Update `attempts.exam_session_id` FK to point at renamed `exam_attempts`.
7. **Grant execute on `has_role` to `authenticated, anon`** (the actual crash fix).
8. Add trigger `enforce_attempt_limit` on `exam_attempts` insert: rejects when the student already has ≥ `max_attempts` graded/submitted attempts and `allow_multiple_attempts=false`.

All new public tables get the standard grant block (`authenticated` CRUD as appropriate, `service_role` ALL).

## Server functions (`src/lib/exams.functions.ts`)

Rewrite `startExamSession` to:

1. Load exam with `exam_type`, `max_attempts`, `allow_multiple_attempts`, `time_limit_min`, `status`.
2. Reject if not `published` → friendly toast.
3. Count prior non-in-progress attempts; if limit reached and `!allow_multiple_attempts`, throw `"Ya alcanzaste el máximo de intentos"` (client shows toast, no crash).
4. Resume in-progress attempt if still within time window.
5. Build the question list:
   - `standard`: read `exam_questions` ordered by `position`.
   - `template`: for each rule, `select id from exercises where topic_id=... and (difficulty=filter or filter is null) and active order by random() limit question_count`. If any rule returns fewer rows than `question_count`, throw `"Este examen no está disponible en este momento (faltan preguntas para el tema X)"` — do NOT crash.
6. Shuffle combined list when `question_order='random'` (always for template).
7. Insert `exam_attempts` row (trigger enforces the limit as backup); then bulk insert `exam_attempt_questions` with snapshot columns from `exercises` (single join query, no N+1).
8. Return `{ attemptId }`.

Rewrite `getExamSession`, `saveExamAnswers`, `submitExamSession`, `getExamResult` to read from `exam_attempt_questions` instead of `question_ids[]` + join to `exercises`. Grading uses the snapshot `correct_choice` so late edits to the bank don't invalidate old attempts.

Add admin server fns: `listTemplateRules`, `upsertTemplateRule`, `deleteTemplateRule`, plus validation (`question_count <= available` at save time — returns actionable error).

## Frontend

- `src/routes/_authenticated/examen.$id.tsx`: rename param usage `sessionId → attemptId`, add `isLoading` state on the Iniciar button (already partially there — extend), wrap `startFn` in try/catch and surface `toast.error(e.message)` for the friendly errors above.
- `src/routes/_authenticated/examen-sesion.$sessionId.tsx` → rename file to `examen-intento.$attemptId.tsx`, read `exam_attempt_questions` rows directly.
- `src/routes/_authenticated/examen-sesion.$sessionId.resultado.tsx` → same rename + read snapshot rows.
- Admin exam builder (`src/routes/_authenticated/admin/examenes.$id.tsx` / `.nuevo.tsx` / `exam-form.tsx`): add `exam_type` toggle. When `template`, hide the question picker and show a rules editor (topic + difficulty + count) using `exam_template_rules` CRUD. Validate available question count client-side too.
- `src/components/exam-form.tsx`: add fields for `exam_type`, `allow_multiple_attempts`.

## Verification

1. Playwright: sign in as student, click Iniciar on a `standard` exam → lands on attempt page with the right questions.
2. Create a `template` exam via admin, then start it as student → questions are randomized from the bank.
3. Set `max_attempts=1`, submit once, click Iniciar again → toast appears, no crash.
4. Break a template rule (count > available) → toast appears, no crash.

## Out of scope

- Not touching the "simulacro por universidad" flow beyond the `exam_sessions → exam_attempts` rename (it will keep working via `exam_id=null`).
- Not adding per-question `points` scoring UI (schema supports it; UI stays simple pass/fail).
