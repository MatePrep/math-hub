import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listTopics } from "@/lib/exercises.functions";

const topicsQO = queryOptions({ queryKey: ["topics"], queryFn: () => listTopics() });

export const Route = createFileRoute("/temas/")({
  head: () => ({
    meta: [
      { title: "Temas · MatePre" },
      {
        name: "description",
        content: "Explora ejercicios de matemáticas organizados por tema y subtema.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(topicsQO),
  component: TopicsIndex,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function TopicsIndex() {
  const { data: topics } = useSuspenseQuery(topicsQO);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Temas</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Elige un tema para ver sus subtemas y practicar ejercicios.
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <Link
            key={t.id}
            to="/temas/$slug"
            params={{ slug: t.slug }}
            className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{t.name}</h2>
              <span className="text-xs text-muted-foreground">{t.exerciseCount} ej.</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
            <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
              Ver subtemas →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
