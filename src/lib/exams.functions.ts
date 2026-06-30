import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublishedExams = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("exams")
    .select("id, title, description, time_limit_min, passing_score, max_attempts, status, exam_questions(count)")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e: any) => ({
    ...e,
    questionCount: e.exam_questions?.[0]?.count ?? 0,
  }));
});

export const getExamPreview = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: exam, error } = await sb
      .from("exams")
      .select("id, title, description, time_limit_min, passing_score, max_attempts, status, question_order, exam_questions(count)")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!exam) return null;
    return { ...exam, questionCount: (exam as any).exam_questions?.[0]?.count ?? 0 };
  });

export const getMyExamAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ examId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("exam_sessions")
      .select("id, status, started_at, finished_at, score, total")
      .eq("user_id", userId)
      .eq("exam_id", data.examId)
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const startExamSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ examId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Check for resumable in-progress session
    const { data: ongoing } = await supabase
      .from("exam_sessions")
      .select("id, started_at, time_limit_min")
      .eq("user_id", userId)
      .eq("exam_id", data.examId)
      .eq("status", "in_progress")
      .maybeSingle();
    if (ongoing) {
      const elapsed = (Date.now() - new Date(ongoing.started_at as string).getTime()) / 60000;
      if (elapsed < (ongoing.time_limit_min ?? 60)) {
        return { sessionId: ongoing.id as string };
      }
      // expired: auto-finalize
      await supabase
        .from("exam_sessions")
        .update({ status: "submitted", finished_at: new Date().toISOString() })
        .eq("id", ongoing.id);
    }

    // Load exam + questions
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select("id, status, time_limit_min, max_attempts, question_order, exam_questions(exercise_id, position)")
      .eq("id", data.examId)
      .maybeSingle();
    if (examErr) throw new Error(examErr.message);
    if (!exam || exam.status !== "published") throw new Error("Examen no disponible");

    // Enforce max attempts (excluding in-progress just expired)
    if (exam.max_attempts) {
      const { count } = await supabase
        .from("exam_sessions")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("exam_id", exam.id)
        .in("status", ["submitted", "graded"]);
      if ((count ?? 0) >= exam.max_attempts) {
        throw new Error("Ya alcanzaste el máximo de intentos para este examen.");
      }
    }

    let questionIds = (exam.exam_questions ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((q: any) => q.exercise_id as string);
    if (questionIds.length === 0) throw new Error("El examen no tiene preguntas.");
    if (exam.question_order === "random") {
      questionIds = [...questionIds].sort(() => Math.random() - 0.5);
    }

    const { data: row, error } = await supabase
      .from("exam_sessions")
      .insert({
        user_id: userId,
        exam_id: exam.id,
        status: "in_progress",
        answers: {},
        flagged: [],
        question_ids: questionIds,
        time_limit_min: exam.time_limit_min,
        total: questionIds.length,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: row.id as string };
  });

export const getExamSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("*, exam:exams(id, title, time_limit_min, passing_score)")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Sesión no encontrada");

    const ids: string[] = (session.question_ids ?? []) as any;
    let questions: any[] = [];
    if (ids.length) {
      const { data: exs } = await supabase
        .from("exercises")
        .select("id, statement_md, statement_image_path, choices, topic:topics(name)")
        .in("id", ids);
      const byId = new Map((exs ?? []).map((e: any) => [e.id, e]));
      questions = ids.map((id) => byId.get(id)).filter(Boolean);
    }
    return { session, questions };
  });

export const saveExamAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      sessionId: z.string().uuid(),
      answers: z.record(z.string(), z.number().int().min(0).max(20)),
      flagged: z.array(z.string().uuid()).max(500),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("exam_sessions")
      .update({ answers: data.answers, flagged: data.flagged })
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .eq("status", "in_progress");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitExamSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      sessionId: z.string().uuid(),
      answers: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("id, status, question_ids, answers, exam_id")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Sesión no encontrada");
    if (session.status !== "in_progress") {
      return { score: session as any };
    }

    const finalAnswers: Record<string, number> = data.answers ?? (session.answers as any) ?? {};
    const ids: string[] = (session.question_ids ?? []) as any;

    const { data: exs } = await supabase
      .from("exercises")
      .select("id, correct_choice")
      .in("id", ids);
    const correctMap = new Map((exs ?? []).map((e: any) => [e.id, e.correct_choice]));

    let correctCount = 0;
    const attemptInserts = ids.map((id) => {
      const selected = finalAnswers[id];
      const correct = correctMap.get(id);
      const isCorrect = selected !== undefined && selected === correct;
      if (isCorrect) correctCount += 1;
      return {
        user_id: userId,
        exercise_id: id,
        selected_choice: selected ?? -1,
        is_correct: isCorrect,
        time_spent_ms: 0,
        exam_session_id: session.id,
      };
    }).filter((a) => a.selected_choice >= 0);

    if (attemptInserts.length) {
      await supabase.from("attempts").insert(attemptInserts);
    }

    const total = ids.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    await supabase
      .from("exam_sessions")
      .update({
        status: "graded",
        finished_at: new Date().toISOString(),
        answers: finalAnswers,
        score: scorePct,
        total,
      })
      .eq("id", session.id);

    return { score: scorePct, total, correctCount };
  });

export const getExamResult = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("*, exam:exams(id, title, passing_score)")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Sesión no encontrada");
    const ids: string[] = (session.question_ids ?? []) as any;
    const { data: exs } = await supabase
      .from("exercises")
      .select("id, statement_md, choices, correct_choice, solution_md")
      .in("id", ids);
    const byId = new Map((exs ?? []).map((e: any) => [e.id, e]));
    const questions = ids.map((id) => byId.get(id)).filter(Boolean);
    return { session, questions };
  });
