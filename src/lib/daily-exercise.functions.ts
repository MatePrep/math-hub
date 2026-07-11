import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// Public landing-page "reto del día" widget: one exercise picked deterministically
// per calendar day (see get_daily_exercise() in the DB), the same for every visitor.
// correct_choice is intentionally not included here — grading happens server-side
// in submitDailyExerciseAnswer so the answer isn't sitting in the initial payload.
export const getDailyExercise = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.rpc("get_daily_exercise");
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return null;
  return {
    exerciseId: row.exercise_id,
    statementMd: row.statement_md,
    choices: row.choices as string[],
    difficulty: row.difficulty,
    topicName: row.topic_name,
    totalAnswers: row.total_answers,
    correctAnswers: row.correct_answers,
  };
});

export const submitDailyExerciseAnswer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ selectedChoice: z.number().int().min(0).max(9) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("submit_daily_exercise_answer", {
      _selected_choice: data.selectedChoice,
    });
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) throw new Error("No hay ejercicio disponible hoy");
    return {
      exerciseId: row.exercise_id,
      isCorrect: row.is_correct,
      correctChoice: row.correct_choice,
      totalAnswers: row.total_answers,
      correctAnswers: row.correct_answers,
    };
  });

export const dailyExerciseQO = queryOptions({
  queryKey: ["daily-exercise"],
  queryFn: () => getDailyExercise(),
});
