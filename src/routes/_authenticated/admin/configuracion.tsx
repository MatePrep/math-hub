import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getScoringDefaults, updateScoringDefaults } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const fetchFn = useServerFn(getScoringDefaults);
  const updateFn = useServerFn(updateScoringDefaults);
  const q = useQuery({ queryKey: ["scoring-defaults"], queryFn: () => fetchFn() });

  const [pointsCorrect, setPointsCorrect] = useState(20);
  const [pointsIncorrect, setPointsIncorrect] = useState(-2);
  const [pointsEmpty, setPointsEmpty] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.data) {
      setPointsCorrect(q.data.points_correct);
      setPointsIncorrect(q.data.points_incorrect);
      setPointsEmpty(q.data.points_empty);
    }
  }, [q.data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFn({
        data: {
          points_correct: Number(pointsCorrect),
          points_incorrect: Number(pointsIncorrect),
          points_empty: Number(pointsEmpty),
        },
      });
      toast.success("Valores por defecto actualizados");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-xl font-bold">Configuración general</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Valores de puntaje sugeridos para exámenes y simulacros nuevos. Cada examen guarda su
        propia configuración al crearse — cambiar estos valores por defecto no afecta a los
        exámenes/templates que ya existen, solo a los que se creen de aquí en adelante.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Correcta</Label>
            <Input type="number" step="0.5" value={pointsCorrect} onChange={(e) => setPointsCorrect(Number(e.target.value))} required />
          </div>
          <div>
            <Label>Incorrecta</Label>
            <Input type="number" step="0.5" value={pointsIncorrect} onChange={(e) => setPointsIncorrect(Number(e.target.value))} required />
          </div>
          <div>
            <Label>Vacía / sin responder</Label>
            <Input type="number" step="0.5" value={pointsEmpty} onChange={(e) => setPointsEmpty(Number(e.target.value))} required />
          </div>
        </div>
        <Button type="submit" className="press" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
