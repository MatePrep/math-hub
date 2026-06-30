# Plan — Imágenes en ejercicios, gestión de materias y módulo de Exámenes

Trabajo dividido en 3 entregas, en orden. Cada una se puede verificar de forma independiente.

---

## 1) Admin: subir imágenes en ejercicios

### Backend (storage + esquema)
- Crear bucket público `exercise-images` en Lovable Cloud Storage.
- Políticas en `storage.objects`:
  - `SELECT` público (anon + authenticated) sobre el bucket.
  - `INSERT/UPDATE/DELETE` sólo si `has_role(auth.uid(), 'admin')`.
- Migración en `exercises`:
  - `statement_image_url text null`
  - `solution_image_url text null`
- Server function nueva en `src/lib/admin.functions.ts`:
  - `deleteExerciseImage({ path })` — borra del bucket cuando el admin reemplaza/quita.

### UI (form de ejercicios)
- Nuevo componente `src/components/image-upload.tsx`:
  - Drag-and-drop + click-to-browse.
  - Valida tipo (jpg, png, webp, svg) y tamaño ≤ 5MB; error inline.
  - Sube directo a `exercise-images` con `supabase.storage` (admin autenticado, RLS lo permite).
  - Muestra barra de progreso y miniatura del archivo final.
  - Permite eliminar/reemplazar; al reemplazar en edición, llama a `deleteExerciseImage` para limpiar el archivo previo.
- `ExerciseForm` integra dos campos opcionales: imagen del enunciado y imagen de la solución.
- Botón **Guardar** deshabilitado mientras alguna subida está en curso; los demás campos no se pierden si la subida falla (estado local del formulario intacto).
- `MathText` ya renderiza el enunciado; añadimos render de la imagen debajo cuando existe.

---

## 2) Materias dinámicas + gestión básica

### Datos
- Migración sobre `topics`:
  - `description text null`, `color text null` (hex corto), `active boolean not null default true`.
- Server functions en `admin.functions.ts`:
  - `createTopic({ name, description?, color? })` — normaliza el slug, valida duplicado case-insensitive (`lower(name)`), devuelve el topic existente si ya existe.
  - `renameTopic`, `setTopicActive`, `deleteTopic` (bloquea borrado si tiene ejercicios; mensaje claro).

### UI
- En el selector de "Tema" del `ExerciseForm`:
  - Opción final **"+ Agregar nueva materia"** abre un `Dialog` con nombre (obligatorio), descripción y color.
  - Al guardar: si existe, mensaje "Ya existe, ¿usarla?" + botón para seleccionarla; si no, se crea, se invalida la query de meta y se selecciona automáticamente.
- Nueva ruta `/_authenticated/admin/materias`:
  - Tabla con nombre, # ejercicios, estado activo, acciones (renombrar, activar/desactivar, eliminar con confirmación).
- Filtros públicos (`/temas`, `/buscar`) usan `active = true`; el resto del app ya consume `topics` así que las nuevas aparecen en todos lados automáticamente.

---

## 3) Módulo de Exámenes (prioridad alta)

### Esquema (migración única)
- `exams`: `title`, `description`, `time_limit_min`, `passing_score`, `max_attempts` (null = ilimitado), `status` ('draft'|'published'|'archived'), `question_order` ('fixed'|'random'), `created_by`.
- `exam_topics(exam_id, topic_id)` — materias cubiertas.
- `exam_questions`: `exam_id`, `exercise_id`, `position`, `points` (default 1). Permite selección manual.
- `exam_rules`: `exam_id`, `topic_id`, `difficulty`, `count` — para generación aleatoria opcional (se materializan en `exam_questions` al publicar, o se resuelven al iniciar el intento).
- Reutilizamos `exam_sessions` ya existente y le añadimos: `exam_id`, `status` ('in_progress'|'submitted'|'graded'), `answers jsonb` (autosave), `score`, `started_at`, `submitted_at`, `question_ids uuid[]` (snapshot del orden por estudiante).
- GRANTs + RLS:
  - Lectura pública sólo de exámenes `published` (anon/authenticated).
  - Escritura sólo admin.
  - `exam_sessions`: el estudiante sólo ve/edita las suyas; admin las ve todas.

### Admin
- Rutas bajo `/_authenticated/admin/examenes`:
  - `index` — tabla con estado, # preguntas, # intentos.
  - `nuevo` y `$id` — form con: título, descripción, materias, tiempo, nota mínima, intentos, orden, estado.
  - Selección de preguntas: pestaña **Manual** (buscador con filtros por materia/dificultad, multi-select) y pestaña **Reglas** (lista de "N preguntas de materia X dificultad Y").
  - Aviso amarillo si ya hay intentos cuando se edita.

### Estudiante
- `/examenes` (lista pública de publicados) + `/examenes/$id` (pantalla previa con título, # preguntas, tiempo, botón "Comenzar").
- `/examenes/$id/intento/$sessionId` — interfaz de examen:
  - Una pregunta por pantalla, indicador "Pregunta N de M", botones anterior/siguiente, botón "Marcar para revisar".
  - Render con `MathText` + imagen si existe.
  - Timer persistente calculado desde `started_at` (sobrevive a recargas).
  - Autosave de `answers` cada cambio (debounce ~500ms) vía server fn `saveExamAnswers`.
  - Auto-submit al llegar a 0; submit manual con confirmación que indica preguntas sin responder.
- Resultados `/examenes/$id/resultado/$sessionId`:
  - Score, pass/fail, desglose por pregunta con respuesta correcta + explicación (auto-graded).
  - Si hay preguntas que requieran revisión manual (futuro), marca "Pendiente de revisión" y oculta el score final.
- Historial de intentos visible en `/panel` y en la pantalla previa del examen.

### Servidor (funciones)
- `listPublishedExams`, `getExamForStudent`, `startExamSession` (valida intentos restantes, materializa `question_ids` según orden/reglas), `saveExamAnswers`, `submitExamSession` (autograde objetivas), `getExamResult`.
- Admin: `listAdminExams`, `getAdminExam`, `createExam`, `updateExam`, `setExamStatus`, `listExamAttempts`.

### Edge cases cubiertos
- **Reload mid-exam**: la sesión `in_progress` se reanuda con tiempo restante calculado server-side.
- **Sin intentos restantes**: `startExamSession` lanza error → UI muestra mensaje y enlace al historial.
- **Examen despublicado/eliminado durante intento**: la sesión existente puede finalizarse y verse el resultado; nuevos inicios bloqueados con mensaje.
- **Auto-submit por tiempo**: cron del cliente + verificación server-side al `submitExamSession` (si `now > started_at + time_limit`, se acepta sin penalizar).

---

## Orden de ejecución
1. Bucket + migración de imágenes + `ImageUpload` + integración en `ExerciseForm`.
2. Migración `topics` + `createTopic` + UI inline + pantalla de gestión de materias.
3. Migración de exámenes + funciones server + admin CRUD + flujo estudiante end-to-end + resultados + edge cases.

Cada paso queda funcional antes de pasar al siguiente.
