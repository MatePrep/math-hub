import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { MathText, ChoiceText } from "@/lib/math-render";
import { getExamResult } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/examen-sesion/$sessionId/resultado")({
  component: ResultPage,
});

function ResultPage() {
  const { sessionId } = Route.useParams();
  const fn = useServerFn(getExamResult);
  const q = useQuery({ queryKey: ["exam-result", sessionId], queryFn: () => fn({ data: { sessionId } }) });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Cargando…</div>;
  if (!q.data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center">No encontrado.</div>;

  const s: any = q.data.session;
  const questions: any[] = q.data.questions;
  const answers = (s.answers as Record<string, number>) ?? {};
  const passing = s.exam?.passing_score ?? 60;
  const score = s.score ?? 0;
  const passed = score >= passing;
  const correctCount = questions.filter((ex) => answers[ex.id] === ex.correct_choice).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes-oficiales" className="hover:underline">Exámenes</Link>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-bold">Resultado</h1>
      <p className="text-muted-foreground">{s.exam?.title}</p>

      <div className={`mt-4 rounded-xl border p-6 ${passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
        <p className="text-sm text-muted-foreground">Puntaje</p>
        <p className={`mt-1 font-display text-5xl font-bold ${passed ? "text-success" : "text-destructive"}`}>{score}%</p>
        <p className="mt-1 text-sm">
          {correctCount} de {questions.length} correctas · {passed ? "Aprobado" : `Aprobación: ${passing}%`}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-bold">Revisión</h2>
        {questions.map((ex: any, i: number) => {
          const selected = answers[ex.id];
          const correct = ex.correct_choice;
          const isCorrect = selected === correct;
          const unanswered = selected === undefined;
          return (
            <div key={ex.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{i + 1}</Badge>
                {unanswered ? (
                  <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground"><MinusCircle className="mr-1 h-3 w-3" /> Sin responder</Badge>
                ) : isCorrect ? (
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> Correcta</Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive"><XCircle className="mr-1 h-3 w-3" /> Incorrecta</Badge>
                )}
              </div>
              <div className="mt-3 text-sm"><MathText text={ex.statement_md} /></div>
              <ul className="mt-4 space-y-1 text-sm">
                {(ex.choices as string[]).map((c, ci) => {
                  const isSel = selected === ci;
                  const isCor = correct === ci;
                  return (
                    <li key={ci} className={`rounded-md border px-3 py-2 ${
                      isCor ? "border-success/50 bg-success/10" :
                      isSel ? "border-destructive/50 bg-destructive/10" :
                      "border-border"
                    }`}>
                      <span className="mr-2 font-semibold">{String.fromCharCode(65 + ci)}.</span>
                      <ChoiceText text={c} />
                    </li>
                  );
                })}
              </ul>

              <details className="mt-3" open>
                <summary className="cursor-pointer text-sm font-medium text-primary">Solución paso a paso</summary>
                <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                  {ex.solution_md ? (
                    <MathText text={ex.solution_md} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay solución disponible para este ejercicio.</p>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-2">
        <Button asChild variant="outline"><Link to="/examenes-oficiales">Volver a exámenes</Link></Button>
        <Button asChild><Link to="/panel">Ir a mi panel</Link></Button>
      </div>
    </div>
  );
}
