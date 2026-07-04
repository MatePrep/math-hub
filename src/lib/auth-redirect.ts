// Supabase redirects the browser back here with auth state encoded in the URL hash
// (e.g. `#access_token=...&type=signup` on success, `#error=...&error_description=...` on
// failure — expired/used email confirmation links land here). supabase-js's own
// `detectSessionInUrl` consumes/clears that hash asynchronously to establish the session,
// so we capture it once at module load (before anything else can touch it) purely to show
// the student what happened; we never re-read or clear `window.location.hash` ourselves.
export const capturedAuthHashParams: URLSearchParams | null =
  typeof window !== "undefined" && window.location.hash.length > 1
    ? new URLSearchParams(window.location.hash.slice(1))
    : null;

export function translateHashAuthError(params: URLSearchParams): string {
  const code = params.get("error_code") ?? "";
  const error = params.get("error") ?? "";
  const description = params.get("error_description");

  if (code === "otp_expired") {
    return "El enlace de confirmación expiró. Inicia sesión con tu correo y contraseña; si no puedes, contáctanos para reenviarlo.";
  }
  if (error === "access_denied") {
    return "Ese enlace de confirmación ya no es válido (puede que ya se haya usado antes).";
  }
  if (description) {
    return decodeURIComponent(description.replace(/\+/g, " "));
  }
  return "No se pudo confirmar tu correo. Inténtalo de nuevo.";
}
