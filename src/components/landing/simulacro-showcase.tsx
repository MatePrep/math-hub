import { Check, Clock } from "lucide-react";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

/**
 * Resultado de simulacro de ejemplo que vive debajo de los 3 pilares. Cada
 * insignia numerada (1·2·3) señala dónde aparece cada pilar dentro del
 * resultado real — la asociación reemplaza a los textos explicativos que
 * sobrecargaban la versión anterior. Decorativo (aria-hidden en los datos):
 * el dato real vive en la app.
 */

const FREQUENT_TOPICS = [
  { name: "Álgebra", pct: "28%" },
  { name: "Geometría", pct: "22%" },
  { name: "Funciones", pct: "14%" },
];

function PillarBadge({ n }: { n: number }) {
  return (
    <span
      aria-label={`Pilar ${n}`}
      className="font-data grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_0_3px_oklch(0.83_0.16_92_/_0.25)]"
    >
      {n}
    </span>
  );
}

export function SimulacroShowcase() {
  const { ref, visible } = useInViewOnce<HTMLDivElement>(0.3);
  const score = useCountUp(812, visible, 1200);

  return (
    <div ref={ref} className="mx-auto w-full max-w-xl">
      {/* Marco de navegador: la sección se lee como una captura real del
          producto, no como una tarjeta de marketing más — refuerzo de
          "esto existe de verdad" para quien recién llega. */}
      <div
        className={cn(
          "at",
          visible && "animate-fade-up",
          "relative overflow-hidden rounded-xl border border-border bg-muted/60 shadow-[0_32px_64px_-28px_rgba(15,23,42,0.5)]",
        )}
        style={{ "--i": 2 } as React.CSSProperties}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
          </div>
          <span className="font-data flex-1 truncate rounded-md bg-card px-3 py-1 text-center text-[0.65rem] text-muted-foreground">
            admi-tec.pe/simulacro
          </span>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-b-xl bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.2)]",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />
              <span className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Simulacro UNI · Resultado
              </span>
            </div>
            <span className="font-data rounded-md border border-success/50 bg-success/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-success">
              Ingresarías
            </span>
          </div>

          <div aria-hidden className="px-5 py-5">
            {/* 1 · Puntaje real vs. mínimo de ingreso */}
            <div className="flex items-center justify-between gap-3">
              <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Tu puntaje
              </p>
              <PillarBadge n={1} />
            </div>
            <p className="font-data mt-1 text-4xl font-bold tabular-nums">
              {score} <span className="text-lg text-muted-foreground">pts</span>
            </p>

            <div className="relative mt-5 h-3 rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-[width] duration-1000 ease-out"
                style={{ width: visible ? "78%" : "0%" }}
              />
              {/* Línea del mínimo al 72% */}
              <div className="absolute -top-1.5 bottom-[-6px] left-[72%] w-0.5 rounded bg-foreground/70" />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">0</span>
              <span className="font-data text-right font-semibold text-foreground">
                Puntaje mínimo de ingreso · Ing. Civil: 800 pts
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
              +12 pts sobre el puntaje mínimo del año pasado
            </div>

            {/* 2 · Los temas que más se repiten */}
            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                  Los 3 temas más frecuentes de tu examen
                </p>
                <PillarBadge n={2} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FREQUENT_TOPICS.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {t.name}
                    <span className="font-data font-semibold text-primary">{t.pct}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 3 · Tu ritmo por pregunta */}
            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <p className="font-data text-sm font-bold tabular-nums">
                    1:12{" "}
                    <span className="font-normal text-muted-foreground">
                      / pregunta · promedio 1:38
                    </span>
                  </p>
                </div>
                <PillarBadge n={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
