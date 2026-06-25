import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getExercise, listExercises } from "@/lib/exercises.functions";
import { recordAttempt } from "@/lib/attempts.functions";
import { MathText, ChoiceText } from "@/lib/math-render";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const exQO = (id: string) =>
  queryOptions({ queryKey: ["exercise", id], queryFn: () => getExercise({ data: { id } }) });

const difficultyLabel = { facil: "Fácil", medio: "Medio", dificil: "Difícil" } as const;

export const Route = createFileRoute("/ejercicio/$id")({
  loader: async ({ context, params }) => {
    const ex = await context.queryClient.ensureQueryData(exQO(params.id));
    if (!ex) throw notFound();
  },
  head: () => ({ meta: [{ title: "Ejercicio · MatePre" }] }),
  component: ExercisePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="font-display text-2xl font-bold">Ejercicio no encontrado</h2>
      <Link to="/temas" className="mt-4 inline-block text-primary hover:underline">
        Ver temas
      </Link>
    </div>
  ),
});

function ExercisePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const { data: ex } = useSuspenseQuery(exQO(id));
  const record = useServerFn(recordAttempt);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<{ correct: boolean; correctChoice: number } | null>(
    null,
  );
  const [startedAt] = useState(() => Date.now());
  const [siblings, setSiblings] = useState<string[]>([]);

  // Reset on id change
  useEffect(() => {
    setSelected(null);
    setSubmitted(null);
  }, [id]);

  // Load sibling exercise ids in same topic for prev/next
  useEffect(() => {
    if (!ex?.topic?.slug) return;
    listExercises({ data: { topicSlug: ex.topic.slug, limit: 100 } }).then((rows: any[]) => {
      setSiblings(rows.map((r) => r.id));
    });
  }, [ex?.topic?.slug]);

  if (!ex) return null;

  const choices = ex.choices as string[];

  async function handleVerify() {
    if (selected === null) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast("Inicia sesión para guardar tu progreso", {
        description: "Tu intento no se registrará hasta que ingreses.",
      });
      // still show feedback locally without saving
      setSubmitted({
        correct: selected === ex!.correct_choice,
        correctChoice: ex!.correct_choice,
      });
      return;
    }
    try {
      const res = await record({
        data: {
          exerciseId: ex!.id,
          selectedChoice: selected,
          timeSpentMs: Date.now() - startedAt,
        },
      });
      setSubmitted({ correct: res.isCorrect, correctChoice: res.correctChoice });
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo registrar el intento");
    }
  }

  const curIdx = siblings.indexOf(id);
  const prevId = curIdx > 0 ? siblings[curIdx - 1] : null;
  const nextId = curIdx >= 0 && curIdx < siblings.length - 1 ? siblings[curIdx + 1] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-xs text-muted-foreground">
        {ex.topic && (
          <>
            <Link to="/temas" className="hover:underline">
              Temas
            </Link>{" "}
            /{" "}
            <Link to="/temas/$slug" params={{ slug: ex.topic.slug }} className="hover:underline">
              {ex.topic.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{difficultyLabel[ex.difficulty]}</Badge>
        {ex.subtopic && <Badge variant="secondary">{ex.subtopic.name}</Badge>}
        {ex.university && (
          <Badge variant="outline">
            {ex.university.short_name}
            {ex.exam_year ? ` · ${ex.exam_year}` : ""}
          </Badge>
        )}
      </div>

      <article className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="sr-only">Ejercicio</h1>
        <div className="text-base">
          <MathText text={ex.statement_md} />
        </div>

        <ul className="mt-6 space-y-2" role="radiogroup" aria-label="Alternativas">
          {choices.map((c, i) => {
            const isPicked = selected === i;
            const isAns = submitted && i === submitted.correctChoice;
            const isWrong = submitted && isPicked && !submitted.correct;
            return (
              <li key={i}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={!!submitted}
                  onClick={() => setSelected(i)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition disabled:cursor-default ${
                    isAns
                      ? "border-success/50 bg-success/10 font-medium"
                      : isWrong
                        ? "border-destructive/50 bg-destructive/10"
                        : isPicked
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

        {!submitted ? (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleVerify} disabled={selected === null} className="min-h-11">
              Verificar respuesta
            </Button>
          </div>
        ) : (
          <div
            className={`mt-6 flex items-center gap-2 rounded-lg p-4 text-sm font-medium ${
              submitted.correct
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
            role="status"
          >
            {submitted.correct ? (
              <>
                <CheckCircle2 className="h-5 w-5" /> ¡Correcto! Muy bien.
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" /> Incorrecto. La respuesta correcta es la{" "}
                {String.fromCharCode(65 + submitted.correctChoice)}.
              </>
            )}
          </div>
        )}

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="sol">
            <AccordionTrigger>Ver solución paso a paso</AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg bg-secondary/40 p-4 text-sm">
                <MathText text={ex.solution_md} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </article>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={!prevId}
          onClick={() => prevId && navigate({ to: "/ejercicio/$id", params: { id: prevId } })}
          className="min-h-11"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => router.invalidate()}
          className="min-h-11"
        >
          Reintentar
        </Button>
        <Button
          disabled={!nextId}
          onClick={() => nextId && navigate({ to: "/ejercicio/$id", params: { id: nextId } })}
          className="min-h-11"
        >
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
