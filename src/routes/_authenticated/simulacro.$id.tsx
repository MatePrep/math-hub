import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, RotateCcw, Loader2, ListChecks, VolumeX, Shuffle, Save } from "lucide-react";
import { getTemplatePreview, getMyExamAttempts, startExamSession } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/simulacro/$id")({
  component: SimulacroPreview,
});

function SimulacroPreview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const previewFn = useServerFn(getTemplatePreview);
  const attemptsFn = useServerFn(getMyExamAttempts);
  const startFn = useServerFn(startExamSession);
  const [starting, setStarting] = useState(false);

  const preview = useQuery({ queryKey: ["template-preview", id], queryFn: () => previewFn({ data: { id } }) });
  const attempts = useQuery({ queryKey: ["exam-attempts", id], queryFn: () => attemptsFn({ data: { examId: id } }) });

  async function onStart() {
    setStarting(true);
    try {
      const { sessionId } = await startFn({ data: { examId: id } });
      navigate({ to: "/examen-sesion/$sessionId", params: { sessionId } });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el simulacro");
    } finally {
      setStarting(false);
    }
  }

  if (preview.isLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Cargando…</div>;
  if (!preview.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>Este simulacro no está disponible.</p>
        <Link to="/simulacros" className="mt-4 inline-block text-primary hover:underline">Volver</Link>
      </div>
    );
  }

  const t = preview.data;
  const done = (attempts.data ?? []).filter((a: any) => a.status === "graded" || a.status === "submitted");
  const inProgress = (attempts.data ?? []).find((a: any) => a.status === "in_progress");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/simulacros" className="hover:underline">Simulacros</Link> / <span className="text-foreground">{t.title}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-bold">{t.title}</h1>
      {t.description && <p className="mt-2 text-muted-foreground">{t.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {t.university && <Badge variant="secondary">{t.university.short_name}</Badge>}
        <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {t.time_limit_min} min</Badge>
        <Badge variant="outline"><ListChecks className="mr-1 h-3 w-3" /> {t.totalQuestions} preguntas</Badge>
        {t.passing_score != null && <Badge variant="outline">Aprobación: {t.passing_score}%</Badge>}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Antes de comenzar</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Tendrás <strong className="text-foreground">&nbsp;{t.time_limit_min} minutos&nbsp;</strong> desde que inicies. Si el tiempo se agota, el simulacro se envía automáticamente.
          </li>
          <li className="flex items-start gap-2">
            <Shuffle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Las preguntas se eligen al azar según el banco de cada tema — si repites el simulacro, obtendrás una combinación distinta.
          </li>
          <li className="flex items-start gap-2">
            <VolumeX className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Busca un lugar silencioso y sin distracciones para concentrarte, igual que en un examen real.
          </li>
          <li className="flex items-start gap-2">
            <Save className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Puedes marcar preguntas para revisarlas después; tus respuestas se guardan automáticamente.
          </li>
        </ul>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preguntas por tema</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {t.topicBreakdown.map((tb, i) => (
              <li key={`${tb.name}-${i}`} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                <span>{tb.name}</span>
                <Badge variant="secondary">{tb.count}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {inProgress ? (
            <Button
              size="lg"
              className="press"
              onClick={() => navigate({ to: "/examen-sesion/$sessionId", params: { sessionId: inProgress.id } })}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reanudar intento
            </Button>
          ) : (
            <Button size="lg" className="press" onClick={onStart} disabled={starting}>
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {starting ? "Generando…" : "Comenzar simulacro"}
            </Button>
          )}
        </div>
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-bold">Intentos anteriores</h3>
          <div className="mt-3 space-y-2">
            {done.map((a: any) => (
              <Link
                key={a.id}
                to="/examen-sesion/$sessionId/resultado"
                params={{ sessionId: a.id }}
                className="flex items-center justify-between rounded-md border border-border bg-card p-3 hover:border-primary/40"
              >
                <div>
                  <p className="text-sm font-medium">{new Date(a.started_at).toLocaleString("es-PE")}</p>
                  <p className="text-xs text-muted-foreground">{a.score ?? 0}% · {a.total} preguntas</p>
                </div>
                <span className="text-sm text-primary">Ver resultado →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
