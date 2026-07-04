# Plan: Perfil, Progreso y Social (Fase 1 ampliada)

Ámbito acordado: Perfil enriquecido + filtro por universidad + cuenta regresiva + práctica por tema + favoritas + análisis de tiempo + metas semanales + comparación con media + leaderboard (general por universidad y por examen). Notificaciones: solo bandeja in-app. Un examen pertenece a una sola universidad.

Fuera de alcance en esta fase: recomendaciones inteligentes con pesos por tema (punto 4), notificaciones automáticas por email/push (punto 5 completo), plan de estudio dinámico (punto 3.2).

---

## 1. Cambios de base de datos (una sola migración)

**Perfil enriquecido** — extender `profiles`:
- `pseudonym` text UNIQUE (para leaderboard anónimo)
- `career` text (opcional)
- `leaderboard_opt_in` boolean default true
- `weekly_goal_questions` int default 50
- `weekly_goal_exams` int default 2

**Universidades objetivo del estudiante** (múltiples, con fecha):
- Nueva tabla `student_universities(id, user_id, university_id, exam_date date, created_at)` con unique(user_id, university_id).

**Asociación examen ↔ universidad** (uno):
- Añadir `university_id uuid references universities(id)` a `exams` (nullable para retrocompatibilidad; UI de admin ya permite elegirla).

**Favoritas**:
- Nueva tabla `favorite_exercises(id, user_id, exercise_id, created_at)` unique(user_id, exercise_id).

**Análisis de tiempo**:
- La tabla `attempts` ya tiene `time_spent_ms` → reutilizar. Añadir `expected_time_ms` opcional a `exercises` (para resaltar preguntas "lentas"; si es NULL, se usa el promedio del ejercicio calculado on-the-fly).

**Notificaciones in-app**:
- Nueva tabla `notifications(id, user_id, kind, title, body, read_at, created_at)`.

**Todas** con RLS scoped a `auth.uid()`, GRANTs a `authenticated` + `service_role`, y grants adicionales solo donde el leaderboard necesite lectura pública anónima (ver §7).

---

## 2. Perfil del estudiante (UI)

Ampliar `src/routes/_authenticated/perfil.tsx`:
- Campo pseudónimo (validación de unicidad server-side, feedback amistoso).
- Selector múltiple de universidades con fecha de examen por cada una (agrega/quita filas).
- Carrera (texto libre).
- Toggle "Participar en el ranking".
- Metas semanales (dos inputs numéricos).

Server fns nuevas en `attempts.functions.ts` (o nuevo `profile.functions.ts`): `getFullProfile`, `updateFullProfile`, `setStudentUniversities`.

---

## 3. Contenido filtrado por universidad

- Nuevo selector "Universidad" (dropdown) en `simulacros.index.tsx` y `examenes.index.tsx` (públicos): por defecto muestra las del perfil, con opción "Todas".
- Server fns `listPublishedTemplates` y equivalente estándar aceptan `universityId?` opcional.
- Formulario admin de examen (`exam-form.tsx`) añade selector obligatorio de universidad.

---

## 4. Cuenta regresiva en el dashboard

- En `panel.tsx`, nueva sección superior con card por universidad objetivo mostrando "Faltan X días — [Universidad]". Se resalta la más próxima.
- Cálculo puro cliente a partir de `student_universities`.

---

## 5. Práctica por tema + favoritas

**Práctica dirigida**:
- Nueva ruta `_authenticated/practica.$topicSlug.tsx`: modo pregunta-por-pregunta, sin timer, feedback inmediato.
- Reutiliza `recordAttempt` (con `examSessionId=null`) — ya alimenta stats por tema.
- Botón "Practicar tema" en `temas.$slug.index.tsx`.

**Favoritas**:
- Botón estrella en `exercise-card.tsx` (visible en cualquier modo: práctica, examen, revisión).
- Server fns `toggleFavorite`, `listFavorites`.
- Nueva ruta `_authenticated/favoritas.tsx` con lista filtrable por tema.
- Enlace en `site-header.tsx`.

