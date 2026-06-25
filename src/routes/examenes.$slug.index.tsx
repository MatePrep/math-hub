import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { getUniversityBySlug, listExercises } from "@/lib/exercises.functions";
import { ExerciseCard } from "@/components/exercise-card";

const uniQO = (slug: string) =>
  queryOptions({
    queryKey: ["university", slug],
    queryFn: () => getUniversityBySlug({ data: { slug } }),
  });

const exQO = (slug: string) =>
  queryOptions({
    queryKey: ["exercises", "uni", slug],
    queryFn: () => listExercises({ data: { universitySlug: slug, limit: 100 } }),
  });

export const Route = createFileRoute("/examenes/$slug/")({
  loader: async ({ context, params }) => {
    const u = await context.queryClient.ensureQueryData(uniQO(params.slug));
    if (!u) throw notFound();
    await context.queryClient.ensureQueryData(exQO(params.slug));
  },
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · Examen · MatePre` }] }),
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
  const { data: exercises } = useSuspenseQuery(exQO(slug));
  if (!u) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes" className="hover:underline">
          Exámenes
        </Link>{" "}
        / <span className="text-foreground">{u.short_name}</span>
      </nav>
      <div className="mt-3 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{u.name}</h1>
          {u.description && <p className="mt-2 max-w-2xl text-muted-foreground">{u.description}</p>}
        </div>
        <Button asChild size="lg" className="min-h-11">
          <Link to="/examenes/$slug/simulacro" params={{ slug: u.slug }}>
            <Timer className="mr-2 h-4 w-4" /> Iniciar simulacro
          </Link>
        </Button>
      </div>
      <h2 className="mt-10 font-display text-xl font-bold">
        Ejercicios ({exercises.length})
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {exercises.map((ex: any) => (
          <ExerciseCard key={ex.id} ex={ex} />
        ))}
      </div>
    </div>
  );
}
