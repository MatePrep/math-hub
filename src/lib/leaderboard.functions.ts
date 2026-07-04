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
      avg_score: number;
      sessions_count: number;
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
      attempts_count: number;
      is_me: boolean;
    }>;
  });

export const listUniversitiesWithExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("universities")
      .select("id, slug, short_name, name")
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
