import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar · MatePre" },
      { name: "description", content: "Crea una cuenta o ingresa para guardar tu progreso." },
    ],
  }),
  component: AuthPage,
});

function translateAuthError(err: any): string {
  const code: string | undefined = err?.code ?? err?.error_code;
  const msg: string = err?.message ?? "";
  const m = msg.toLowerCase();

  if (code === "weak_password" || m.includes("password") && (m.includes("weak") || m.includes("pwned") || m.includes("leaked") || m.includes("compromised"))) {
    return "Esa contraseña es insegura o ha aparecido en filtraciones. Elige una más fuerte (mínimo 8 caracteres, mezcla letras, números y símbolos).";
  }
  if (code === "identity_already_exists") {
    return "Esa cuenta de Google ya está vinculada a otro usuario.";
  }
  if (code === "email_exists" || m.includes("identity is already linked") || (m.includes("identity") && m.includes("already"))) {
    return "Ese correo ya tiene una cuenta. Si te registraste con contraseña, ingresa con ese método primero (o confirma tu correo si aún no lo hiciste) para poder vincular Google.";
  }
  if (code === "user_already_exists" || m.includes("already registered") || m.includes("already exists")) {
    return "Ya existe una cuenta con ese correo. Intenta ingresar.";
  }
  if (code === "email_address_invalid" || m.includes("invalid email")) {
    return "El correo no tiene un formato válido.";
  }
  if (code === "over_email_send_rate_limit" || m.includes("rate limit")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  if (code === "signup_disabled") {
    return "El registro está deshabilitado temporalmente.";
  }
  if (code === "invalid_credentials" || m.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (m.includes("password should be at least")) {
    return "La contraseña es demasiado corta. Usa al menos 8 caracteres.";
  }
  return msg || "Algo salió mal. Inténtalo de nuevo.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<"form" | "google" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/panel", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    setFormError(null);
    setInfo(null);
  }, [tab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setPendingAction("form");
    setFormError(null);
    setInfo(null);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Cuenta creada", { description: "Ya puedes empezar a practicar." });
          navigate({ to: "/panel", replace: true });
        } else {
          setInfo("Cuenta creada. Revisa tu correo para confirmarla antes de ingresar.");
          toast.success("Revisa tu correo para confirmar la cuenta.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/panel", replace: true });
      }
    } catch (err: any) {
      console.error("[auth]", err);
      const friendly = translateAuthError(err);
      setFormError(friendly);
      toast.error(friendly);
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setPendingAction("google");
    setFormError(null);

    // Open the popup synchronously, before any `await` — browsers only allow
    // window.open() as a direct response to the click; once we've awaited
    // anything, a later window.open() call gets blocked as a popup.
    const width = 480;
    const height = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
    const popup = window.open(
      "about:blank",
      "matepre-google-auth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      const friendly = "Tu navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio e inténtalo de nuevo.";
      setFormError(friendly);
      toast.error(friendly);
      setBusy(false);
      setPendingAction(null);
      return;
    }

    let url: string | null = null;
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error ?? new Error("No se pudo iniciar sesión con Google.");
      url = data.url;
    } catch (err: any) {
      popup.close();
      const friendly = translateAuthError(err);
      setFormError(friendly);
      toast.error(friendly);
      setBusy(false);
      setPendingAction(null);
      return;
    }

    // Google itself (and some providers) send back Cross-Origin-Opener-Policy headers
    // that can sever window.opener once the popup navigates away and back, so the popup
    // can't always reliably signal us directly. Poll shared localStorage + the session
    // instead — both survive regardless of COOP.
    localStorage.removeItem("matepre_google_auth_error");
    popup.location.href = url;

    const pollTimer = window.setInterval(async () => {
      const errorMessage = localStorage.getItem("matepre_google_auth_error");
      if (errorMessage) {
        localStorage.removeItem("matepre_google_auth_error");
        window.clearInterval(pollTimer);
        if (!popup.closed) popup.close();
        setFormError(errorMessage);
        toast.error(errorMessage);
        setBusy(false);
        setPendingAction(null);
        return;
      }
      if (popup.closed) {
        window.clearInterval(pollTimer);
        setBusy(false);
        setPendingAction(null);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        window.clearInterval(pollTimer);
        if (!popup.closed) popup.close();
        // Full reload (not the SPA router) so this window's own Supabase client
        // re-initializes and picks up the session the popup just persisted.
        window.location.assign("/panel");
      }
    }, 700);
  }

  return (
    <div className="mx-auto grid min-h-[80dvh] max-w-md place-items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold">Bienvenido a MatePre</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea una cuenta para guardar tu progreso.
        </p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="signin">Ingresar</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="collapsible" data-open={tab === "signup"} aria-hidden={tab !== "signup"}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nombre completo</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ana Pérez"
                    required={tab === "signup"}
                    tabIndex={tab === "signup" ? undefined : -1}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={tab === "signup" ? 8 : 6}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center overflow-hidden rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <span key={showPassword ? "hide" : "show"} className="animate-icon-pop">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </span>
                </button>
              </div>
              {tab === "signup" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Mínimo 8 caracteres. Evita contraseñas comunes (como “123456” o “password”).
                </p>
              )}
            </div>

            {formError && (
              <p
                role="alert"
                className="animate-alert-in rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
            {info && (
              <p className="animate-alert-in rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                {info}
              </p>
            )}

            <Button type="submit" className="press w-full min-h-11" disabled={busy}>
              {pendingAction === "form" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingAction === "form" ? "Procesando…" : tab === "signin" ? "Ingresar" : "Crear cuenta"}
            </Button>
          </form>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          o
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="press w-full min-h-11"
          disabled={busy}
          onClick={handleGoogle}
        >
          {pendingAction === "google" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
