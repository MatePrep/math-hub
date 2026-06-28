# MatePre — Ajuste al plan

## Cambio solicitado

Eliminar cualquier panel/rol de administrador. Conservar el panel del estudiante para seguir su progreso y ejercicios resueltos.

## Qué se quita

- Rol `admin` del enum `app_role` y cualquier referencia en código.
- Función/uso de `has_role(..., 'admin')` en políticas RLS.
- Políticas de escritura "sólo admin" sobre `topics`, `subtopics`, `universities`, `exercises`.
- Cualquier ruta o UI futura tipo `/admin` (no se construirá).
- Mención de "panel admin" en la sección "Fuera de alcance" (ya no aplica como posible extensión inmediata).

El contenido (temas, ejercicios, universidades) se mantiene gestionado vía migraciones/seed SQL, no vía UI.

## Qué se conserva (panel del estudiante)

Sin cambios en `/_authenticated/panel`:
- Tarjetas: ejercicios resueltos, % aciertos global, correctos, racha de días.
- Gráfico de barras de aciertos por tema (Recharts).
- Lista de intentos recientes con enlace a "Repasar".
- Recomendación del tema más débil.
- Acceso a `/perfil` para editar nombre y universidad objetivo.

Tablas que sustentan el panel siguen igual: `attempts`, `exam_sessions`, `profiles`, `user_roles` (sólo con rol `student`).

## Detalles técnicos

- Migración de ajuste: reemplazar políticas que usan `has_role(auth.uid(),'admin')` por políticas de sólo lectura pública donde corresponde; dejar las tablas de contenido sin políticas de INSERT/UPDATE/DELETE para roles `anon`/`authenticated` (writes sólo vía `service_role` en migraciones).
- Enum `app_role`: dejar únicamente `student` (se mantiene el patrón `user_roles` + `has_role` por seguridad y futura extensibilidad).
- Actualizar `.lovable/plan.md` para reflejar estos cambios.
