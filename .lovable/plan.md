# MatePre — Plataforma de práctica de matemáticas

Plataforma web en español para estudiantes preuniversitarios peruanos. Ejercicios por tema/subtema, dificultad y examen de admisión (UNI, San Marcos, PUCP, UNALM, Villarreal), con búsqueda, soluciones paso a paso, seguimiento de progreso y simulacros de examen. Totalmente responsive (desktop, tablet, móvil) y accesible.

## Objetivos específicos cubiertos

1. Navegación intuitiva por temas y subtemas → sidebar/menú jerárquico + breadcrumbs
2. Búsqueda y filtros rápidos → barra de búsqueda global + filtros por tema, dificultad, universidad, año
3. Soluciones paso a paso → vista de ejercicio con solución colapsable en Markdown+LaTeX
4. Seguimiento de progreso → dashboard con racha, % aciertos global y por tema, historial
5. Preparación de examen → modo simulacro cronometrado por universidad
6. Responsive + accesible → Tailwind responsive, shadcn/Radix (ARIA correcto), targets ≥44px, `h-dvh`, contraste AA
7. Interfaz limpia y enfocada → estética cuaderno académico, tipografía legible, sin distracciones

## Stack y backend

- TanStack Start + React + Tailwind v4 + shadcn/ui
- Lovable Cloud (auth email/password + Postgres + RLS)
- KaTeX (`katex` + `react-katex`) para fórmulas
- Paleta: blanco hueso `#FBFAF6`, azul profundo `#1E3A8A`, acento ámbar `#F59E0B`, texto `#0F172A`
- Tipografía: Fraunces (display) + Inter (body) via `@fontsource`

## Esquema de base de datos (migración + seed)

- `profiles` (id → auth.users, full_name, target_university, created_at)
- `user_roles` + enum `app_role` (`student`, `admin`) + función `has_role`
- `topics` (id, slug, name, description, icon, order)
- `subtopics` (id, topic_id, slug, name, order)
- `universities` (id, slug, name, short_name)
- `exercises` (id, topic_id, subtopic_id, university_id nullable, exam_year nullable, difficulty enum `facil|medio|dificil`, statement_md, choices jsonb, correct_choice, solution_md, tags text[], created_at)
- `attempts` (id, user_id, exercise_id, selected_choice, is_correct, time_spent_ms, created_at)
- `exam_sessions` (id, user_id, university_id, started_at, finished_at, score, total)
- RLS: lectura pública (`TO anon SELECT`) en topics/subtopics/universities/exercises; attempts/exam_sessions/profiles privados por `auth.uid()`; writes a contenido sólo admin (`has_role`)
- GRANTs explícitos en cada tabla
- Seed: 6 temas con 3–5 subtemas cada uno, 5 universidades, ~30 ejercicios distribuidos con solución paso a paso

## Rutas

```
/                          Landing: hero, temas destacados, universidades, CTA
/temas                     Grilla de temas con conteo de ejercicios
/temas/$slug               Tema: lista de subtemas + ejercicios filtrables
/temas/$slug/$subtopic     Subtema: ejercicios del subtema
/buscar?q=...              Resultados de búsqueda (search param validado)
/examenes                  Hub de universidades
/examenes/$slug            Ejercicios de la universidad + botón "Iniciar simulacro"
/examenes/$slug/simulacro  Modo cronómetro, sin solución hasta finalizar
/ejercicio/$id             Vista de práctica con solución paso a paso
/auth                      Login / registro
/_authenticated/panel      Dashboard: progreso, racha, aciertos, historial
/_authenticated/perfil     Editar perfil, universidad objetivo
```

## Navegación y búsqueda

- Header global: logo "MatePre", nav (Temas, Exámenes, Panel), búsqueda, botón auth
- En `/temas/$slug`: sidebar de subtemas (colapsable en móvil vía shadcn Sheet)
- Breadcrumbs en vistas de tema/subtema/ejercicio
- Búsqueda: input en header → navega a `/buscar?q=...`; consulta server fn pública sobre `exercises` (statement, tags) con `ilike`
- Filtros en listados controlados por search params (`validateSearch` + `zodValidator` + `fallback`): `difficulty`, `university`, `year`

## Vista de ejercicio

- Enunciado renderizado con KaTeX
- Opciones múltiples (radio)
- Botón "Verificar" → feedback inmediato (correcto/incorrecto), guarda intento
- "Ver solución paso a paso" colapsable (Accordion shadcn)
- Botones "Anterior" / "Siguiente" dentro del mismo tema o examen
- Indicador de dificultad y universidad/año si aplica

## Modo simulacro

- Cronómetro descendente configurable según universidad
- N preguntas en secuencia, sin retroalimentación durante
- Al finalizar: puntaje, % aciertos, repaso ejercicio por ejercicio con solución
- Registra `exam_sessions` y `attempts`

## Dashboard de progreso

- Tarjetas: ejercicios resueltos, % aciertos global, racha actual, tiempo total
- Gráfico de barras: % aciertos por tema (Recharts)
- Tabla de últimos intentos
- Recomendación: "Tu tema más débil es X — practicar"
- Historial de simulacros

## Auth

- Email/password vía Lovable Cloud
- Trigger SQL `handle_new_user` crea profile automáticamente
- Layout `_authenticated/route.tsx` gestionado por integración
- `onAuthStateChange` en `__root.tsx` filtrado a SIGNED_IN/OUT/USER_UPDATED

## Detalles técnicos

- Server functions con `createServerFn`:
  - Públicas: `listTopics`, `listExercises({filters})`, `searchExercises({q})`, `getExercise({id})` — cliente publishable
  - Autenticadas (`requireSupabaseAuth`): `recordAttempt`, `getUserStats`, `startExamSession`, `finishExamSession`
- TanStack Query: `ensureQueryData` en loaders + `useSuspenseQuery` en componentes; `defaultPreloadStaleTime: 0`
- `errorComponent` + `notFoundComponent` en cada ruta con loader
- Bearer attacher en `src/start.ts` para fns protegidas
- Lecturas públicas no usan `supabaseAdmin`

## Accesibilidad y responsive

- Mobile-first: grid `grid-cols-[minmax(0,1fr)_auto]` en headers, `min-w-0`/`shrink-0`/`truncate`
- Sheet/Drawer para nav móvil; sidebar shadcn colapsable en escritorio
- `aria-label` en botones icon-only; contraste AA con tokens semánticos (`text-foreground`, `bg-background`)
- Foco visible, tap targets ≥44px en CTAs principales
- `<html lang="es">`, un solo `<main>` por página
- `h-dvh` para layouts de pantalla completa

## Fuera de alcance (MVP)

- Panel admin para subir ejercicios (puede agregarse después)
- Ranking social / comentarios
- Pagos / suscripciones
- App móvil nativa
