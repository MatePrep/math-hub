import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, ListChecks } from "lucide-react";
import { getUniversityBySlug } from "@/lib/exercises.functions";
import { listPublishedExams } from "@/lib/exams.functions";

const uniQO = (slug: string) =>
  queryOptions({
    queryKey: ["university", slug],
    queryFn: () => getUniversityBySlug({ data: { slug } }),
  });

const examsQO = (slug: string) =>
  queryOptions({
    queryKey: ["published-exams", slug],
    queryFn: () => listPublishedExams({ data: { universitySlug: slug } }),
    staleTime: 1000 * 60 * 5,
  });

export const Route = createFileRoute("/examenes/$slug/")({
  loader: async ({ context, params }) => {
    const u = await context.queryClient.ensureQueryData(uniQO(params.slug));
    if (!u) throw notFound();
    await context.queryClient.ensureQueryData(examsQO(params.slug));
  },
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · Exámenes oficiales · MatePre` }] }),
  component: UniPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="font-display text-2xl font-bold">Universidad no encontrada</h2>
      <Link to="/examenes" className="mt-4 inline-block text-primary hover:underline">
        Ver exámenes
      </Link>
    </div>
  ),
});

function UniPage() {
  const { slug } = Route.useParams();
  const { data: u } = useSuspenseQuery(uniQO(slug));
  const { data: exams } = useSuspenseQuery(examsQO(slug));

  if (!u) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes" className="hover:underline">Exámenes</Link>{" "}
        / <span className="text-foreground">{u.short_name}</span>
      </nav>

      <div className="mt-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{u.name}</h1>
        {u.description && <p className="mt-2 max-w-2xl text-muted-foreground">{u.description}</p>}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold">Exámenes oficiales</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            {(exams ?? []).length} exámenes
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Exámenes con preguntas fijas definidas por el equipo. Puedes rendir cada examen las veces que quieras.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(exams ?? []).length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
              Aún no hay exámenes oficiales publicados para esta universidad.
            </div>
          ) : (
            (exams ?? []).map((exam: any) => (
              <div key={exam.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold">{exam.title}</h3>
                {exam.description && (
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{exam.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {exam.time_limit_min} min</Badge>
                  <Badge variant="outline"><ListChecks className="mr-1 h-3 w-3" /> {exam.questionCount} preguntas</Badge>
                </div>
                <Button asChild size="sm" className="mt-4 self-start">
                  <Link to="/examen/$id" params={{ id: exam.id }}>Ver examen →</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
