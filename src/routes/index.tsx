import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTopics, listUniversities } from "@/lib/exercises.functions";
import { listPublishedExams } from "@/lib/exams.functions";
import { AnswerSheetWidget } from "@/components/landing/answer-sheet-widget";
import { HeroVisual } from "@/components/landing/hero-visual";
import { PillarsSection } from "@/components/landing/pillars";
import { dailyExerciseQO } from "@/lib/daily-exercise.functions";
import { UniversityMarquee } from "@/components/landing/university-marquee";
import { TrustPill } from "@/components/landing/trust-pill";
import { cn } from "@/lib/utils";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { pageMeta, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { PLAN_PRICES, TRIAL_DAYS } from "@/lib/plan";

const topicsQO = queryOptions({ queryKey: ["topics"], queryFn: () => listTopics() });
const uniQO = queryOptions({ queryKey: ["universities"], queryFn: () => listUniversities() });
const examsQO = queryOptions({
  queryKey: ["published-exams", "all"],
  queryFn: () => listPublishedExams({ data: {} }),
});

export const Route = createFileRoute("/")({
  head: () => {
    const base = pageMeta({
      path: "/",
      title: `${SITE_NAME} — Exámenes oficiales, simulacros y ranking`,
      description: SITE_DESCRIPTION,
      rawTitle: true,
    });
    return {
      ...base,
      links: [
        ...base.links,
        // Homepage-hero-only "at" register fonts — see __root.tsx for why these
        // aren't in the global stylesheet link.
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
        },
      ],
    };
  },
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

const LEADERBOARD = [
  { rank: 1, handle: "Vector_123", score: 96 },
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
  const { ref: retoRef, visible: retoVisible } = useInViewOnce<HTMLDivElement>();

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

          <div className="px-2 pb-8 pt-6 lg:px-0">
            <HeroVisual />
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

      {/* Los 3 pilares */}
      <PillarsSection />

      {/* Reto del día */}
      <section className="border-y border-border bg-card/50">
        <div
          ref={retoRef}
          className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center"
        >
          <div className={cn(retoVisible && "animate-fade-up")}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden /> Reto del
              día
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
              Ponte a prueba ahora mismo.
            </h2>
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">
              Cada día publicamos un ejercicio real del banco — el mismo para todos. Resuélvelo
              contra el reloj y compara tus aciertos con los de todos los que lo intentaron hoy.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Sin cuenta y sin excusas: el cronómetro ya está corriendo.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <AnswerSheetWidget />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
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

      {/* Planes teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24">
        <div className="rounded-lg border border-border bg-card px-6 py-12 text-center sm:px-10">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Planes
          </span>
          <h2 className="mx-auto mt-3 max-w-xl text-balance text-[clamp(1.5rem,1.3rem+1.2vw,2.25rem)] font-bold tracking-[-0.03em]">
            Empieza gratis. Desbloquea todo cuando lo necesites.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-muted-foreground">
            El plan gratuito es tuyo para siempre. Premium abre los exámenes oficiales, los
            simulacros de tu universidad y el ranking completo — desde ≈ S/{" "}
            {PLAN_PRICES.quarterly.monthlyEquivalent} al mes, con {TRIAL_DAYS} días de prueba
            gratis.
          </p>
          <Button asChild size="lg" className="press mt-6 min-h-11">
            <Link to="/planes">
              Ver planes y precios <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
    <div className="text-center sm:text-left">
      <div className="font-data text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-pretty text-muted-foreground sm:text-sm">{label}</div>
    </div>
  );
}
