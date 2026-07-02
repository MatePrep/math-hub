import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUniversityBySlug, listExercises } from "@/lib/exercises.functions";
import { listPublishedExams, startRandomExamSession } from "@/lib/exams.functions";
import { Timer, ListChecks } from "lucide-react";

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
const examsQO = (slug: string) =>
  queryOptions({
    queryKey: ["published-exams", slug],
    queryFn: () => listPublishedExams({ data: { universitySlug: slug } }),
    staleTime: 1000 * 60 * 5,
  });

export const Route = createFileRoute("/examenes/$slug/simulacro")({
  loader: async ({ context, params }) => {
    const u = await context.queryClient.ensureQueryData(uniQO(params.slug));
    if (!u) throw notFound();
    await context.queryClient.ensureQueryData(exQO(params.slug));
    await context.queryClient.ensureQueryData(examsQO(params.slug));
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

function Simulacro() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: u } = useSuspenseQuery(uniQO(slug));
  const { data: exercises } = useSuspenseQuery(exQO(slug));
  const publishedExams = useSuspenseQuery(examsQO(slug)).data ?? [];
  const startRandomFn = useServerFn(startRandomExamSession);
  const [starting, setStarting] = useState(false);

  const exerciseCount = exercises.length;
  const estimatedMinutes = Math.max(1, Math.round((exerciseCount * 90) / 60));

  async function onStartRandom() {
    setStarting(true);
    try {
      const { sessionId } = await startRandomFn({ data: { universitySlug: slug } });
      navigate({ to: "/examen-sesion/$sessionId", params: { sessionId } });
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo iniciar el simulacro aleatorio.");
    } finally {
      setStarting(false);
    }
  }

  if (!u) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/examenes" className="hover:underline">Exámenes</Link> / <span className="text-foreground">{u.short_name}</span>
      </nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Simulacro {u.short_name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Elige un examen oficial preparado por el equipo o genera un simulacro aleatorio con las preguntas disponibles para esta universidad.
          </p>

          <div className="mt-8 space-y-6">
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Simulacro aleatorio</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Genera un examen con preguntas seleccionadas al azar. Estimado {estimatedMinutes} minutos.
                  </p>
                </div>
                <Button size="lg" onClick={onStartRandom} disabled={starting}>
                  {starting ? "Iniciando…" : "Generar simulacro"}
                </Button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">Exámenes oficiales</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Elige un examen definido por el equipo para rendir la versión oficial.
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {publishedExams.length} exámenes
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {publishedExams.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                    Aún no hay exámenes oficiales publicados para esta universidad.
                  </div>
                ) : (
                  publishedExams.map((exam: any) => (
                    <div key={exam.id} className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-medium">{exam.title}</h3>
                      {exam.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{exam.description}</p>}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{exam.time_limit_min} min</Badge>
                        <Badge variant="outline"><ListChecks className="mr-1 inline h-3 w-3" />{exam.questionCount} preguntas</Badge>
                        <Badge variant="outline" className="capitalize">{exam.question_order === "random" ? "Aleatorio" : "Fijo"}</Badge>
                      </div>
                      <Button asChild size="sm" className="mt-4">
                        <Link to="/examen/$id" params={{ id: exam.id }}>Ver examen</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Información</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{exerciseCount} ejercicios disponibles en esta universidad.</p>
              <p>Los exámenes oficiales respetan la selección y el orden definidos por el equipo.</p>
              <p>El simulacro aleatorio genera una nueva sesión con preguntas disponibles cada vez.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold">Consejos</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Lee cada pregunta con cuidado antes de responder.</li>
              <li>En un examen oficial, el orden puede ser fijo o aleatorio según su configuración.</li>
              <li>Si no estás autenticado, inicia sesión para poder guardar y enviar tu simulacro.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
