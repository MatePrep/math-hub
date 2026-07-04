import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getFullProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile, error: pErr }, { data: unis, error: uErr }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, target_university, pseudonym, career, leaderboard_opt_in, weekly_goal_questions, weekly_goal_exams",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("student_universities")
        .select("id, university_id, exam_date, university:universities(id, slug, short_name, name)")
        .eq("user_id", userId),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (uErr) throw new Error(uErr.message);
    return { profile, universities: unis ?? [] };
  });

export const listAllUniversities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("universities")
      .select("id, slug, short_name, name")
      .order("short_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Blocked words for pseudonyms: covers common Spanish/English vulgarity and slurs.
// Checked server-side (in addition to the format regex) so it can't be bypassed from the client.
const PSEUDONYM_BLOCKLIST = [
  "puta", "puto", "putita", "putito", "mierda", "pendejo", "pendeja", "cabron", "cabrona",
  "verga", "chinga", "chingar", "carajo", "culero", "culera", "maricon", "marica",
  "gilipollas", "hijueputa", "hdp", "conchatumadre", "conchasumadre", "conchesumadre",
  "huevon", "huevona", "malparido", "malparida", "estupido", "estupida", "idiota", "imbecil",
  "fuck", "shit", "bitch", "asshole", "bastard", "whore", "slut", "cunt", "nigger", "faggot",
  "nazi", "hitler",
];

function containsBlockedWord(value: string): boolean {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return PSEUDONYM_BLOCKLIST.some((word) => normalized.includes(word));
}

const updateSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  pseudonym: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_\-]+$/).nullable().optional(),
  career: z.string().trim().max(120).nullable().optional(),
  leaderboardOptIn: z.boolean().optional(),
  weeklyGoalQuestions: z.number().int().min(1).max(1000).optional(),
  weeklyGoalExams: z.number().int().min(0).max(50).optional(),
  universities: z
    .array(
      z.object({
        universityId: z.string().uuid(),
        examDate: z.string().nullable().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const updateFullProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    if (data.pseudonym && containsBlockedWord(data.pseudonym)) {
      throw new Error("Ese pseudónimo no está permitido. Elige otro que no contenga lenguaje ofensivo.");
    }

    // Check pseudonym uniqueness (case-insensitive)
    if (data.pseudonym) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("pseudonym", data.pseudonym)
        .neq("id", userId)
        .maybeSingle();
      if (existing) throw new Error("Ese pseudónimo ya está en uso. Elige otro.");
    }

    const patch: {
      full_name?: string;
      pseudonym?: string | null;
      career?: string | null;
      leaderboard_opt_in?: boolean;
      weekly_goal_questions?: number;
      weekly_goal_exams?: number;
    } = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.pseudonym !== undefined) patch.pseudonym = data.pseudonym;
    if (data.career !== undefined) patch.career = data.career;
    if (data.leaderboardOptIn !== undefined) patch.leaderboard_opt_in = data.leaderboardOptIn;
    if (data.weeklyGoalQuestions !== undefined) patch.weekly_goal_questions = data.weeklyGoalQuestions;
    if (data.weeklyGoalExams !== undefined) patch.weekly_goal_exams = data.weeklyGoalExams;


    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw new Error(error.message);
    }

    if (data.universities) {
      // Replace strategy: delete then insert
      await supabase.from("student_universities").delete().eq("user_id", userId);
      if (data.universities.length > 0) {
        const rows = data.universities.map((u) => ({
          user_id: userId,
          university_id: u.universityId,
          exam_date: u.examDate || null,
        }));
        const { error } = await supabase.from("student_universities").insert(rows);
        if (error) throw new Error(error.message);
      }
    }

    return { ok: true };
  });