---

## 6. Análisis de tiempo + metas + comparación con media

**Tiempo por pregunta**:
- Ya se registra en `attempts.time_spent_ms`. Verificar que la sesión de examen (`examen-sesion.$sessionId.index.tsx`) lo esté enviando bien.
- En `examen-sesion.$sessionId.resultado.tsx`: nueva columna con tiempo por pregunta y badge "⏱ Lento" si tomó >150% del promedio de todos los intentos de ese ejercicio.

**Metas semanales**:
- Nueva server fn `getWeeklyProgress(userId)` calcula: preguntas respondidas y exámenes finalizados en la semana ISO actual, comparando con las metas del perfil.
- Card en `panel.tsx` con dos barras de progreso.

**Comparación con media**:
- Al finalizar examen (`resultado.tsx`), mostrar: tu puntaje vs promedio de todos los estudiantes que rindieron ese `exam_id`, más percentil.
- Server fn `getExamStats(examId)` con agregado sobre `exam_sessions` finalizadas.

---

## 7. Leaderboard (general por universidad + por examen)

- Nueva ruta `_authenticated/ranking.tsx` con dos tabs:
  - **General por universidad**: promedio de puntajes de simulacros/exámenes finalizados, filtrable por universidad. Muestra pseudónimo + puntaje, resaltando la fila del usuario actual aunque no esté en el top.
  - **Por examen específico**: selector de examen → tabla de mejores puntajes en ese examen.
- Solo aparecen estudiantes con `leaderboard_opt_in=true` y `pseudonym` no nulo.
- Server fns: `getUniversityLeaderboard(universityId, period)`, `getExamLeaderboard(examId)`, `getMyRank(...)`.
- Enlace en `site-header.tsx`.

---

## 8. Notificaciones in-app (bandeja mínima)

- Ícono campana en `site-header.tsx` con contador de no leídas.
- Popover con lista + botón "marcar todas como leídas".
- Server fns `listNotifications`, `markNotificationsRead`.
- Generadores automáticos (server fn `regenerateNotifications`, llamada perezosa al abrir el panel): "No has practicado en X días", "Faltan N días para tu examen [Univ]". Sin cron ni email.

---

## Detalles técnicos

**Migración única** con todas las tablas/columnas/policies. `student_universities`, `favorite_exercises`, `notifications` tienen RLS por `auth.uid()`. `exams` gana `university_id` sin romper filas existentes. Para leaderboard: se crea vista o server fn `SECURITY DEFINER` que solo expone `pseudonym` + `avg_score` para usuarios opt-in (nunca `user_id` ni email).

**Archivos nuevos**:
- Rutas: `_authenticated/practica.$topicSlug.tsx`, `_authenticated/favoritas.tsx`, `_authenticated/ranking.tsx`.
- Server fns: `src/lib/profile.functions.ts`, `src/lib/favorites.functions.ts`, `src/lib/leaderboard.functions.ts`, `src/lib/notifications.functions.ts`, `src/lib/goals.functions.ts`.
- Componentes: `FavoriteButton`, `CountdownCard`, `WeeklyGoalsCard`, `NotificationsBell`.

**Archivos modificados**:
- `perfil.tsx`, `panel.tsx`, `site-header.tsx`, `exam-form.tsx`, `simulacros.index.tsx`, `examenes.index.tsx`, `exercise-card.tsx`, `examen-sesion.$sessionId.resultado.tsx`, `temas.$slug.index.tsx`, `attempts.functions.ts`, `exams.functions.ts`.

**Orden de implementación** (en un solo turno, sin bloqueos):
1. Migración → aprobación → tipos regenerados.
2. Server fns nuevas.
3. UI de perfil + universidad en admin exam-form.
4. Filtros de universidad en listados + countdown en panel.
5. Práctica por tema + favoritas.
6. Análisis de tiempo + metas + comparación en resultado.
7. Leaderboard.
8. Bandeja de notificaciones.

Es un cambio grande; si prefieres partirlo en 2-3 sub-entregas dime y lo ajusto.
