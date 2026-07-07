import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getUniversityLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ universityId: z.string().uuid(), limit: z.number().int().min(1).max(500).default(100) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("get_university_leaderboard", {
      _university_id: data.universityId,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      user_id: string;
      pseudonym: string;
      avg_accuracy: number;
      sessions_count: number;
      rank: number;
      total_count: number;
      is_me: boolean;
    }>;
  });

export const getExamLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ examId: z.string().uuid(), limit: z.number().int().min(1).max(500).default(100) }).parse(d),
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

export const listUniversitiesWithExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("universities")
      .select("id, slug, short_name, name")
      .eq("active", true)
      .order("short_name");
    if (error) throw new Error(error.message);
    return data ?? [];
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

// Minimum admission score reference for the ranking page: keyed off the
// caller's own career for the given university (student_universities.career_id),
// not a parameter — a student can only ever see their own comparison.
export const getMinScoreForRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ universityId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: link, error: linkErr } = await context.supabase
      .from("student_universities")
      .select("career_id, career:careers(id, name)")
      .eq("user_id", context.userId)
      .eq("university_id", data.universityId)
      .maybeSingle();
    if (linkErr) throw new Error(linkErr.message);
    if (!link?.career_id) {
      return { hasCareer: false as const, careerName: null, minScore: null };
    }
    const { data: scoreRow, error: scoreErr } = await context.supabase
      .from("min_admission_scores")
      .select("year, min_score")
      .eq("university_id", data.universityId)
      .eq("career_id", link.career_id)
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (scoreErr) throw new Error(scoreErr.message);
    return {
      hasCareer: true as const,
      careerName: (link.career as any)?.name ?? null,
      minScore: scoreRow ? { year: scoreRow.year, minScore: scoreRow.min_score } : null,
    };
  });

export const getMyBestScoreForUniversity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ universityId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("get_my_best_score_for_university", {
      _university_id: data.universityId,
    });
    if (error) throw new Error(error.message);
    const row = (rows ?? [])[0];
    return { bestScore: row?.best_score ?? null, sessionsCount: row?.sessions_count ?? 0 };
  });
