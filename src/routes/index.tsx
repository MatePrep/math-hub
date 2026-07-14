import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTopics, listUniversities } from "@/lib/exercises.functions";
import { AnswerSheetWidget } from "@/components/landing/answer-sheet-widget";
import { AmbientBackground } from "@/components/landing/ambient-background";
import { PillarsSection } from "@/components/landing/pillars";
import { dailyExerciseQO } from "@/lib/daily-exercise.functions";
import { UniversityMarquee } from "@/components/landing/university-marquee";
import { TrustPill } from "@/components/landing/trust-pill";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { cn } from "@/lib/utils";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { useCountUp } from "@/hooks/use-count-up";
import { useParallax } from "@/hooks/use-parallax";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useSectionPager } from "@/hooks/use-section-pager";
import { fireConfetti } from "@/lib/confetti";
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
// Los 3 pasos reales de la primera semana — sin cronómetro, sin ranking
// todavía, sin urgencia: la reassurance section para quien recién llega.
const START_STEPS = [
  {
    title: "Elige tu universidad",
    text: "Ajustamos temas, exámenes y ranking al examen específico de tu carrera y tu universidad.",
  },
  {
    title: "Practica sin presión",
    text: "Empieza tema por tema, a tu ritmo. El cronómetro y el puntaje llegan solo cuando tú decides rendir un simulacro.",
  },
  {
    title: "Ríndelo como examen real",
    text: "Cuando te sientas listo, un simulacro te dice con números si ya puedes — sin sorpresas el día del examen.",
  },
];

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
  const { ref: rankingIntroRef, visible: rankingIntroVisible } = useInViewOnce<HTMLDivElement>();
  const { ref: startRef, visible: startVisible } = useInViewOnce<HTMLDivElement>();
  const { ref: retoRef, visible: retoVisible } = useInViewOnce<HTMLDivElement>();
  const { ref: planesRef, visible: planesVisible } = useInViewOnce<HTMLDivElement>(0.3);
  const { ref: ctaRef, visible: ctaVisible } = useInViewOnce<HTMLDivElement>(0.3);
  const scrollProgress = useScrollProgress();
  const heroGlowAmberRef = useParallax<HTMLDivElement>(0.05, 30);
  const heroGlowTealRef = useParallax<HTMLDivElement>(-0.04, 24);
  const retoImgRef = useParallax<HTMLImageElement>(0.05, 30);
  const rankingImgRef = useParallax<HTMLImageElement>(0.05, 30);
  const ctaImgRef = useParallax<HTMLImageElement>(0.04, 26);
  const pageRef = useRef<HTMLDivElement>(null);
  // Wheel/keyboard section paging (see the hook) — CSS scroll-snap in
  // styles.css already handles touch; this is what makes a plain mouse
  // wheel feel like the same one-flick-per-section "social app" jump.
  useSectionPager(pageRef);

  return (
    // overflow-x-clip: the ambient glows intentionally bleed past the viewport
    // edges; without the clip they create horizontal scroll and a white body
    // stripe shows beside the navy canvas.
    // isolate: gives .at its own stacking context so AmbientBackground's
    // fixed + negative-z layer stays contained behind this page's content
    // instead of escaping to the document root (where it'd render behind
    // .at's own opaque background and disappear entirely).
    <div ref={pageRef} className="at isolate snap-sections overflow-x-clip">
      <AmbientBackground />

      {/* Scroll progress rail — a position indicator, not decoration, so it
          stays put under prefers-reduced-motion (only the width transition
          below is cosmetic smoothing). */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] bg-border/30">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Hero */}
      <section
        data-snap-section
        className="relative flex min-h-dvh snap-start flex-col justify-center overflow-hidden border-b border-border"
      >
        {/* Ambient depth: two large soft glows (amber = pencil light, teal =
            "correct") so the navy canvas reads as lit paper, never a flat fill.
            Each drifts at a slightly different parallax speed as you scroll
            AND floats continuously at rest (on an outer wrapper, since
            parallax already owns `transform` on the inner glow), so the
            depth reads as physical and alive, not a static gradient. */}
        <div
          aria-hidden
          className="animate-float pointer-events-none absolute -top-40 right-[-10rem]"
          style={
            {
              "--float-x": "-16px",
              "--float-y": "20px",
              "--float-duration": "10s",
            } as React.CSSProperties
          }
        >
          <div
            ref={heroGlowAmberRef}
            className="h-[30rem] w-[30rem] rounded-full bg-primary/15 blur-[120px]"
            style={{ transform: "translateY(var(--parallax-y, 0px))" }}
          />
        </div>
        <div
          aria-hidden
          className="animate-float pointer-events-none absolute -bottom-48 left-[-12rem]"
          style={
            {
              "--float-x": "18px",
              "--float-y": "-14px",
              "--float-duration": "12s",
              "--float-delay": "-3s",
            } as React.CSSProperties
          }
        >
          <div
            ref={heroGlowTealRef}
            className="h-[26rem] w-[26rem] rounded-full bg-success/[0.12] blur-[110px]"
            style={{ transform: "translateY(var(--parallax-y, 0px))" }}
          />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-8 pt-12 sm:pb-10 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-12 lg:pb-12 lg:pt-20">
          <div>
            <h1 className="text-balance text-[clamp(2.5rem,1.9rem+3.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              <StaggeredWords text="Cuando llegues a tu examen," startIndex={0} />{" "}
              <span className="text-primary">
                <StaggeredWords text="ya lo habrás resuelto." startIndex={5} />
              </span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ "--i": 11 } as React.CSSProperties}
            >
              Exámenes oficiales de tu universidad, simulacros de{" "}
              <strong className="font-semibold text-foreground">todos tus cursos</strong> que se
              corrigen como el examen real, y{" "}
              <strong className="font-semibold text-foreground">
                el puntaje exacto que te falta
              </strong>{" "}
              para tu carrera — así sabes dónde estás parado, sin adivinar.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap gap-3"
              style={{ "--i": 13 } as React.CSSProperties}
            >
              <Button asChild size="lg" className="press cta-overshoot min-h-11">
                <Link to="/temas">
                  Empezar a practicar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="press cta-overshoot min-h-11">
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

          {/* Postulante real de cuerpo presente: solo aparece cuando la
              grilla tiene espacio para ponerlo junto al texto (lg+). Debajo
              de eso el texto manda solo — nunca se apila la foto bajo la
              copy en celulares/tablets. */}
          <div className="relative mx-auto hidden w-full max-w-[24rem] items-end justify-center lg:-mb-16 lg:flex">
            {/* Único destello ámbar detrás del postulante: respira lento
                (mismo animate-glow que el widget del reto del día) para
                darle dinamismo sin la línea de contorno que antes lo
                enjaulaba. */}
            <div
              aria-hidden
              className="animate-glow absolute -inset-x-[16%] -inset-y-[6%] rounded-[50%] bg-primary/[0.18] blur-2xl"
            />
            <img
              src="/landing/estudiante-hero.png"
              alt="Postulante preuniversitario sonriendo, listo para su examen de admisión"
              width={900}
              height={1468}
              fetchPriority="high"
              decoding="async"
              className="relative w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* University marquee + course ticker — a thin interstitial ribbon
          between the Hero and Pilares slides, not a slide of its own; the
          section pager just scrolls straight through it on the way there. */}
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
                      className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground/85 transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110"
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

      {/* Cómo empezar: reassurance section para quien recién llega — sin
          cronómetro, sin ranking, sin urgencia todavía. Navy plano (sin
          imagen de fondo) para que se sienta como una pausa antes del
          "reto del día". */}
      <section
        data-snap-section
        className="flex min-h-dvh snap-start flex-col justify-center border-b border-border"
      >
        <div ref={startRef} className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
              No necesitas ser el mejor para empezar hoy.
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Así se ven tus primeros días en Admi-Tec — a tu ritmo, sin cronómetro hasta que tú
              quieras.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {START_STEPS.map((s, i) => (
              <div
                key={s.title}
                className={cn(
                  startVisible && "animate-rise-in",
                  "group rounded-lg border border-border bg-card p-6 transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2",
                )}
                style={startVisible ? ({ "--i": i * 2 } as React.CSSProperties) : undefined}
              >
                <span className="font-data grid h-9 w-9 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-balance text-lg font-bold leading-snug tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="press cta-overshoot min-h-11">
              <Link to="/auth" onClick={() => fireConfetti()}>
                Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Reto del día */}
      <section
        data-snap-section
        className="relative flex min-h-dvh snap-start flex-col justify-center overflow-hidden border-b border-border"
      >
        <SectionSweep visible={retoVisible} />
        {/* Momento real de estudio (postulante resolviendo en su cuaderno),
            hundido en el navy para que el widget conserve todo el contraste.
            Parallax sutil: la foto se mueve más despacio que el scroll. */}
        <img
          ref={retoImgRef}
          src="https://images.unsplash.com/photo-1650477250300-805cde98ec21?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-25 saturate-[0.35]"
          style={{ transform: "translateY(var(--parallax-y, 0px))" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/85"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[100px]"
        />
        <div
          ref={retoRef}
          className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center"
        >
          <div className={cn(retoVisible && "animate-rise-in")}>
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
              Sin cuenta y sin presión: pruébalo cuando quieras,{" "}
              <strong className="font-semibold text-foreground">el cronómetro te espera</strong>.
            </p>
          </div>
          <div
            className={cn(
              "mx-auto w-full max-w-sm lg:max-w-none",
              retoVisible && "animate-rise-in",
            )}
          >
            <AnswerSheetWidget />
          </div>
        </div>
      </section>

      {/* Ranking / community */}
      <section
        data-snap-section
        className="relative flex min-h-dvh snap-start flex-col justify-center overflow-hidden"
      >
        <SectionSweep visible={rankingIntroVisible} />
        {/* Los rivales existen: grupo de postulantes como fondo de toda la
            sección, oscurecido hacia la izquierda donde vive el texto. */}
        <img
          ref={rankingImgRef}
          src="https://images.unsplash.com/photo-1760574740270-067dc14bf164?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.22] saturate-[0.35]"
          style={{ transform: "translateY(var(--parallax-y, 0px))" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/55"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-success/[0.12] blur-[100px]"
        />
        <div
          ref={rankingIntroRef}
          className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center"
        >
          <div className={cn(rankingIntroVisible && "animate-rise-in")}>
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
            <Button asChild variant="outline" className="press cta-overshoot mt-6">
              <Link to="/ranking">
                Ver ranking completo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div
            ref={rankingRef}
            className={cn(
              rankingVisible && "animate-rise-in",
              "overflow-hidden rounded-lg border border-border bg-card",
            )}
          >
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
                  "relative flex items-center gap-3 border-t border-primary/30 px-5 py-3",
                )}
                style={
                  rankingVisible
                    ? ({ "--i": Math.min(LEADERBOARD.length, 10) } as React.CSSProperties)
                    : undefined
                }
              >
                {/* Tinte propio en un elemento aparte: así respira sin pelear
                    con la animación de entrada de la fila (misma propiedad
                    `animation` no se puede compartir entre dos clases). */}
                <span aria-hidden className="animate-pulse-row absolute inset-0 bg-primary/5" />
                <span className="font-data relative w-5 text-sm text-primary">27</span>
                <span className="relative flex-1 text-sm font-medium text-primary">Tú</span>
                <span className="font-data relative text-sm font-semibold tabular-nums text-primary">
                  812 <span className="font-normal opacity-70">pts</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Planes: banda ámbar de borde a borde — el único bloque drenched de la
          página, para que el precio no se pierda entre el navy. */}
      <section
        data-snap-section
        className="relative flex min-h-dvh snap-start flex-col justify-center overflow-hidden bg-primary text-primary-foreground"
      >
        <SectionSweep visible={planesVisible} className="via-primary-foreground/70" />
        <div
          ref={planesRef}
          className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr]"
        >
          <div className={cn(planesVisible && "animate-rise-in")}>
            <span className="font-data text-[0.7rem] font-bold uppercase tracking-[0.14em]">
              Planes y precios
            </span>
            <h2 className="mt-3 max-w-xl text-balance text-[clamp(1.5rem,1.3rem+1.2vw,2.25rem)] font-bold tracking-[-0.03em]">
              Empieza gratis. Desbloquea todo cuando lo necesites.
            </h2>
            <p className="mt-3 max-w-lg text-pretty font-medium text-primary-foreground/85">
              El plan gratuito es tuyo para siempre. Premium abre todo lo demás cuando decidas ir en
              serio — y puedes probarlo {TRIAL_DAYS} días sin pagar.
            </p>
            <Button
              asChild
              size="lg"
              className="press cta-overshoot mt-6 min-h-11 bg-background text-foreground hover:bg-background/90"
            >
              <Link to="/planes">
                Ver planes y precios <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Tarjeta de precio en navy sobre el ámbar: el contraste invertido
              hace que el número se lea como dato de instrumento, no como oferta. */}
          <div
            className={cn(
              planesVisible && "animate-rise-in",
              "relative rounded-lg bg-background p-6 text-foreground shadow-[0_8px_8px_-4px_rgba(15,23,42,0.45)] sm:p-8",
            )}
            style={planesVisible ? ({ "--i": 2 } as React.CSSProperties) : undefined}
          >
            <p className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Premium desde
            </p>
            <p className="font-data mt-2 text-5xl font-bold tabular-nums">
              S/ {PLAN_PRICES.quarterly.monthlyEquivalent.split(".")[0]}
              <span className="text-2xl">
                .{PLAN_PRICES.quarterly.monthlyEquivalent.split(".")[1]}
              </span>{" "}
              <span className="text-base font-normal text-muted-foreground">/ mes</span>
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              con el plan trimestral · {TRIAL_DAYS} días de prueba gratis
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
              {[
                "Exámenes oficiales de admisión completos",
                "Simulacros ilimitados de tu universidad",
                "Ranking completo frente a otros postulantes",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    strokeWidth={3}
                    aria-hidden
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        data-snap-section
        className="relative flex min-h-dvh snap-start flex-col justify-center overflow-hidden border-t border-border"
      >
        <SectionSweep visible={ctaVisible} />
        {/* Real exam moment: a hand writing on answer sheets, desaturated and
            sunk into the navy so the type keeps full contrast. */}
        <img
          ref={ctaImgRef}
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-25 saturate-[0.25]"
          style={{ transform: "translateY(var(--parallax-y, 0px))" }}
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
            className={cn(ctaVisible && "animate-rise-in")}
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <TrustPill>Únete en menos de un minuto</TrustPill>
          </div>
          <h2
            className={cn(
              ctaVisible && "animate-rise-in",
              "text-balance text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-bold tracking-[-0.03em]",
            )}
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Tu próximo simulacro puede empezar ahora mismo.
          </h2>
          <p
            className={cn(
              ctaVisible && "animate-rise-in",
              "max-w-md text-pretty text-muted-foreground",
            )}
            style={{ "--i": 4 } as React.CSSProperties}
          >
            Crea tu cuenta gratis y elige tu universidad.{" "}
            <strong className="font-semibold text-foreground">Sin tarjeta, sin compromiso.</strong>
          </p>
          <div
            className={cn(ctaVisible && "animate-rise-in")}
            style={{ "--i": 6 } as React.CSSProperties}
          >
            <Button asChild size="lg" className="press cta-overshoot min-h-11">
              <Link to="/auth" onClick={() => fireConfetti()}>
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

// Thin gradient line that sweeps across a section's top edge once, the
// moment it scrolls into view — the "something changed" cue between
// sections. A line, not a blur, so it never competes with the hero widget's
// one ambient glow (see the One Glow Rule in DESIGN.md).
function SectionSweep({ visible, className }: { visible: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px overflow-hidden"
    >
      <span
        className={cn(
          "absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent",
          visible && "animate-sweep-line",
          className,
        )}
      />
    </div>
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
