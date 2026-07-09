import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, ListChecks, ArrowRight } from "lucide-react";
import { listPublishedExams } from "@/lib/exams.functions";

export const Route = createFileRoute("/examenes-oficiales")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exámenes cronometrados · MatePre" },
      {
        name: "description",
        content: "Practica exámenes cronometrados con corrección automática y revisión detallada.",
      },
    ],
  }),
  component: ExamsList,
});

function ExamsList() {
  const fn = useServerFn(listPublishedExams);
  const q = useQuery({ queryKey: ["public-exams"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Exámenes cronometrados</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Rinde exámenes con tiempo real, corrección automática y revisión paso a paso.
        </p>
      </header>

      {q.isLoading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-5 motion-reduce:animate-none"
            >
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-3.5 w-full rounded bg-muted" />
              <div className="mt-4 h-6 w-24 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}
      {q.data?.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Aún no hay exámenes publicados.
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((e: any, i: number) => (
          <div
            key={e.id}
            className="animate-fade-up flex flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
            style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
          >
            <h2 className="font-display text-lg font-bold">{e.title}</h2>
            {e.description && (
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                <Timer className="mr-1 h-3 w-3" /> {e.time_limit_min} min
              </Badge>
              <Badge variant="outline">
                <ListChecks className="mr-1 h-3 w-3" /> {e.questionCount} preguntas
              </Badge>
              <Badge variant="outline">Aprobación: {e.passing_score}%</Badge>
            </div>
            <Button asChild className="press mt-4 self-start">
              <Link to="/examen/$id" params={{ id: e.id }}>
                Comenzar examen <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
