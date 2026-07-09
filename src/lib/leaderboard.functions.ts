import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getExamLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ examId: z.string().uuid(), limit: z.number().int().min(1).max(500).default(100) })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("get_exam_leaderboard", {
      _exam_id: data.examId,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      user_id: string;
      pseudonym: string;
      best_score: number;
      max_score: number;
      attempts_count: number;
      rank: number;
      total_count: number;
      is_me: boolean;
    }>;
  });

export const listPublishedExamsForRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exams")
      .select("id, title, university:universities(id, short_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Optional benchmark ("puntaje mínimo de ingreso") set by an admin on any
// combination of university/exam/career — most exams resolve to none, in
// which case the ranking page simply shows nothing. Resolves the caller's
// own university/career context for this exam server-side (via their
// `student_universities` link) so the client only ever passes an examId;
// `get_applicable_min_score` then picks the most specific matching row.
export const getExamMinScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ examId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: exam } = await context.supabase
      .from("exams")
      .select("university_id")
      .eq("id", data.examId)
      .maybeSingle();
    const universityId = exam?.university_id ?? null;

    let careerId: string | null = null;
    if (universityId) {
      const { data: su } = await context.supabase
        .from("student_universities")
        .select("career_id")
        .eq("user_id", context.userId)
        .eq("university_id", universityId)
        .maybeSingle();
      careerId = su?.career_id ?? null;
    }

    const { data: minScore, error } = await context.supabase.rpc("get_applicable_min_score", {
      _exam_id: data.examId,
      _university_id: universityId,
      _career_id: careerId,
    });
    if (error) throw new Error(error.message);
    return { minScore: (minScore as number | null) ?? null };
  });
