import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Shuffle, Play, Loader2, ChevronDown, ChevronUp, History } from "lucide-react";
import { listPublishedTemplates, startExamSession, listMyTemplateSessions } from "@/lib/exams.functions";

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
  const sessionsFn = useServerFn(listMyTemplateSessions);
  const q = useQuery({ queryKey: ["published-templates"], queryFn: () => listFn() });
  const sessionsQ = useQuery({ queryKey: ["my-template-sessions"], queryFn: () => sessionsFn() });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const sessionsByExam = new Map<string, any[]>();
  (sessionsQ.data ?? []).forEach((s: any) => {
    if (!s.exam_id) return;
    if (!sessionsByExam.has(s.exam_id)) sessionsByExam.set(s.exam_id, []);
    sessionsByExam.get(s.exam_id)!.push(s);
  });

  function toggleHistory(id: string) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

      <div className="flex flex-col gap-4">
        {(q.data ?? []).map((t: any) => {
          const attempts = sessionsByExam.get(t.id) ?? [];
          const isExpanded = expandedHistory.has(t.id);
          return (
            <article key={t.id} className="rounded-xl border border-border bg-card">
              <div className="p-5">
                <h2 className="font-display text-lg font-bold">{t.title}</h2>
                {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {t.time_limit_min} min</Badge>
                  <Badge variant="outline">{t.totalQuestions} preguntas</Badge>
                  <Badge variant="outline">{t.ruleCount} materia(s)</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button onClick={() => onGenerate(t.id)} disabled={busyId === t.id}>
                    {busyId === t.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando…</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Generar nuevo simulacro</>
                    )}
                  </Button>
                  {attempts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleHistory(t.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                      {attempts.length} intento{attempts.length !== 1 ? "s" : ""}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {attempts.length > 0 && isExpanded && (
                <div className="border-t border-border px-5 pb-4 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Historial</p>
                  <div className="space-y-2">
                    {attempts.map((a: any) => (
                      <Link
                        key={a.id}
                        to="/examen-sesion/$sessionId/resultado"
                        params={{ sessionId: a.id }}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                      >
                        <div>
                          <p className="font-medium">{new Date(a.started_at).toLocaleString("es-PE")}</p>
                          <p className="text-xs text-muted-foreground">{a.score ?? 0}% · {a.total} preguntas</p>
                        </div>
                        <span className="text-primary">Ver resultado →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
