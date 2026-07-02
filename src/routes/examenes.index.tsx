import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listUniversities } from "@/lib/exercises.functions";

const qo = queryOptions({ queryKey: ["universities"], queryFn: () => listUniversities() });

export const Route = createFileRoute("/examenes/")({
  head: () => ({
    meta: [
      { title: "Exámenes de admisión · MatePre" },
      {
        name: "description",
        content: "Practica ejercicios reales de UNI, San Marcos, PUCP, UNALM y UNFV.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: ExamHub,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function ExamHub() {
  const { data: unis } = useSuspenseQuery(qo);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Exámenes de admisión</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Elige una universidad para practicar ejercicios o iniciar un simulacro cronometrado.
        </p>
      </header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {unis.map((u) => (
          <Link
            key={u.id}
            to="/examenes/$slug"
            params={{ slug: u.slug }}
            className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-sm font-bold">
                {u.short_name.slice(0, 4)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold">{u.short_name}</h2>
                <p className="truncate text-xs text-muted-foreground">{u.name}</p>
              </div>
            </div>
            {u.description && (
              <p className="mt-3 text-sm text-muted-foreground">{u.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
