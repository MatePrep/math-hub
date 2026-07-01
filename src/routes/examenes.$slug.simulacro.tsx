import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUniversityBySlug, listExercises } from "@/lib/exercises.functions";
import { MathText, ChoiceText } from "@/lib/math-render";
import { Timer, CheckCircle2 } from "lucide-react";

const uniQO = (slug: string) =>
  queryOptions({
    queryKey: ["university", slug],
    queryFn: () => getUniversityBySlug({ data: { slug } }),
  });
const exQO = (slug: string) =>
  queryOptions({
    queryKey: ["sim-exercises", slug],
    queryFn: () => listExercises({ data: { universitySlug: slug, limit: 100 } }),
  });

export const Route = createFileRoute("/examenes/$slug/simulacro")({
  loader: async ({ context, params }) => {
    const u = await context.queryClient.ensureQueryData(uniQO(params.slug));
    if (!u) throw notFound();
    await context.queryClient.ensureQueryData(exQO(params.slug));
  },
  head: ({ params }) => ({ meta: [{ title: `Simulacro ${params.slug} · MatePre` }] }),
  component: Simulacro,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">No encontrado</div>
  ),
});

const PER_QUESTION_SECONDS = 90;

function Simulacro() {
  const { slug } = Route.useParams();
  const { data: u } = useSuspenseQuery(uniQO(slug));
  const { data: exercises } = useSuspenseQuery(exQO(slug));

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    (exercises?.length ?? 0) * PER_QUESTION_SECONDS,
  );

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, secondsLeft]);

  const score = useMemo(() => {
    if (!finished) return 0;
    return exercises.reduce(
      (acc: number, ex: any) => acc + ((answers[ex.id] ?? -1) === ex.correct_choice ? 1 : 0),
      0,
    );
  }, [finished, exercises, answers]);

  if (!u) return null;
  if (exercises.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">No hay ejercicios disponibles para este simulacro.</p>
        <Link to="/examenes" className="mt-4 inline-block text-primary hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Simulacro {u.short_name}</h1>
        <p className="mt-2 text-muted-foreground">
          {exercises.length} preguntas · {Math.round((exercises.length * PER_QUESTION_SECONDS) / 60)}{" "}
          minutos. Sin retroalimentación hasta finalizar.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Recomendaciones</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Trabaja en un lugar sin distracciones.</li>
            <li>Ten papel y lápiz a la mano.</li>
            <li>El tiempo corre apenas pulses "Iniciar".</li>
          </ul>
        </div>
        <Button size="lg" className="mt-6 min-h-11" onClick={() => setStarted(true)}>
          <Timer className="mr-2 h-4 w-4" /> Iniciar simulacro
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Resultado del simulacro</h1>
        <div className="mt-4 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{u.short_name}</p>
          <p className="mt-1 font-display text-5xl font-bold text-primary">
            {score} / {exercises.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {Math.round((score / exercises.length) * 100)}% de aciertos
          </p>
        </div>
        <div className="mt-8 space-y-4">
          {exercises.map((ex: any, i: number) => {
            const selected = answers[ex.id];
            const correct = selected === ex.correct_choice;
            return (
              <div key={ex.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">#{i + 1}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      correct
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-destructive/40 bg-destructive/10 text-destructive"
                    }
                  >
                    {correct ? "Correcto" : selected === undefined ? "Sin responder" : "Incorrecto"}
                  </Badge>
                </div>
                <div className="mt-3 text-sm">
                  <MathText text={ex.statement_md} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Respuesta correcta: <strong>{String.fromCharCode(65 + ex.correct_choice)}</strong>
                </p>
                <Link
                  to="/ejercicio/$id"
                  params={{ id: ex.id }}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ver solución →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const ex: any = exercises[idx];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Pregunta <strong>{idx + 1}</strong> de {exercises.length}
        </p>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Timer className="h-4 w-4" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((idx + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <MathText text={ex.statement_md} />
        <ul className="mt-5 space-y-2">
          {(Array.isArray(ex.choices) ? ex.choices : []).map((c, i) => {
            const picked = answers[ex.id] === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [ex.id]: i }))}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    picked
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="mr-2 font-semibold text-primary">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <ChoiceText text={c} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
          className="min-h-11"
        >
          Anterior
        </Button>
        {idx < exercises.length - 1 ? (
          <Button onClick={() => setIdx((i) => i + 1)} className="min-h-11">
            Siguiente
          </Button>
        ) : (
          <Button onClick={() => setFinished(true)} className="min-h-11">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}
