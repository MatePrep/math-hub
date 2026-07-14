import { Gauge, ListChecks, Target } from "lucide-react";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { useCountUp } from "@/hooks/use-count-up";
import { SimulacroShowcase } from "@/components/landing/simulacro-showcase";
import { cn } from "@/lib/utils";

/**
 * Los 3 pilares diferenciadores del producto sobre papel claro (.at-paper):
 * la sección rompe el navy de la página como una hoja de examen real. Cada
 * pilar lleva su número 1·2·3 y, debajo, el resultado de simulacro de
 * ejemplo repite esos números donde cada pilar aparece de verdad.
 */

function ScoreMini({ visible }: { visible: boolean }) {
  const score = useCountUp(812, visible, 1200);
  return (
    <div aria-hidden className="flex h-full flex-col justify-center gap-2 px-4">
      <div className="flex items-baseline justify-between">
        <span className="font-data text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          Tu simulacro
        </span>
        <span className="font-data text-sm font-bold tabular-nums">{score} pts</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted">
        <div
          className="h-2.5 rounded-full bg-primary transition-[width] duration-1000 ease-out"
          style={{ width: visible ? "76%" : "0%" }}
        />
        <div className="absolute -top-1 bottom-[-4px] left-[70%] w-0.5 rounded bg-foreground/70" />
      </div>
      <div className="flex justify-end">
        <span className="font-data text-[0.65rem] font-semibold text-success">
          mínimo de ingreso: 800 · lo superaste
        </span>
      </div>
    </div>
  );
}

function FrequencyRow({ label, pct, width, delay, visible }: FrequencyRowProps) {
  const shown = useCountUp(pct, visible, 900);
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[0.7rem] font-medium text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-muted">
        <div
          className="h-2.5 rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: visible ? `${width}%` : "0%", transitionDelay: `${delay}ms` }}
        />
      </div>
      <span className="font-data w-9 shrink-0 text-right text-[0.7rem] font-bold tabular-nums">
        {shown}%
      </span>
    </div>
  );
}

type FrequencyRowProps = {
  label: string;
  pct: number;
  width: number;
  delay: number;
  visible: boolean;
};

function FrequencyMini({ visible }: { visible: boolean }) {
  const rows = [
    { label: "Álgebra", pct: 28, width: 84 },
    { label: "Geometría", pct: 22, width: 66 },
    { label: "Aritmética", pct: 14, width: 42 },
  ];
  return (
    <div aria-hidden className="flex h-full flex-col justify-center gap-2.5 px-4">
      {rows.map((r, i) => (
        <FrequencyRow key={r.label} {...r} delay={i * 140} visible={visible} />
      ))}
    </div>
  );
}

function PaceMini({ visible }: { visible: boolean }) {
  const rows = [
    { label: "Tú", time: "1:12", width: 46, mine: true },
    { label: "Promedio", time: "1:38", width: 64, mine: false },
  ];
  return (
    <div aria-hidden className="flex h-full flex-col justify-center gap-3 px-4">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-2">
          <span
            className={cn(
              "w-20 shrink-0 text-[0.7rem] font-medium",
              r.mine ? "font-bold text-foreground" : "text-muted-foreground",
            )}
          >
            {r.label}
          </span>
          <div className="h-2.5 flex-1 rounded-full bg-muted">
            <div
              className={cn(
                "h-2.5 rounded-full transition-[width] duration-700 ease-out",
                r.mine ? "bg-primary" : "bg-muted-foreground/40",
              )}
              style={{
                width: visible ? `${r.width}%` : "0%",
                transitionDelay: `${i * 140}ms`,
              }}
            />
          </div>
          <span className="font-data w-9 shrink-0 text-right text-[0.7rem] font-bold tabular-nums">
            {r.time}
          </span>
        </div>
      ))}
      <p className="text-[0.65rem] font-semibold text-success">
        26 s más rápido que el promedio en esta pregunta
      </p>
    </div>
  );
}

