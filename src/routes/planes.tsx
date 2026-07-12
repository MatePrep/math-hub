import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Lock,
  Mail,
  Minus,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivateTrial } from "@/components/premium/premium-gate";
import { usePlan } from "@/hooks/use-plan";
import {
  FREE_FEATURES,
  PLAN_COMPARISON,
  PLAN_PRICES,
  PREMIUM_FEATURES,
  TRIAL_DAYS,
} from "@/lib/plan";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";
import { useInViewOnce } from "@/hooks/use-in-view-once";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planes")({
  head: () =>
    pageMeta({
      path: "/planes",
      title: "Planes y precios",
      description: `Empieza gratis y desbloquea todo con Premium: exámenes oficiales, simulacros de tu universidad y ranking completo. Desde S/ ${PLAN_PRICES.quarterly.monthlyEquivalent} al mes, con ${TRIAL_DAYS} días de prueba gratis.`,
    }),
  component: PlanesPage,
});

type Billing = "monthly" | "quarterly";

function PlanesPage() {
  const { signedIn, isPremium, onTrial, trialUsed, trialDaysLeft } = usePlan();
  const [billing, setBilling] = useState<Billing>("quarterly");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const activate = useActivateTrial();
  const { ref: tableRef, visible: tableVisible } = useInViewOnce<HTMLDivElement>();

  const price = PLAN_PRICES[billing];
  const canTrial = signedIn === true && !isPremium && !trialUsed;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Encabezado */}
      <header className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" /> Planes
        </div>
        <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Empieza gratis. <span className="text-primary">Ingresa con Premium.</span>
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          El plan gratuito te acompaña todos los días. Premium desbloquea lo que decide una
          admisión: los exámenes reales, los simulacros de tu universidad y saber exactamente dónde
          estás parado.
        </p>
      </header>

      {/* Estado actual (prueba activa) */}
      {onTrial && (
        <div className="animate-alert-in mx-auto mt-6 flex max-w-lg items-center justify-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium">
          <Timer className="h-4 w-4 text-accent-foreground" aria-hidden />
          Tu prueba Premium está activa —{" "}
          <span className="font-data font-semibold tabular-nums">
            {trialDaysLeft} {trialDaysLeft === 1 ? "día restante" : "días restantes"}
          </span>
        </div>
      )}

      {/* Toggle mensual / trimestral */}
      <div className="mt-10 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Periodo de facturación"
          className="relative inline-flex rounded-full border border-border bg-secondary/60 p-1"
        >
          {(["monthly", "quarterly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              onClick={() => setBilling(b)}
              className={cn(
                "press relative rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200",
                billing === b
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PLAN_PRICES[b].label}
              {b === "quarterly" && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold",
                    billing === b
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent/20 text-accent-foreground",
                  )}
                >
                  −{PLAN_PRICES.quarterly.discountPct}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de plan */}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {/* Gratuito */}
        <section
          aria-label="Plan Gratuito"
          className="animate-fade-up flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <h2 className="font-display text-xl font-bold">Gratuito</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Para practicar todos los días, a tu ritmo.
          </p>
          <p className="mt-5 font-display text-4xl font-bold">
            S/ 0
            <span className="ml-1 text-base font-normal text-muted-foreground">para siempre</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>
          {signedIn === true ? (
            <div className="mt-8 rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
              {isPremium ? "Incluido en tu plan Premium" : "Tu plan actual"}
            </div>
          ) : (
            <Button asChild variant="outline" size="lg" className="press mt-8">
              <Link to="/auth">Crear cuenta gratis</Link>
            </Button>
          )}
        </section>

        {/* Premium */}
        <section
          aria-label="Plan Premium"
          className="animate-fade-up relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary bg-card p-6 shadow-lg sm:p-8"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            Recomendado
          </span>
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold">
            Premium <Sparkles className="h-4 w-4 text-accent-foreground" aria-hidden />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Todo lo que decide tu ingreso, sin límites.
          </p>
          {/* key= reinicia la animación al cambiar el periodo: el precio "aterriza" */}
          <div key={billing} className="animate-card-swap mt-5">
            <p className="font-display text-4xl font-bold">
              S/ {price.amount}
              <span className="ml-1 text-base font-normal text-muted-foreground">{price.per}</span>
            </p>
            {billing === "quarterly" ? (
              <p className="mt-1 text-sm text-muted-foreground">
                ≈ S/ {PLAN_PRICES.quarterly.monthlyEquivalent} al mes ·{" "}
                <span className="line-through">S/ {PLAN_PRICES.quarterly.fullPrice}</span>{" "}
                <span className="font-semibold text-success">
                  ahorras {PLAN_PRICES.quarterly.discountPct}%
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Con el trimestral pagas ≈ S/ {PLAN_PRICES.quarterly.monthlyEquivalent} al mes.
              </p>
            )}
          </div>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-2">
            {signedIn === false && (
              <>
                <Button asChild size="lg" className="press">
                  <Link to="/auth">
                    Crear cuenta y probar gratis <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Al crear tu cuenta puedes activar {TRIAL_DAYS} días de Premium gratis.
                </p>
              </>
            )}
            {canTrial && (
              <>
                <Button
                  size="lg"
                  className="press"
                  disabled={activate.isPending}
                  onClick={() => activate.mutate()}
                >
                  {activate.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Probar Premium gratis por {TRIAL_DAYS} días
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setSubscribeOpen(true)}
                >
                  O suscribirme directamente
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Sin tarjeta. Al terminar vuelves al plan gratuito automáticamente.
                </p>
              </>
            )}
            {signedIn === true && !isPremium && trialUsed && (
              <>
                <Button size="lg" className="press" onClick={() => setSubscribeOpen(true)}>
                  Suscribirme <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ya usaste tu prueba gratuita de {TRIAL_DAYS} días.
                </p>
              </>
            )}
            {onTrial && (
              <>
                <Button size="lg" className="press" onClick={() => setSubscribeOpen(true)}>
                  Suscribirme para continuar
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Asegura tu acceso antes de que termine la prueba.
                </p>
              </>
            )}
            {isPremium && !onTrial && (
              <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
                <BadgeCheck className="h-4 w-4" /> Ya tienes Premium
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Cómo funciona la prueba */}
      <section aria-label="Cómo funciona la prueba gratuita" className="mt-14">
        <div className="grid gap-4 rounded-2xl border border-border bg-secondary/30 p-6 sm:grid-cols-3 sm:p-8">
          {[
            {
              title: "Actívala cuando quieras",
              text: "Un click y tienes Premium completo. Sin tarjeta, sin formularios.",
            },
            {
              title: `${TRIAL_DAYS} días completos`,
              text: "Exámenes oficiales, simulacros de tu universidad, ranking y análisis de tiempo.",
            },
            {
              title: "Vuelves a gratis solo",
              text: "Si no te suscribes, tu cuenta regresa al plan gratuito automáticamente. Nada se cobra.",
            },
          ].map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <span className="font-data grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/40 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold">{s.title}</h3>
                <p className="mt-1 text-pretty text-sm text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla comparativa */}
      <section aria-label="Comparación de planes" className="mt-14">
        <h2 className="text-center font-display text-2xl font-bold">
          Todo lo que incluye cada plan
        </h2>
        <div
          ref={tableRef}
          className="mt-6 overflow-hidden rounded-2xl border border-border bg-card"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left">
                <th className="px-4 py-3 font-semibold sm:px-6">Funcionalidad</th>
                <th className="w-24 px-2 py-3 text-center font-semibold sm:w-32">Gratis</th>
                <th className="w-24 px-2 py-3 text-center font-semibold text-primary sm:w-32">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row, i) => (
                <tr
                  key={row.feature}
                  className={cn(
                    tableVisible && "animate-fade-up",
                    "border-b border-border last:border-b-0",
                  )}
                  style={
                    tableVisible ? ({ "--i": Math.min(i, 10) } as React.CSSProperties) : undefined
                  }
                >
                  <td className="px-4 py-3 sm:px-6">{row.feature}</td>
                  <td className="px-2 py-3 text-center">
                    {row.free === true ? (
                      <Check
                        className="mx-auto h-4 w-4 text-success"
                        strokeWidth={3}
                        aria-label="Incluido"
                      />
                    ) : row.free === "partial" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Minus className="h-3.5 w-3.5" aria-hidden /> {row.freeNote}
                      </span>
                    ) : (
                      <Lock
                        className="mx-auto h-4 w-4 text-muted-foreground/50"
                        aria-label="Solo Premium"
                      />
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Check
                      className="mx-auto h-4 w-4 text-success"
                      strokeWidth={3}
                      aria-label="Incluido"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-14 text-center">
        {signedIn === false ? (
          <Button asChild size="lg" className="press min-h-11">
            <Link to="/auth">
              Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : canTrial ? (
          <Button
            size="lg"
            className="press min-h-11"
            disabled={activate.isPending}
            onClick={() => activate.mutate()}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Activar mis {TRIAL_DAYS} días gratis
          </Button>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          ¿Dudas sobre los planes? Escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      {/* Suscripción: placeholder hasta integrar la pasarela de pago */}
      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" aria-hidden />
            </div>
            <DialogTitle className="text-center font-display text-2xl">
              Muy pronto podrás suscribirte aquí
            </DialogTitle>
            <DialogDescription className="text-center">
              Estamos habilitando los pagos en línea. Mientras tanto, escríbenos y te activamos
              Premium de forma manual — responde una persona real, rápido.
            </DialogDescription>
          </DialogHeader>
          <Button asChild size="lg" className="press">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Quiero%20suscribirme%20a%20Admi-Tec%20Premium`}
            >
              <Mail className="mr-2 h-4 w-4" /> Escribir a {CONTACT_EMAIL}
            </a>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Premium: S/ {PLAN_PRICES.monthly.amount}/mes o S/ {PLAN_PRICES.quarterly.amount}
            /trimestre.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
