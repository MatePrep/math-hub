import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTopics, listUniversities } from "@/lib/exercises.functions";

const topicsQO = queryOptions({
  queryKey: ["topics"],
  queryFn: () => listTopics(),
});
const uniQO = queryOptions({
  queryKey: ["universities"],
  queryFn: () => listUniversities(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatePre — Práctica de matemáticas para preuniversitarios" },
      {
        name: "description",
        content:
          "Practica matemáticas con ejercicios resueltos paso a paso y prepárate para UNI, San Marcos, PUCP y más.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(topicsQO);
    context.queryClient.ensureQueryData(uniQO);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function Index() {
  const { data: topics } = useSuspenseQuery(topicsQO);
  const { data: unis } = useSuspenseQuery(uniQO);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Para preuniversitarios del Perú
            </span>
            <h1 className="mt-5 text-balance font-display font-bold leading-[0.95] tracking-[-0.03em] text-[clamp(2.75rem,2rem+4vw,5.25rem)]">
              Domina las matemáticas <span className="text-primary">paso a paso</span> rumbo a tu
              universidad.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Cientos de ejercicios organizados por tema, dificultad y examen de admisión. Practica,
              entiende y mide tu progreso.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="min-h-11">
                <Link to="/temas">
                  Empezar a practicar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11">
                <Link to="/examenes">Ver exámenes de admisión</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-4 sm:max-w-md">
              <Stat label="Temas" value={topics.length} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <Stat label="Ejercicios" value={topics.reduce((s, t) => s + t.exerciseCount, 0)} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <Stat label="Universidades" value={unis.length} />
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ejercicio del día
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold">Álgebra · Cuadráticas</h3>
                <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
                  Halla las raíces reales de <em>x² − 5x + 6 = 0</em>.
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {["1 y 6", "2 y 3", "−2 y −3", "−1 y −6"].map((c, i) => (
                    <li
                      key={i}
                      className={`rounded-lg border px-3 py-2 ${
                        i === 1
                          ? "border-success/40 bg-success/10 font-medium text-success"
                          : "border-border bg-background"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  ✓ Solución paso a paso disponible al resolver.
                </p>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 hidden h-16 w-16 rotate-12 rounded-2xl bg-accent text-accent-foreground shadow-lg sm:grid sm:place-items-center">
              <span className="font-display text-2xl font-bold">π</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold">Organizado por tu universidad</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              UNI, San Marcos, PUCP, UNALM y UNFV tienen exámenes distintos. Practica con preguntas
              reales de la tuya, incluido el modo simulacro cronometrado.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {unis.map((u) => (
                <Badge key={u.id} variant="outline">
                  {u.short_name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <MiniFeature
              icon={<BookOpen className="h-4 w-4" />}
              title="Por tema y subtema"
              text="Álgebra, Geometría, Trigonometría, Aritmética, Razonamiento y Cálculo, con subtemas detallados."
            />
            <MiniFeature
              icon={<Target className="h-4 w-4" />}
              title="Sigue tu progreso"
              text="Aciertos por tema, racha diaria y recomendación del próximo tema a reforzar."
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Temas</h2>
          <Link to="/temas" className="text-sm font-medium text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link
              key={t.id}
              to="/temas/$slug"
              params={{ slug: t.slug }}
              className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{t.name}</h3>
                <span className="text-xs text-muted-foreground">{t.exerciseCount} ej.</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
                Practicar →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Universities */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Exámenes de admisión</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Prepárate con preguntas reales y de práctica para las principales universidades del
            Perú.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unis.map((u) => (
              <Link
                key={u.id}
                to="/examenes/$slug"
                params={{ slug: u.slug }}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold">
                    {u.short_name.slice(0, 3)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold">{u.short_name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{u.name}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{u.exerciseCount} ejercicios</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="font-display text-base font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
