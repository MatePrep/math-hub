import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        exerciseId: z.string().uuid(),
        selectedChoice: z.number().int().min(0).max(20),
        timeSpentMs: z
          .number()
          .int()
          .min(0)
          .max(60 * 60 * 1000)
          .default(0),
        examSessionId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Read the exercise's correct_choice on server to avoid client tampering
    const { data: ex, error: exErr } = await supabase
      .from("exercises")
      .select("correct_choice")
      .eq("id", data.exerciseId)
      .maybeSingle();
    if (exErr || !ex) throw new Error("Ejercicio no encontrado");
    const isCorrect = ex.correct_choice === data.selectedChoice;
    const { error } = await supabase.from("attempts").insert({
      user_id: userId,
      exercise_id: data.exerciseId,
      selected_choice: data.selectedChoice,
      is_correct: isCorrect,
      time_spent_ms: data.timeSpentMs,
      exam_session_id: data.examSessionId ?? null,
    });
    if (error) throw new Error(error.message);
    return { isCorrect, correctChoice: ex.correct_choice };
  });

export const getUserStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: attempts } = await supabase
      .from("attempts")
      .select(
        "id, is_correct, created_at, exercise:exercises(id, statement_md, topic:topics(slug,name))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = attempts ?? [];
    const total = rows.length;
    const correct = rows.filter((r) => r.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // by topic
    const byTopic = new Map<string, { name: string; total: number; correct: number }>();
    rows.forEach((r: any) => {
      const t = r.exercise?.topic;
      if (!t) return;
      const cur = byTopic.get(t.slug) ?? { name: t.name, total: 0, correct: 0 };
      cur.total += 1;
      if (r.is_correct) cur.correct += 1;
      byTopic.set(t.slug, cur);
    });
    const topicStats = Array.from(byTopic.entries()).map(([slug, v]) => ({
      slug,
      name: v.name,
      total: v.total,
      correct: v.correct,
      accuracy: Math.round((v.correct / v.total) * 100),
    }));

    // streak (consecutive days with at least 1 attempt)
    const days = new Set(rows.map((r) => new Date(r.created_at).toISOString().slice(0, 10)));
    let streak = 0;
    const d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    if (streak === 0 && days.size > 0) {
      // include yesterday if today is empty
      const y = new Date();
      y.setDate(y.getDate() - 1);
      while (days.has(y.toISOString().slice(0, 10))) {
        streak += 1;
        y.setDate(y.getDate() - 1);
      }
    }

    const recent = rows.slice(0, 10).map((r: any) => ({
      id: r.id,
      isCorrect: r.is_correct,
      createdAt: r.created_at,
      exerciseId: r.exercise?.id ?? null,
      statement: (r.exercise?.statement_md ?? "").slice(0, 120),
      topicName: r.exercise?.topic?.name ?? "—",
    }));

    return { total, correct, accuracy, streak, topicStats, recent };
  });
