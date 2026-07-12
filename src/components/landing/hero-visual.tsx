import { CalendarClock, Check, Clock } from "lucide-react";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { cn } from "@/lib/utils";

/**
 * Ilustración del hero: un "tablero de instrumentos" con datos de ejemplo que
 * condensa los 3 pilares — puntaje vs. línea de corte, cuenta regresiva y
 * ritmo por pregunta. Decorativa (aria-hidden): el dato real vive en la app.
 */
export function HeroVisual() {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();

  return (
    <div ref={ref} aria-hidden className="relative mx-auto w-full max-w-sm lg:max-w-none">
      {/* Tarjeta principal: puntaje vs. línea de corte */}
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

          {/* Barra de puntaje con la línea de corte marcada */}
          <div className="relative mt-5 h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary transition-[width] duration-1000 ease-out"
              style={{ width: visible ? "78%" : "0%" }}
            />
            {/* Línea de corte al 72% */}
            <div className="absolute -top-1.5 bottom-[-6px] left-[72%] w-0.5 rounded bg-foreground/70" />
          </div>
          <div className="mt-2 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">0</span>
            <span className="font-data font-semibold text-foreground">
              corte Ing. Civil · 800 pts
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
            +12 pts sobre el puntaje mínimo del año pasado
          </div>
        </div>
      </div>

      {/* Chip flotante: cuenta regresiva */}
      <div
        className={cn(
          visible && "animate-fade-up",
          "absolute -top-4 right-2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md sm:-right-4",
        )}
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <CalendarClock className="h-4 w-4 text-primary" />
        <div className="leading-tight">
          <p className="font-data text-sm font-bold tabular-nums">34 días</p>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            para tu examen
          </p>
        </div>
      </div>

      {/* Chip flotante: ritmo por pregunta */}
      <div
        className={cn(
          visible && "animate-fade-up",
          "absolute -bottom-5 left-2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md sm:-left-4",
        )}
        style={{ "--i": 5 } as React.CSSProperties}
      >
        <Clock className="h-4 w-4 text-primary" />
        <div className="leading-tight">
          <p className="font-data text-sm font-bold tabular-nums">
            1:12 <span className="font-normal text-muted-foreground">/ pregunta</span>
          </p>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            promedio: 1:38
          </p>
        </div>
      </div>
    </div>
  );
}
