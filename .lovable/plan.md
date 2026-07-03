# Plan: Templates de examen con generación aleatoria

Aprovechamos la infraestructura existente (`exams.exam_type='template'` + `exam_template_rules` + `exam_sessions`) y añadimos lo que falta: UI dedicada para el estudiante, refinamientos al formulario admin, y las reglas de negocio nuevas.

## 1. Admin — Gestión de templates

Refinar `src/components/exam-form.tsx` cuando `exam_type='template'`:
- Mostrar **total de preguntas calculado** (suma de `question_count`) en tiempo real.
- Por cada regla, mostrar **cuántas preguntas hay disponibles** en el banco para ese tema+dificultad (consulta ligera vía nueva server fn `getTopicQuestionCounts`) y marcar en rojo si `question_count > disponibles`.
- Botón "Guardar" muestra advertencia (`toast` + `AlertDialog` confirmación) cuando hay reglas insuficientes, pero permite guardar como *borrador* (`status='draft'`).
- Validación server-side existente en `validateTemplateRules` se mantiene; solo bloquea publicar (`status='published'`) si falta stock.

Listado en `src/routes/_authenticated/admin/examenes.index.tsx`:
- Agregar tab/filtro "Plantillas" vs "Estándar".
- Para plantillas mostrar: nombre, duración, total de preguntas (suma de reglas), nº de intentos generados, estado.
- Acción **Eliminar**: bloqueada si existen `exam_sessions` con `exam_id=<template>` (nuevo chequeo en `deleteExam`); si hay intentos, ofrecer archivar (`status='archived'`).

## 2. Estudiante — Nueva sección "Simulacros"

Rutas nuevas:
- `src/routes/_authenticated/simulacros.index.tsx` — lista de templates publicados (nombre, descripción, duración, total de preguntas, botón **Generar examen**).
- Enlace en `SiteHeader` para usuarios autenticados.

Server fn nueva `listPublishedTemplates` en `src/lib/exams.functions.ts`:
- SELECT de `exams` con `exam_type='template'` y `status='published'`, incluyendo suma de `exam_template_rules.question_count`.

Flujo "Generar examen":
- Botón llama a `startExamSession({ examId })` existente (ya soporta template) → redirige a `/examen-sesion/$sessionId`.
- Añadir manejo de errores amistoso (toast) cuando falte stock o se viole la regla de uno-en-curso.

## 3. Reglas de negocio nuevas

Aplicar dentro de `startExamSession` (template únicamente):

- **Uno en curso por template**: la lógica actual ya resume la sesión `in_progress` existente del mismo `exam_id` — comportamiento correcto, se mantiene, se documenta con mensaje claro ("Ya tienes un simulacro en curso para esta plantilla, se retomará").
- **Evitar repetición de preguntas ya vistas**: antes de armar el pool aleatorio por regla, obtener `exercise_id` distintos de `exam_sessions` previos del mismo `user_id`+`exam_id` (leyendo `question_ids`). Preferir preguntas no vistas; si no alcanzan, completar con vistas anteriores (nunca fallar por esto).
- **Stock insuficiente al generar**: si el total real de preguntas disponibles (vistas+nuevas) para una regla < `question_count`, lanzar error claro: "No hay suficientes preguntas de <tema> para generar este simulacro."
- **Mezcla final**: ya implementada (shuffle cross-rule).

## 4. Borrado seguro de templates

Modificar `deleteExam` en `src/lib/admin.functions.ts`:
- Antes de borrar, contar `exam_sessions` con `exam_id=id`.
- Si > 0 → responder con error específico "No se puede eliminar: existen N intentos generados. Archívalo en su lugar."
- Añadir server fn `archiveExam` que setea `status='archived'` (nuevo valor de enum, ver migración).
- UI del listado añade acción "Archivar".

## Sección técnica

**Migración de BD:**
- Añadir `'archived'` al enum `exam_status` (si no existe): `ALTER TYPE exam_status ADD VALUE IF NOT EXISTS 'archived';`
- No se requieren tablas nuevas.

**Archivos a modificar:**
- `src/lib/admin.functions.ts` — nuevas fns `getTopicQuestionCounts`, `archiveExam`; refuerzo en `deleteExam`.
- `src/lib/exams.functions.ts` — nueva fn `listPublishedTemplates`; refactor de `startExamSession` (rama template) para excluir preguntas ya vistas con fallback.
- `src/components/exam-form.tsx` — total en vivo, contador disponible por regla, confirm dialog al guardar con déficit.
- `src/routes/_authenticated/admin/examenes.index.tsx` — filtro estándar/plantilla, columnas de intentos, acciones eliminar/archivar.
- `src/routes/_authenticated/simulacros.index.tsx` — nueva ruta.
- `src/components/site-header.tsx` — enlace "Simulacros".

**Sin cambios de esquema mayores**: la tabla `exam_template_rules` y las columnas `exam_type`/`allow_multiple_attempts` ya existen. La sesión sigue almacenando `question_ids` snapshot, garantizando que editar/eliminar el template no afecte exámenes en curso ni resultados históricos.
