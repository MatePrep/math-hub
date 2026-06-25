import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar · MatePre" },
      { name: "description", content: "Crea una cuenta o ingresa para guardar tu progreso." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/panel", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada", { description: "Ya puedes empezar a practicar." });
        navigate({ to: "/panel", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/panel", replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        toast.error(res.error.message ?? "No se pudo iniciar sesión con Google");
        setBusy(false);
        return;
      }
      if (res.redirected) return;
      navigate({ to: "/panel", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Error con Google");
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
              />
            </div>
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
