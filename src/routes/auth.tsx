import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

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
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setFormError(null);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        const friendly = translateAuthError(res.error);
        setFormError(friendly);
        toast.error(friendly);
        setBusy(false);
        return;
      }
      if (res.redirected) return;
      navigate({ to: "/panel", replace: true });
    } catch (err: any) {
      const friendly = translateAuthError(err);
      setFormError(friendly);
      toast.error(friendly);
      setBusy(false);
    }
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
            <TabsContent value="signup" className="mt-0 space-y-4">
              <div>
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ana Pérez"
                  required={tab === "signup"}
                />
              </div>
            </TabsContent>

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
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
            {info && (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                {info}
              </p>
            )}

            <Button type="submit" className="w-full min-h-11" disabled={busy}>
              {busy ? "Procesando…" : tab === "signin" ? "Ingresar" : "Crear cuenta"}
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
          className="w-full min-h-11"
          disabled={busy}
          onClick={handleGoogle}
        >
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
