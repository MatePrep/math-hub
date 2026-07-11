import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FileText,
  Shuffle,
  BookOpen,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTopics, listUniversities } from "@/lib/exercises.functions";
import { listPublishedExams } from "@/lib/exams.functions";
import { AnswerSheetWidget } from "@/components/landing/answer-sheet-widget";
import { dailyExerciseQO } from "@/lib/daily-exercise.functions";
import { UniversityMarquee } from "@/components/landing/university-marquee";
import { TrustPill } from "@/components/landing/trust-pill";
import { cn } from "@/lib/utils";
import { useInViewOnce } from "@/hooks/use-in-view-once";

const topicsQO = queryOptions({ queryKey: ["topics"], queryFn: () => listTopics() });
const uniQO = queryOptions({ queryKey: ["universities"], queryFn: () => listUniversities() });
const examsQO = queryOptions({
  queryKey: ["published-exams", "all"],
  queryFn: () => listPublishedExams({ data: {} }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admi-Tec — Práctica de matemáticas para preuniversitarios" },
      {
        name: "description",
        content:
          "Exámenes oficiales, simulacros ilimitados y ranking anónimo para tu admisión a la UNI, San Marcos, PUCP y más.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(topicsQO);
    context.queryClient.ensureQueryData(uniQO);
    context.queryClient.ensureQueryData(examsQO);
    context.queryClient.ensureQueryData(dailyExerciseQO);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const FEATURES: Array<{
  letter: "A" | "B" | "C" | "D";
  icon: LucideIcon;
  title: string;
  text: string;
}> = [
  {
    letter: "A",
    icon: FileText,
    title: "Exámenes oficiales",
    text: "Preguntas reales de procesos de admisión anteriores, ordenadas por universidad y año exacto.",
  },
  {
    letter: "B",
    icon: Shuffle,
    title: "Simulacros ilimitados",
    text: "Preguntas aleatorias generadas según la distribución real de temas de tu examen. Repite las veces que quieras.",
  },
  {
    letter: "C",
    icon: BookOpen,
    title: "Práctica por tema",
    text: "Sin cronómetro. Resuelve a tu ritmo y revisa la solución paso a paso apenas respondes.",
  },
  {
    letter: "D",
    icon: Target,
    title: "Seguimiento de progreso",
    text: "Metas semanales, tu historial completo y los subtemas que más caen en el examen de tu universidad.",
  },
];

const LEADERBOARD = [
  { rank: 1, handle: "Vector_Andino", score: 96 },
  { rank: 2, handle: "RaízDe2", score: 94 },
  { rank: 3, handle: "Postulante_UNI19", score: 93 },
  { rank: 4, handle: "MatrizPeru", score: 91 },
  { rank: 5, handle: "Asíntota_04", score: 89 },
];

function Index() {
  const { data: topics } = useSuspenseQuery(topicsQO);
  const { data: unis } = useSuspenseQuery(uniQO);
  const { data: exams } = useSuspenseQuery(examsQO);
  const totalExercises = topics.reduce((s, t) => s + t.exerciseCount, 0);
  const { ref: rankingRef, visible: rankingVisible } = useInViewOnce<HTMLDivElement>();

  return (
    <div className="at">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <TrustPill>Preparación para todas las universidades</TrustPill>
            <h1 className="mt-5 text-balance text-[clamp(2.5rem,1.9rem+3.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              Cuando llegues a tu examen,{" "}
              <span className="text-primary">ya lo habrás resuelto.</span>
            </h1>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Admi-Tec convierte los exámenes oficiales de admisión en práctica diaria: simulacros
              cronometrados, ejercicios resueltos paso a paso y el avance exacto que necesitas para
              llegar a la UNI, San Marcos, PUCP o tu universidad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="press min-h-11">
                <Link to="/temas">
                  Empezar a practicar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="press min-h-11">
                <Link to="/examenes">Ver exámenes oficiales</Link>
              </Button>
            </div>
            <TrustPill className="mt-4">Gratis para crear tu cuenta, sin tarjeta</TrustPill>
            <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-4 sm:max-w-md">
              <HeroStat label="Ejercicios" value={totalExercises} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <HeroStat label="Temas" value={topics.length} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <HeroStat label="Universidades" value={unis.length} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <AnswerSheetWidget />
          </div>
        </div>
      </section>

      {/* University marquee */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5">
          <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:block">
            Preparación oficial para
          </span>
          <UniversityMarquee universities={unis} />
        </div>
      </section>

      {/* Features A/B/C/D */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-xl">
          <h2 className="text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
            ¿Cómo se prepara alguien que sí va a ingresar?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Marca todas las que apliquen — porque en Admi-Tec, las cuatro son parte del mismo plan.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.letter} className="flex gap-4 rounded-lg border border-border bg-card p-6">
              <span className="font-data grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/40 text-base font-bold text-primary">
                {f.letter}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <f.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                </div>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:grid-cols-4">
          <BigStat value={totalExercises} label="Ejercicios resueltos y explicados" />
          <BigStat value={exams.length} label="Exámenes oficiales" />
          <BigStat value={unis.length} label="Universidades cubiertas" />
          <BigStat value={topics.length} label="Temas y subtemas" />
        </div>
      </section>

      {/* Ranking / community */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Trophy className="h-4 w-4" /> Ranking anónimo
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
              Compite sin exponer tu nombre.
            </h2>
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">
              Compara tu desempeño con otros postulantes a tu misma universidad, con seudónimo y
              solo con los últimos 3 meses de actividad. Nadie ve tu nombre real — ni siquiera
              nosotros lo mostramos.
            </p>
            <Button asChild variant="outline" className="press mt-6">
              <Link to="/ranking">
                Ver ranking completo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div ref={rankingRef} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                UNI · Últimos 3 meses
              </span>
              <span className="font-data text-[0.7rem] text-muted-foreground">Precisión</span>
            </div>
            <ul>
              {LEADERBOARD.map((row, i) => (
                <li
                  key={row.rank}
                  className={cn(
                    rankingVisible && "animate-fade-up",
                    "flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0",
                  )}
                  style={
                    rankingVisible ? ({ "--i": Math.min(i, 10) } as React.CSSProperties) : undefined
                  }
                >
                  <span className="font-data w-5 text-sm text-muted-foreground">{row.rank}</span>
                  <span className="flex-1 text-sm font-medium">{row.handle}</span>
                  <span className="font-data text-sm font-semibold tabular-nums">{row.score}%</span>
                </li>
              ))}
              <li
                className={cn(
                  rankingVisible && "animate-fade-up",
                  "flex items-center gap-3 border-t border-primary/30 bg-primary/5 px-5 py-3",
                )}
                style={
                  rankingVisible
                    ? ({ "--i": Math.min(LEADERBOARD.length, 10) } as React.CSSProperties)
                    : undefined
                }
              >
                <span className="font-data w-5 text-sm text-primary">27</span>
                <span className="flex-1 text-sm font-medium text-primary">Tú</span>
                <span className="font-data text-sm font-semibold tabular-nums text-primary">
                  81%
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center">
          <TrustPill>Únete en menos de un minuto</TrustPill>
          <h2 className="text-balance text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-bold tracking-[-0.03em]">
            Tu próximo simulacro puede empezar ahora mismo.
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            Crea tu cuenta gratis y elige tu universidad. Sin tarjeta, sin compromiso.
          </p>
          <Button asChild size="lg" className="press min-h-11">
            <Link to="/auth">
              Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-data text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div className={cn("text-center sm:text-left")}>
      <div className="font-data text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-pretty text-muted-foreground sm:text-sm">{label}</div>
    </div>
  );
}
