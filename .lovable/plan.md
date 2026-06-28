# Arreglar registro de estudiantes

## Diagnóstico

Los logs de auth muestran que `POST /signup` devuelve **422** y los intentos posteriores de login fallan con "Invalid credentials" — la cuenta nunca se crea. En la UI no aparece mensaje porque el error se silencia parcialmente y la pestaña sigue mostrando el formulario.

Causas más probables del 422 (en orden):

1. **Leaked-password protection (HIBP)** activa — contraseñas comunes como `123456`, `password`, etc. son rechazadas.
2. **Contraseña por debajo del mínimo** que exige el servidor (aunque el formulario sólo pide 6, el proyecto puede exigir más).
3. **Email mal formado o ya registrado** sin confirmar.

## Cambios

1. **Mejor manejo de errores en `src/routes/auth.tsx**`
  - Mostrar el `error.message` exacto del servidor en el toast y también inline debajo del formulario, en español, para que el estudiante vea qué falló.
  - Traducir los códigos comunes de Supabase a mensajes claros: `weak_password`, `email_address_invalid`, `user_already_exists`, `over_email_send_rate_limit`, `signup_disabled`.
  - Loguear `error` a consola en desarrollo para diagnóstico futuro.
  - Subir el `minLength` del campo de contraseña a 8 y añadir hint visible: "Mínimo 8 caracteres. Evita contraseñas comunes."
  - Si `signUp` responde con `data.user` pero sin `session` (caso confirmación por email), mostrar mensaje "Revisa tu correo para confirmar" en lugar de navegar al panel y fallar.
  - agregar un boton para mostrar la contrasena que se esta usando
2. **Confirmar configuración de auth**
  - Mantener email/password habilitado.
  - **No** activar auto-confirm (el usuario no lo pidió).
  - Dejar HIBP activado (es buena práctica de seguridad) — el mensaje claro al usuario es suficiente.
3. **No tocar**: políticas RLS, trigger `handle_new_user`, ni el panel del estudiante.

## Verificación

- Intentar registro con contraseña débil → debe mostrar "Contraseña insegura, elige otra más fuerte".
- Intentar registro con email duplicado → debe mostrar "Ya existe una cuenta con ese correo".
- Registro válido (≥8 caracteres, no filtrada) → crea cuenta y entra al panel.