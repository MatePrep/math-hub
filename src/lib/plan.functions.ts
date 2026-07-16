import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanStatus = {
  planType: "free" | "premium";
  trialUsed: boolean;
  trialEndsAt: string | null;
  isPremium: boolean;
  /** Premium temporal por prueba gratuita (trial_ends_at seteado y vigente). */
  onTrial: boolean;
  /** Días restantes de la prueba (redondeado hacia arriba), null si no hay prueba activa. */
  trialDaysLeft: number | null;
};

function toStatus(raw: unknown): PlanStatus {
  const r = (raw ?? {}) as { plan_type?: string; trial_used?: boolean; trial_ends_at?: string };
  const planType = r.plan_type === "premium" ? "premium" : "free";
  const trialEndsAt = r.trial_ends_at ?? null;
  const isPremium = planType === "premium";
  const onTrial = isPremium && trialEndsAt !== null;
  const trialDaysLeft = onTrial
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  return {
    planType,
    trialUsed: r.trial_used === true,
    trialEndsAt,
    isPremium,
    onTrial,
    trialDaysLeft,
  };
}

// Cuerpo compartido de getPlanStatus, extraído para que assertPremium
// (src/lib/premium-guard.ts) pueda reusar exactamente la misma lógica de
// "revertir una prueba vencida antes de responder" sin duplicarla ni pagar
// un round-trip RPC aparte cada vez que un server function premium la llama.
export async function getPlanStatusRaw(context: { supabase: any; userId: string }) {
  const { supabase, userId } = context;
  const { data, error } = await supabase.rpc("get_plan_status");
  if (error) throw new Error(error.message);
  const status = toStatus(data);

  if (status.onTrial && status.trialDaysLeft !== null && status.trialDaysLeft <= 2) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("kind", "trial_expiring")
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("notifications").insert({
        user_id: userId,
        kind: "trial_expiring",
        title:
          status.trialDaysLeft <= 1
            ? "Tu prueba de Premium termina hoy"
            : `Tu prueba de Premium termina en ${status.trialDaysLeft} días`,
        body: "Suscríbete para no perder los exámenes oficiales, los simulacros de tu universidad y tu posición en el ranking.",
      });
    }
  }

  return status;
}

// Estado del plan. La RPC (SECURITY DEFINER) revierte una prueba vencida antes
// de responder, así que ningún cliente ve premium ya expirado. De paso genera
// el aviso in-app de "tu prueba está por vencer" (1-2 días antes, idempotente
// por día, mismo patrón que regenerateNotifications).
export const getPlanStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getPlanStatusRaw(context));

export const activatePremiumTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("activate_premium_trial");
    if (error) {
      if (error.message.includes("trial already used")) {
        throw new Error("Ya usaste tu prueba gratuita de Premium.");
      }
      if (error.message.includes("already premium")) {
        throw new Error("Ya tienes Premium activo.");
      }
      throw new Error(error.message);
    }
    return toStatus(data);
  });