// Una sola frase resaltada por pilar — la afirmación que el visitante debe
// retener — en tinta semibold, nunca en ámbar (reservado para acciones).
const em = "font-semibold text-foreground";

const PILLARS: Array<{
  title: string;
  text: React.ReactNode;
  Visual: (props: { visible: boolean }) => React.ReactNode;
  Icon: typeof Target;
}> = [
  {
    title: "Tu puntaje real, tu meta real",
    text: (
      <>
        Cada simulacro se corrige con el sistema de puntos del examen real — las buenas suman, las
        malas restan — y se compara con el puntaje mínimo de ingreso de tu carrera. No sabes si «vas
        bien»: <strong className={em}>sabes si hoy ingresarías</strong>.
      </>
    ),
    Visual: ScoreMini,
    Icon: Target,
  },
  {
    title: "Estudia lo que de verdad se pregunta",
    text: (
      <>
        Analizamos los exámenes oficiales de tu universidad y te mostramos{" "}
        <strong className={em}>los temas que más se repiten en el examen</strong>. Tus horas de
        estudio van donde hay puntos, no donde el índice del libro diga.
      </>
    ),
    Visual: FrequencyMini,
    Icon: ListChecks,
  },
  {
    title: "Conoce tu propio ritmo",
    text: (
      <>
        Medimos <strong className={em}>cuánto te toma cada pregunta</strong> y lo comparamos con el
        promedio de todos los que la resolvieron. La velocidad se entrena, pero primero hay que
        poder verla.
      </>
    ),
    Visual: PaceMini,
    Icon: Gauge,
  },
];

// Tarjeta con tilt 3D que sigue el cursor (usePointerTilt) — cada instancia
// necesita su propio ref/estado, así que vive en su propio componente en vez
// de llamar el hook dentro del .map() del padre.
function PillarCard({
  index,
  title,
  text,
  Visual,
  Icon,
  visible,
}: {
  index: number;
  title: string;
  text: React.ReactNode;
  Visual: (props: { visible: boolean }) => React.ReactNode;
  Icon: typeof Target;
  visible: boolean;
}) {
  const { ref, handleMove, handleLeave } = usePointerTilt<HTMLElement>(5);

  return (
    <article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        visible && "animate-rise-in",
        "pillar-card group flex flex-col rounded-lg border border-border bg-card hover:border-primary/70 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.35)]",
      )}
      style={visible ? ({ "--i": index * 2 } as React.CSSProperties) : undefined}
    >
      <div className="relative h-32 overflow-hidden border-b border-border bg-muted/40">
        {/* Marca de agua del ícono: refuerza el concepto del pilar sin competir
            con los datos — puramente decorativa. */}
        <Icon
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-primary/[0.08]"
          strokeWidth={1.5}
        />
        <Visual visible={visible} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <span className="font-data grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110">
            {index + 1}
          </span>
          <h3 className="text-balance text-lg font-bold leading-snug tracking-tight">{title}</h3>
        </div>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </article>
  );
}

export function PillarsSection() {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();

  return (
    <section className="at-paper border-y border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-xl">
          <h2 className="text-balance text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] font-bold tracking-[-0.03em]">
            ¿Cómo se prepara alguien que sí va a ingresar?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Con datos, no con sensaciones.
            </strong>{" "}
            Estas son las tres cosas que Admi-Tec te dice y ningún solucionario te va a decir.
          </p>
        </div>

        <div ref={ref} className="mt-10 grid gap-4 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <PillarCard
              key={p.title}
              index={i}
              title={p.title}
              text={p.text}
              Visual={p.Visual}
              Icon={p.Icon}
              visible={visible}
            />
          ))}
        </div>

        {/* El mismo 1·2·3, ahora dentro de un resultado real */}
        <div className="mt-14">
          <p className="mx-auto max-w-md text-balance text-center font-semibold">
            Y así se ven los tres juntos al terminar un simulacro:
          </p>
          <div className="mt-6">
            <SimulacroShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
