# Rol admin para gestionar ejercicios

## Objetivo

Reintroducir un rol `admin` que permita crear, editar y eliminar ejercicios desde una sección protegida del panel, con metadatos completos (tema, subtema, universidad, año, dificultad, enunciado, alternativas, respuesta correcta, solución y etiquetas).

## Cambios en la base de datos

1. **Reañadir `'admin'` al enum `app_role**` (`ALTER TYPE app_role ADD VALUE 'admin'`).
2. **Políticas de escritura admin** sobre `exercises`, `topics`, `subtopics`, `universities` usando `has_role(auth.uid(), 'admin')`:
  - INSERT/UPDATE/DELETE para `authenticated` cuando el usuario tiene rol admin.
  - Mantener las políticas públicas de SELECT.
3. **Sin auto-asignación de admin**: el primer admin se asigna manualmente con una sentencia SQL (insert tool) cuando el usuario indique qué correo debe ser admin. Nunca se otorga admin desde el cliente.
4. Restaurar permiso de ejecución de `has_role` para `authenticated`.

## Server functions nuevas (`src/lib/admin-exercises.functions.ts`)

Todas con `.middleware([requireSupabaseAuth])` y verificación explícita `has_role(userId, 'admin')` — si falla, lanzan `Error('Forbidden')`:

- `createExercise({ topic_id, subtopic_id?, university_id?, exam_year?, difficulty, statement_md, choices[], correct_choice, solution_md, tags[] })`
- `updateExercise({ id, ...campos })`
- `deleteExercise({ id })`
- `listAllExercisesAdmin()` — listado paginable con joins de tema/universidad para la tabla del admin.
- `listTopicsAdmin()`, `listSubtopicsByTopic(topicId)`, `listUniversitiesAdmin()` para los selectores del formulario.

Validación con Zod (longitudes, mínimo 2 alternativas, `correct_choice` dentro del rango).

## UI nueva (solo admins)

1. **Gate de rol**: nuevo layout `src/routes/_authenticated/_admin/route.tsx` que consulta `has_role` vía server fn y redirige a `/panel` si no es admin.
2. `**/_authenticated/_admin/ejercicios/index.tsx**`: tabla con todos los ejercicios (tema, universidad, dificultad, año, acciones editar/eliminar) + botón "Nuevo ejercicio".
3. `**/_authenticated/_admin/ejercicios/nuevo.tsx**` y `**/_authenticated/_admin/ejercicios/$id.tsx**`: formulario con:
  - Select Tema → Select Subtema dependiente.
  - Select Universidad (opcional) + input Año.
  - Select Dificultad (facil/medio/dificil).
  - Textarea Enunciado (Markdown + KaTeX, con vista previa).
  - Editor de alternativas (añadir/quitar, marcar la correcta con radio).
  - Textarea Solución paso a paso (con vista previa).
  - Input Tags (chips separados por coma).
4. **Enlace "Administración"** en `SiteHeader` visible solo si el usuario es admin (hook `useIsAdmin` que consulta una server fn ligera y cachea con TanStack Query).

## Sin tocar

- Panel del estudiante, autenticación, semilla existente, políticas de SELECT públicas.

## Verificación

- Usuario normal: no ve enlace "Administración" y al entrar manualmente a `/_authenticated/_admin/...` es redirigido.
- Usuario admin: crea un ejercicio nuevo y aparece de inmediato en `/temas/...` y `/buscar`.
- Editar y eliminar funcionan y reflejan en el listado del estudiante.
- El linter de la base de datos no reporta nuevos warnings.

## El usuario admin sera [admin@mathpre.edu](mailto:admin@mathpre.edu). Este sera algo temporal, es necesario que pueda actualizarlo màs adelante cuando tenga mi propio dominio.