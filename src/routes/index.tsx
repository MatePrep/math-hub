import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTopics, listUniversities } from "@/lib/exercises.functions";
import { AnswerSheetWidget } from "@/components/landing/answer-sheet-widget";
import { HeroVisual } from "@/components/landing/hero-visual";
import { PillarsSection } from "@/components/landing/pillars";
import { dailyExerciseQO } from "@/lib/daily-exercise.functions";
import { UniversityMarquee } from "@/components/landing/university-marquee";
import { TrustPill } from "@/components/landing/trust-pill";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { cn } from "@/lib/utils";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { useCountUp } from "@/hooks/use-count-up";
import { pageMeta, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { PLAN_PRICES, TRIAL_DAYS } from "@/lib/plan";

const topicsQO = queryOptions({ queryKey: ["topics"], queryFn: () => listTopics() });
const uniQO = queryOptions({ queryKey: ["universities"], queryFn: () => listUniversities() });

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
    context.queryClient.ensureQueryData(dailyExerciseQO);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

// Puntajes de ejemplo según la grilla de puntuación del examen (no
// porcentajes) — coherentes con el "812 pts / mínimo 800" del hero.
const LEADERBOARD = [
  { rank: 1, handle: "Vector_123", score: 941 },
  { rank: 2, handle: "RaízDe2", score: 926 },
  { rank: 3, handle: "Postulante_UNI19", score: 918 },
  { rank: 4, handle: "MatrizPeru", score: 903 },
  { rank: 5, handle: "Asíntota_04", score: 897 },
];

function Index() {
  const { data: topics } = useSuspenseQuery(topicsQO);
  const { data: unis } = useSuspenseQuery(uniQO);
  const totalExercises = topics.reduce((s, t) => s + t.exerciseCount, 0);
  const { ref: rankingRef, visible: rankingVisible } = useInViewOnce<HTMLDivElement>();
  const { ref: retoRef, visible: retoVisible } = useInViewOnce<HTMLDivElement>();
  const { ref: planesRef, visible: planesVisible } = useInViewOnce<HTMLDivElement>(0.3);
  const { ref: ctaRef, visible: ctaVisible } = useInViewOnce<HTMLDivElement>(0.3);

  return (
    // overflow-x-clip: the ambient glows intentionally bleed past the viewport
    // edges; without the clip they create horizontal scroll and a white body
    // stripe shows beside the navy canvas.
    <div className="at overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Ambient depth: two large soft glows (amber = pencil light, teal =
            "correct") so the navy canvas reads as lit paper, never a flat fill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-primary/15 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 left-[-12rem] h-[26rem] w-[26rem] rounded-full bg-success/[0.12] blur-[110px]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="animate-fade-up" style={{ "--i": 0 } as React.CSSProperties}>
              <TrustPill>Preparación para todas las universidades</TrustPill>
            </div>
            <h1 className="mt-5 text-balance text-[clamp(2.5rem,1.9rem+3.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <StaggeredWords text="Cuando llegues a tu examen," startIndex={1} />{" "}
              <span className="text-primary">
                <StaggeredWords text="ya lo habrás resuelto." startIndex={6} />
              </span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ "--i": 11 } as React.CSSProperties}
            >
              Admi-Tec convierte los{" "}
              <strong className="font-semibold text-foreground">
                exámenes oficiales de admisión
              </strong>{" "}
              en práctica diaria:{" "}
              <strong className="font-semibold text-foreground">simulacros cronometrados</strong>,
              ejercicios resueltos paso a paso y el avance exacto que necesitas para llegar a la
              UNI, San Marcos, PUCP o tu universidad.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap gap-3"
              style={{ "--i": 13 } as React.CSSProperties}
            >
              <Button asChild size="lg" className="press min-h-11">
                <Link to="/temas">
                  Empezar a practicar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="press min-h-11">
                <Link to="/examenes">Ver exámenes oficiales</Link>
              </Button>
            </div>
            <div className="animate-fade-up" style={{ "--i": 14 } as React.CSSProperties}>
              <TrustPill className="mt-4">Regístrate totalmente gratis, sin tarjeta</TrustPill>
            </div>
            <div
              className="animate-fade-up mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-4 sm:max-w-md"
              style={{ "--i": 15 } as React.CSSProperties}
            >
              <HeroStat label="Ejercicios" value={totalExercises} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <HeroStat label="Cursos" value={topics.length} />
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <HeroStat label="Universidades" value={unis.length} />
            </div>
          </div>

          {/* Extra vertical room for the arrowed annotations above/below the visual */}
          <div className="px-2 pb-24 pt-24 lg:px-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* University marquee + course ticker */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center gap-6">
            <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:block">
              Preparación oficial para
            </span>
            <UniversityMarquee universities={unis} />
          </div>
          {/* Second strip drifting the other way: every course covered, with its
              exercise count — full coverage made visible, not implied. */}
          {topics.length > 0 && (
            <div className="mt-4 flex items-center gap-6">
              <span className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:block">
                Cursos disponibles
              </span>
              <div
                className="marquee-track relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
                role="list"
                aria-label="Cursos disponibles"
              >
                <div className="animate-marquee-reverse flex w-max items-center gap-3">
                  {[...topics, ...topics].map((t, i) => (
                    <span
                      key={`${t.id}-${i}`}
                      role="listitem"
                      aria-hidden={i >= topics.length}
                      className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground/85"
                    >
                      {t.name}
                      <span className="font-data ml-1.5 tabular-nums text-muted-foreground">
                        {t.exerciseCount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Los 3 pilares */}
      <PillarsSection />

      {/* Reto del día */}
      <section className="relative overflow-hidden border-y border-border bg-card/50">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[100px]"
        />
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
              Cada día publicamos{" "}
              <strong className="font-semibold text-foreground">un ejercicio real del banco</strong>{" "}
              — el mismo para todos. Resuélvelo contra el reloj y compara tus aciertos con los de
              todos los que lo intentaron hoy.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Sin cuenta y sin excusas:{" "}
              <strong className="font-semibold text-foreground">
                el cronómetro ya está corriendo
              </strong>
              .
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <AnswerSheetWidget />
          </div>
        </div>
      </section>

      {/* Ranking / community */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-success/[0.12] blur-[100px]"
        />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Trophy className="h-4 w-4" /> Ranking anónimo
            </span>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
              Compite sin exponer tu nombre.
            </h2>
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">
              Compara tu desempeño con{" "}
              <strong className="font-semibold text-foreground">
                otros postulantes a tu misma universidad
              </strong>
              , con seudónimo y solo con los últimos 3 meses de actividad.{" "}
              <strong className="font-semibold text-foreground">Nadie ve tu nombre real</strong> —
              ni siquiera nosotros lo mostramos.
            </p>
            <Button asChild variant="outline" className="press mt-6">
              <Link to="/ranking">
                Ver ranking completo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {/* Real study moment, sunk into the navy (desaturated + tint) */}
            <div className="relative mt-8 hidden overflow-hidden rounded-lg border border-border sm:block">
              <img
                src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80"
                alt="Postulante concentrado estudiando con audífonos"
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover saturate-[0.55]"
              />
              <div aria-hidden className="absolute inset-0 bg-background/35" />
            </div>
          </div>

          <div ref={rankingRef} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                UNI · Últimos 3 meses
              </span>
              <span className="font-data text-[0.7rem] text-muted-foreground">Puntaje</span>
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
                  <span className="font-data text-sm font-semibold tabular-nums">
                    {row.score} <span className="font-normal text-muted-foreground">pts</span>
                  </span>
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
                  812 <span className="font-normal opacity-70">pts</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Planes teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24">
        <div
          ref={planesRef}
          className={cn(
            planesVisible && "animate-fade-up",
            "relative overflow-hidden rounded-lg border border-border bg-card px-6 py-12 text-center sm:px-10",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[90px]"
          />
          <span className="relative inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Planes
          </span>
          <h2 className="mx-auto mt-3 max-w-xl text-balance text-[clamp(1.5rem,1.3rem+1.2vw,2.25rem)] font-bold tracking-[-0.03em]">
            Empieza gratis. Desbloquea todo cuando lo necesites.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-muted-foreground">
            El plan gratuito es{" "}
            <strong className="font-semibold text-foreground">tuyo para siempre</strong>. Premium
            abre los exámenes oficiales, los simulacros de tu universidad y el ranking completo —
            desde ≈ S/ {PLAN_PRICES.quarterly.monthlyEquivalent} al mes, con {TRIAL_DAYS} días de
            prueba gratis.
          </p>
          <Button asChild size="lg" className="press mt-6 min-h-11">
            <Link to="/planes">
              Ver planes y precios <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border">
        {/* Real exam moment: a hand writing on answer sheets, desaturated and
            sunk into the navy so the type keeps full contrast. */}
        <img
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-25 saturate-[0.25]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/35"
        />
        <div
          ref={ctaRef}
          className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center"
        >
          <div
            className={cn(ctaVisible && "animate-fade-up")}
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <TrustPill>Únete en menos de un minuto</TrustPill>
          </div>
          <h2
            className={cn(
              ctaVisible && "animate-fade-up",
              "text-balance text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-bold tracking-[-0.03em]",
            )}
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Tu próximo simulacro puede empezar ahora mismo.
          </h2>
          <p
            className={cn(
              ctaVisible && "animate-fade-up",
              "max-w-md text-pretty text-muted-foreground",
            )}
            style={{ "--i": 4 } as React.CSSProperties}
          >
            Crea tu cuenta gratis y elige tu universidad.{" "}
            <strong className="font-semibold text-foreground">Sin tarjeta, sin compromiso.</strong>
          </p>
          <div
            className={cn(ctaVisible && "animate-fade-up")}
            style={{ "--i": 6 } as React.CSSProperties}
          >
            <Button asChild size="lg" className="press min-h-11">
              <Link to="/auth">
                Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <WhatsAppFloat />
    </div>
  );
}

// Splits a phrase into per-word spans that fade up in sequence (40ms/word via
// the shared fade-up stagger) — the hero's one typographic flourish on load.
function StaggeredWords({ text, startIndex = 0 }: { text: string; startIndex?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          <span
            className="animate-fade-up inline-block"
            style={{ "--i": startIndex + i } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value, true);
  return (
    <div>
      <div className="font-data text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
        {shown.toLocaleString("es-PE")}
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
