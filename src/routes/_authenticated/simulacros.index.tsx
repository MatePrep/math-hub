import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Shuffle, Play, Loader2 } from "lucide-react";
import { listPublishedTemplates, startExamSession } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/simulacros/")({
  head: () => ({
    meta: [
      { title: "Simulacros — MatePre" },
      { name: "description", content: "Genera simulacros de examen aleatorios a partir de las plantillas disponibles." },
      { property: "og:title", content: "Simulacros — MatePre" },
      { property: "og:description", content: "Practica con simulacros aleatorios personalizados." },
    ],
  }),
  component: SimulacrosPage,
});

function SimulacrosPage() {
  const navigate = useNavigate();
  const listFn = useServerFn(listPublishedTemplates);
  const startFn = useServerFn(startExamSession);
  const q = useQuery({ queryKey: ["published-templates"], queryFn: () => listFn() });
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onGenerate(examId: string) {
    setBusyId(examId);
    try {
      const { sessionId } = await startFn({ data: { examId } });
      navigate({ to: "/examen-sesion/$sessionId", params: { sessionId } });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el simulacro");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
          <Shuffle className="h-3 w-3" /> Preguntas aleatorias
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Simulacros</h1>
        <p className="mt-2 text-muted-foreground">
          Cada simulacro se arma con preguntas aleatorias del banco según la plantilla. Si repites uno, obtendrás una combinación distinta.
        </p>
      </header>

      {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {q.data && q.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aún no hay plantillas disponibles.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(q.data ?? []).map((t: any) => (
          <article key={t.id} className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold">{t.title}</h2>
            {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {t.time_limit_min} min</Badge>
              <Badge variant="outline">{t.totalQuestions} preguntas</Badge>
              <Badge variant="outline">{t.ruleCount} materia(s)</Badge>
            </div>
            <div className="mt-4">
              <Button onClick={() => onGenerate(t.id)} disabled={busyId === t.id}>
                {busyId === t.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando…</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Generar examen</>
                )}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
