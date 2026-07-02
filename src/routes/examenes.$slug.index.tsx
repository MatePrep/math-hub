import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getUniversityBySlug } from "@/lib/exercises.functions";
import { listMyUniversityExamSessions } from "@/lib/exams.functions";

const uniQO = (slug: string) =>
  queryOptions({
    queryKey: ["university", slug],
    queryFn: () => getUniversityBySlug({ data: { slug } }),
  });

const sessionsQO = (slug: string) =>
  queryOptions({
    queryKey: ["my-university-sessions", slug],
    queryFn: () => listMyUniversityExamSessions({ data: { universitySlug: slug } }),
    staleTime: 1000 * 60 * 2,
  });

export const Route = createFileRoute("/examenes/$slug/")({
  loader: async ({ context, params }) => {
    const u = await context.queryClient.ensureQueryData(uniQO(params.slug));
    if (!u) throw notFound();
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
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const { data: u } = useSuspenseQuery(uniQO(slug));
  const sessionsFn = useServerFn(listMyUniversityExamSessions);
  const sessionsQuery = useQuery({
    queryKey: ["my-university-sessions", slug],
    queryFn: () => sessionsFn({ data: { universitySlug: slug } }),
    enabled: signedIn === true,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted) setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!u) return null;

  const sessions = sessionsQuery.data ?? [];

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
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Simulacro</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Genera un examen con preguntas seleccionadas al azar de esta universidad. Tus respuestas se guardan automáticamente y podrás retomar el examen si no lo envías.
            </p>
            <div className="mt-4">
              <Button asChild size="lg" className="min-h-11">
                <Link to="/examenes/$slug/simulacro" params={{ slug: u.slug }}>
                  <Timer className="mr-2 h-4 w-4" /> Iniciar simulacro
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Tus últimas sesiones</h2>
            {signedIn === null ? (
              <p className="mt-3 text-sm text-muted-foreground">Cargando estado de sesión...</p>
            ) : signedIn === false ? (
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <p>No estás conectado. Inicia sesión para ver y reanudar tus simulacros.</p>
                <Button asChild size="sm" className="min-h-11">
                  <Link to="/auth">Ingresar</Link>
                </Button>
              </div>
            ) : sessionsQuery.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Cargando tus sesiones...</p>
            ) : sessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Aún no tienes simulacros registrados para esta universidad.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sessions.map((session: any) => (
                  <div key={session.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{session.status === "in_progress" ? "En progreso" : "Completado"}</p>
                        <p className="text-sm text-muted-foreground">
                          Iniciado {new Date(session.started_at).toLocaleString("es-PE")}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{session.total ?? 0} preguntas</p>
                        {session.score !== null && <p>{session.score}%</p>}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.status === "in_progress" ? (
                        <Button size="sm" onClick={() => navigate({ to: "/examen-sesion/$sessionId", params: { sessionId: session.id } })}>
                          Reanudar
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/examen-sesion/$sessionId/resultado" params={{ sessionId: session.id }}>
                            Ver resultado
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Información</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Los simulacros aleatorios usan preguntas de esta universidad y se pueden retomar si no se envían.</p>
              <p>Después de enviar, verás tu puntaje y revisión detallada.</p>
              <p>Si no estás autenticado, inicia sesión para conservar tus intentos.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
