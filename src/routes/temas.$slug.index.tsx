import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getTopicBySlug, listExercises } from "@/lib/exercises.functions";
import { ExerciseCard } from "@/components/exercise-card";
import { Badge } from "@/components/ui/badge";

const searchSchema = z.object({
  difficulty: fallback(z.enum(["all", "facil", "medio", "dificil"]), "all").default("all"),
});

const topicQO = (slug: string) =>
  queryOptions({ queryKey: ["topic", slug], queryFn: () => getTopicBySlug({ data: { slug } }) });

const exercisesQO = (slug: string, difficulty?: "facil" | "medio" | "dificil") =>
  queryOptions({
    queryKey: ["exercises", "topic", slug, difficulty ?? "all"],
    queryFn: () =>
      listExercises({
        data: { topicSlug: slug, difficulty, limit: 100 },
      }),
  });

export const Route = createFileRoute("/temas/$slug/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ difficulty: search.difficulty }),
  loader: async ({ context, params, deps }) => {
    const topic = await context.queryClient.ensureQueryData(topicQO(params.slug));
    if (!topic) throw notFound();
    const diff = deps.difficulty === "all" ? undefined : deps.difficulty;
    await context.queryClient.ensureQueryData(exercisesQO(params.slug, diff));
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Temas · MatePre` },
      { name: "description", content: `Ejercicios de ${params.slug} con solución paso a paso.` },
    ],
  }),
  component: TopicPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="font-display text-2xl font-bold">Tema no encontrado</h2>
      <Link to="/temas" className="mt-4 inline-block text-primary hover:underline">
        Volver a temas
      </Link>
    </div>
  ),
});

const diffs = [
  { v: "all", label: "Todos" },
  { v: "facil", label: "Fácil" },
  { v: "medio", label: "Medio" },
  { v: "dificil", label: "Difícil" },
] as const;

function TopicPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: topic } = useSuspenseQuery(topicQO(slug));
  const { data: exercises } = useSuspenseQuery(
    exercisesQO(slug, search.difficulty === "all" ? undefined : search.difficulty),
  );

  if (!topic) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground" aria-label="Migas">
        <Link to="/temas" className="hover:underline">
          Temas
        </Link>{" "}
        / <span className="text-foreground">{topic.name}</span>
      </nav>
      <header className="mt-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{topic.name}</h1>
        {topic.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{topic.description}</p>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subtemas
          </h2>
          <ul className="mt-3 space-y-1">
            {topic.subtopics.map((s) => (
              <li key={s.id}>
                <Link
                  to="/temas/$slug/$subtopic"
                  params={{ slug: topic.slug, subtopic: s.slug }}
                  className="block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dificultad:
            </span>
            {diffs.map((d) => (
              <Link
                key={d.v}
                from={Route.fullPath}
                to="."
                search={(prev) => ({ ...prev, difficulty: d.v })}
                className="rounded-full"
              >
                <Badge
                  variant={search.difficulty === d.v ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {d.label}
                </Badge>
              </Link>
            ))}
          </div>
          {exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay ejercicios con esos filtros.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {exercises.map((ex: any) => (
                <ExerciseCard key={ex.id} ex={ex} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
