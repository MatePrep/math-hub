import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, MinusCircle, Clock, Users } from "lucide-react";
import { MathText, ChoiceText } from "@/lib/math-render";
import { getExamResult } from "@/lib/exams.functions";
import { getExamStats } from "@/lib/goals.functions";

export const Route = createFileRoute("/_authenticated/examen-sesion/$sessionId/resultado")({
  component: ResultPage,
});

function ResultPage() {
  const { sessionId } = Route.useParams();
  const fn = useServerFn(getExamResult);
  const statsFn = useServerFn(getExamStats);
  const q = useQuery({ queryKey: ["exam-result", sessionId], queryFn: () => fn({ data: { sessionId } }) });

  const examId: string | null = q.data?.session?.exam_id ?? null;
  const myScorePct: number | null = q.data?.session?.score ?? null;
  const statsQ = useQuery({
    queryKey: ["exam-stats", examId, myScorePct],
    queryFn: () => statsFn({ data: { examId: examId as string, myScorePct } }),
    enabled: !!examId,
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Cargando…</div>;
  if (!q.data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center">No encontrado.</div>;

  const s: any = q.data.session;
  const questions: any[] = q.data.questions;
  const answers = (s.answers as Record<string, number>) ?? {};
  const passing = s.exam?.passing_score ?? 60;
  const score = s.score ?? 0;
  const passed = score >= passing;
  const correctCount = questions.filter((ex) => answers[ex.id] === ex.correct_choice).length;
  const totalQuestions = questions.length;
  const incorrectCount = totalQuestions - correctCount;
  const timeLimitMin = s.time_limit_min ?? s.exam?.time_limit_min ?? null;
  const timeTakenSeconds = s.finished_at && s.started_at ? (new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000 : null;
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const selectedQuestion = questions[selectedQuestionIndex];
  const selectedAnswer = answers[selectedQuestion.id];
  const selectedCorrect = selectedQuestion.correct_choice;
  const selectedUnanswered = selectedAnswer === undefined;
  const scoreStyle = score >= 75 ? "text-success" : score >= 20 ? "text-amber-500" : "text-destructive";
  const scorePanelStyle = score >= 75 ? "border-success/40 bg-success/5" : score >= 20 ? "border-amber-400/40 bg-amber-400/10" : "border-destructive/40 bg-destructive/5";
  function formatDuration(sec: number | null) {
    if (sec === null || sec === undefined) return "-";
    const s = Math.max(0, Math.round(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes-oficiales" className="hover:underline">Exámenes</Link>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-bold">Resultado</h1>
      <p className="text-muted-foreground">{s.exam?.title}</p>

      <div className={`animate-score-in mt-4 rounded-xl border p-6 ${scorePanelStyle}`}>
        <p className="text-sm text-muted-foreground">Puntaje</p>
        <p className={`mt-1 font-display text-5xl font-bold ${scoreStyle}`}>{score}%</p>
        <p className="mt-1 text-sm">
          {correctCount} de {totalQuestions} correctas · {passed ? "Aprobado" : `Aprobación: ${passing}%`}
        </p>
        <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-4">
          <div>
            <div>Correctas: <strong className="text-success">{correctCount}</strong></div>
            <div>Incorrectas: <strong className="text-destructive">{incorrectCount}</strong></div>
          </div>
          <div>
            <div>Tiempo límite: <strong>{timeLimitMin ? `${timeLimitMin} min` : "-"}</strong></div>
            <div>Tiempo tomado: <strong>{formatDuration(timeTakenSeconds)}</strong></div>
          </div>
        </div>
      </div>

      {statsQ.data && statsQ.data.sessions_count > 0 && (
        <div className="animate-alert-in mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Comparación con otros estudiantes</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Tu puntaje</p>
              <p className="font-display text-xl font-bold">{score}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Promedio general</p>
              <p className="font-display text-xl font-bold">{statsQ.data.avg_score}%</p>
            </div>
            {statsQ.data.my_percentile !== null && (
              <div>
                <p className="text-muted-foreground">Tu percentil</p>
                <p className="font-display text-xl font-bold">{statsQ.data.my_percentile}</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Basado en {statsQ.data.sessions_count} intento{statsQ.data.sessions_count !== 1 ? "s" : ""} de este examen. La comparación es anónima.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-xl font-bold">Revisión</h2>
          <p className="mt-2 text-sm text-muted-foreground">Selecciona la pregunta que quieras revisar.</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((ex: any, i: number) => {
              const selected = answers[ex.id];
              const correct = ex.correct_choice;
              const isCorrect = selected === correct;
              const isAnswered = selected !== undefined;
              const isSelected = i === selectedQuestionIndex;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedQuestionIndex(i)}
                  className={`press h-10 rounded-md border text-sm font-semibold transition ${
                    isSelected ? "border-primary bg-primary/10 text-primary" :
                    isCorrect ? "border-success/50 bg-success/10 text-success" :
                    isAnswered ? "border-destructive/50 bg-destructive/10 text-destructive" :
                    "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-success" /> Correcta
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive" /> Incorrecta
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> Sin responder
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div key={selectedQuestion.id} className="animate-card-swap rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Pregunta {selectedQuestionIndex + 1}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUnanswered ? "Sin responder" : selectedAnswer === selectedCorrect ? "Correcta" : "Incorrecta"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedQuestion.time_spent_ms !== null && selectedQuestion.time_spent_ms !== undefined && (
                  <Badge
                    variant="outline"
                    className={
                      selectedQuestion.avg_time_ms && selectedQuestion.time_spent_ms > selectedQuestion.avg_time_ms * 1.5
                        ? "border-amber-500/40 text-amber-600"
                        : ""
                    }
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDuration(selectedQuestion.time_spent_ms / 1000)}
                    {selectedQuestion.avg_time_ms && selectedQuestion.time_spent_ms > selectedQuestion.avg_time_ms * 1.5 ? " · Lento" : ""}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={selectedUnanswered ? "border-muted-foreground text-muted-foreground" : selectedAnswer === selectedCorrect ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}
                >
                  {selectedUnanswered ? "No respondida" : selectedAnswer === selectedCorrect ? "Correcta" : "Incorrecta"}
                </Badge>
              </div>
            </div>
            <div className="mt-3 text-sm"><MathText text={selectedQuestion.statement_md} /></div>
            {selectedQuestion.statement_image_path && (
              <img src={selectedQuestion.statement_image_path} alt="Enunciado" className="mt-4 max-h-96 rounded-md object-contain" />
            )}
            <ul className="mt-4 space-y-2 text-sm">
              {(selectedQuestion.choices as string[]).map((c, ci) => {
                const isSelectedChoice = selectedAnswer === ci;
                const isCorrectChoice = selectedCorrect === ci;
                return (
                  <li
                    key={ci}
                    className={`rounded-md border px-3 py-2 ${
                      isCorrectChoice ? "border-success/50 bg-success/10 text-success" :
                      isSelectedChoice ? "border-destructive/50 bg-destructive/10 text-destructive" :
                      "border-border bg-background text-foreground"
                    }`}
                  >
                    <span className="mr-2 font-semibold">{String.fromCharCode(65 + ci)}.</span>
                    <ChoiceText text={c} />
                  </li>
                );
              })}
            </ul>

            <details className="mt-3" open>
              <summary className="cursor-pointer text-sm font-medium text-primary">Solución paso a paso</summary>
              <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                {selectedQuestion.solution_md ? (
                  <MathText text={selectedQuestion.solution_md} />
                ) : (
                  <p className="text-sm text-muted-foreground">No hay solución disponible para esta pregunta.</p>
                )}
              </div>
            </details>
          </div>
        </section>
      </div>

      <div className="mt-8 flex gap-2">
        <Button asChild variant="outline" className="press"><Link to="/examenes-oficiales">Volver a exámenes</Link></Button>
        <Button asChild className="press"><Link to="/panel">Ir a mi panel</Link></Button>
      </div>
    </div>
  );
}
