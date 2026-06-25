import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { getProfile, updateProfile } from "@/lib/attempts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil · MatePre" }] }),
  component: PerfilPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const UNIS = [
  { v: "", label: "Sin definir" },
  { v: "UNI", label: "UNI" },
  { v: "UNMSM", label: "San Marcos" },
  { v: "PUCP", label: "PUCP" },
  { v: "UNALM", label: "UNALM" },
  { v: "UNFV", label: "UNFV" },
];

function PerfilPage() {
  const fetchProfile = useServerFn(getProfile);
  const save = useServerFn(updateProfile);
  const qo = useMemo(
    () => queryOptions({ queryKey: ["profile"], queryFn: () => fetchProfile() }),
    [fetchProfile],
  );
  const { data: profile } = useSuspenseQuery(qo);
  const [fullName, setFullName] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setTarget(profile?.target_university ?? "");
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: { fullName, targetUniversity: target || null } });
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Tu perfil</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="target">Universidad objetivo</Label>
          <select
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {UNIS.map((u) => (
              <option key={u.v} value={u.v}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
