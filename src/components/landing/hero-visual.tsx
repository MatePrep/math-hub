import { CalendarClock, Check, Clock } from "lucide-react";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { cn } from "@/lib/utils";

/**
 * Ilustración del hero: un "tablero de instrumentos" con datos de ejemplo que
 * condensa los 3 pilares — puntaje vs. mínimo de ingreso, temas frecuentes y
 * ritmo por pregunta — más la cuenta regresiva. Decorativa (aria-hidden): el
 * dato real vive en la app. Las dos burbujas explicativas viven completamente
 * fuera de la tarjeta (nunca tapan su contenido) y se turnan un "spotlight"
 * (ver at-bubble en styles.css) que ilumina primero una y luego la otra.
 */

const FREQUENT_TOPICS = [
  { name: "Álgebra", pct: "28%" },
  { name: "Geometría", pct: "22%" },
  { name: "Funciones", pct: "14%" },
];

export function HeroVisual() {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();

  return (
    <div ref={ref} aria-hidden className="relative mx-auto w-full max-w-sm lg:max-w-none">
      {/* Tarjeta principal: puntaje vs. mínimo de ingreso + temas frecuentes */}
      <div
        className={cn(
          visible && "animate-fade-up",
          "relative overflow-hidden rounded-lg border border-border bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.2)]",
        )}
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
            <span className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Simulacro UNI · Resultado
            </span>
          </div>
          <span className="font-data rounded-md border border-success/50 bg-success/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-success">
            Ingresarías
          </span>
        </div>

        <div className="px-5 py-5">
          <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
            Tu puntaje
          </p>
          <p className="font-data mt-1 text-4xl font-bold tabular-nums">
            812 <span className="text-lg text-muted-foreground">pts</span>
          </p>

          {/* Barra de puntaje con la línea del mínimo de ingreso marcada */}
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
          {/* Diferenciador 1: comparación contra el mínimo real de tu carrera */}
          <p className="mt-1.5 text-right text-xs font-medium leading-snug text-primary">
            Comparamos tu puntaje con el mínimo real que pidió tu carrera: sabes si hoy ingresarías
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
            +12 pts sobre el puntaje mínimo del año pasado
          </div>

          {/* Diferenciador 2: los temas que más se repiten en tu examen */}
          <div className="mt-4 border-t border-border pt-3">
            <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              Los 3 temas más frecuentes de tu examen
            </p>
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
        </div>
      </div>

      {/* Burbuja: cuenta regresiva — flota íntegra sobre la tarjeta, sin taparla */}
      <div
        className={cn(
          visible && "animate-fade-up",
          "absolute -top-3 right-2 -translate-y-full sm:right-0",
        )}
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <div className="at-bubble w-max max-w-[15rem] rounded-lg border border-border bg-card px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
            <p className="font-data text-sm font-bold tabular-nums">
              34 días <span className="font-normal text-muted-foreground">para tu examen</span>
            </p>
          </div>
          <p className="at-bubble-caption mt-1 text-[0.7rem] font-medium leading-snug text-muted-foreground">
            Cuenta regresiva para el día oficial de tu examen
          </p>
        </div>
      </div>

      {/* Burbuja: ritmo por pregunta — flota íntegra bajo la tarjeta */}
      <div
        className={cn(
          visible && "animate-fade-up",
          "absolute -bottom-3 left-2 translate-y-full sm:left-0",
        )}
        style={{ "--i": 5 } as React.CSSProperties}
      >
        <div className="at-bubble at-bubble-alt w-max max-w-[15rem] rounded-lg border border-border bg-card px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <p className="font-data text-sm font-bold tabular-nums">
              1:12{" "}
              <span className="font-normal text-muted-foreground">/ pregunta · promedio 1:38</span>
            </p>
          </div>
          <p className="at-bubble-caption mt-1 text-[0.7rem] font-medium leading-snug text-muted-foreground">
            Descubre cuánto te toma cada pregunta frente al resto
          </p>
        </div>
      </div>
    </div>
  );
}
