import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { getUserStats } from "@/lib/attempts.functions";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Flame, Target, ListChecks, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({ meta: [{ title: "Panel · MatePre" }] }),
  component: PanelPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function PanelPage() {
  const fetchStats = useServerFn(getUserStats);
  const qo = useMemo(
    () => queryOptions({ queryKey: ["user-stats"], queryFn: () => fetchStats() }),
    [fetchStats],
  );
  const { data: stats } = useSuspenseQuery(qo);

  const weakest = [...stats.topicStats].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Tu panel</h1>
      <p className="mt-1 text-muted-foreground">Revisa tu progreso y planifica tu próxima sesión.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          label="Ejercicios"
          value={stats.total}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="% Aciertos"
          value={`${stats.accuracy}%`}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Correctos"
          value={stats.correct}
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Racha (días)"
          value={stats.streak}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Aciertos por tema</h2>
          <div className="mt-4 h-64">
            {stats.topicStats.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">
                Aún no tienes intentos. Empieza practicando un{" "}
                <Link to="/temas" className="ml-1 text-primary hover:underline">
                  tema
                </Link>
                .
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topicStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Recomendación</h2>
          {weakest ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu tema más débil es <strong className="text-foreground">{weakest.name}</strong> con{" "}
                {weakest.accuracy}% de aciertos.
              </p>
              <Link
                to="/temas/$slug"
                params={{ slug: weakest.slug }}
                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Practicar {weakest.name}
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Resuelve algunos ejercicios para recibir recomendaciones.
            </p>
          )}
          <Link
            to="/perfil"
            className="mt-6 block text-sm font-medium text-primary hover:underline"
          >
            Editar perfil →
          </Link>
        </aside>
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">Intentos recientes</h2>
        {stats.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Sin intentos todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {stats.recent.map((r) => (
              <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    r.isCorrect ? "bg-success" : "bg-destructive"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-sm">{r.statement || "(ejercicio)"}</p>
                  <p className="text-xs text-muted-foreground">{r.topicName}</p>
                </div>
                {r.exerciseId && (
                  <Link
                    to="/ejercicio/$id"
                    params={{ id: r.exerciseId }}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    Repasar →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
