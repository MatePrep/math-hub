import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, RotateCcw } from "lucide-react";
import { getExamPreview, getMyExamAttempts, startExamSession } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/examen/$id")({
  component: ExamPreview,
});

function ExamPreview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const previewFn = useServerFn(getExamPreview);
  const attemptsFn = useServerFn(getMyExamAttempts);
  const startFn = useServerFn(startExamSession);
  const [starting, setStarting] = useState(false);

  const preview = useQuery({ queryKey: ["exam-preview", id], queryFn: () => previewFn({ data: { id } }) });
  const attempts = useQuery({ queryKey: ["exam-attempts", id], queryFn: () => attemptsFn({ data: { examId: id } }) });

  async function onStart() {
    setStarting(true);
    try {
      const { sessionId } = await startFn({ data: { examId: id } });
      navigate({ to: "/examen-sesion/$sessionId", params: { sessionId } });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar");
    } finally {
      setStarting(false);
    }
  }

  if (preview.isLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Cargando…</div>;
  if (!preview.data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p>Examen no disponible.</p><Link to="/examenes-oficiales" className="mt-4 inline-block text-primary hover:underline">Volver</Link></div>;

  const e: any = preview.data;
  const done = (attempts.data ?? []).filter((a: any) => a.status === "graded" || a.status === "submitted");
  const inProgress = (attempts.data ?? []).find((a: any) => a.status === "in_progress");
  const reachedMax = e.max_attempts ? done.length >= e.max_attempts : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes-oficiales" className="hover:underline">Exámenes</Link> / <span className="text-foreground">{e.title}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-bold">{e.title}</h1>
      {e.description && <p className="mt-2 text-muted-foreground">{e.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {e.time_limit_min} min</Badge>
        <Badge variant="outline">{e.questionCount} preguntas</Badge>
        <Badge variant="outline">Aprobación: {e.passing_score}%</Badge>
        {e.max_attempts && <Badge variant="outline">Intentos: {done.length}/{e.max_attempts}</Badge>}
        <Badge variant="outline" className="capitalize">Orden: {e.question_order === "random" ? "aleatorio" : "fijo"}</Badge>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Instrucciones</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Al iniciar comienza el cronómetro. Si el tiempo termina, el examen se envía automáticamente.</li>
          <li>Puedes marcar preguntas para revisarlas después.</li>
          <li>Tus respuestas se guardan automáticamente.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {inProgress ? (
            <Button size="lg" onClick={() => navigate({ to: "/examen-sesion/$sessionId", params: { sessionId: inProgress.id } })}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reanudar intento
            </Button>
          ) : (
            <Button size="lg" onClick={onStart} disabled={starting || reachedMax}>
              <Play className="mr-2 h-4 w-4" /> {starting ? "Iniciando…" : reachedMax ? "Sin intentos disponibles" : "Iniciar examen"}
            </Button>
          )}
        </div>
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-bold">Intentos anteriores</h3>
          <div className="mt-3 space-y-2">
              {done.map((a: any) => (
                <Link key={a.id} to="/examen-sesion/$sessionId/resultado" params={{ sessionId: a.id }} className="flex items-center justify-between rounded-md border border-border bg-card p-3 hover:border-primary/40">
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
