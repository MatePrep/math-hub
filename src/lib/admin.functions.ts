import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

const choiceSchema = z.string().trim().min(1).max(500);

const exerciseSchema = z.object({
  topic_id: z.string().uuid(),
  subtopic_id: z.string().uuid().nullable().optional(),
  university_id: z.string().uuid().nullable().optional(),
  exam_year: z.number().int().min(1980).max(2100).nullable().optional(),
  difficulty: z.enum(["facil", "medio", "dificil"]),
  statement_md: z.string().trim().min(5).max(5000),
  choices: z.array(choiceSchema).min(2).max(8),
  correct_choice: z.number().int().min(0),
  solution_md: z.string().trim().min(1).max(8000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
}).refine((d) => d.correct_choice < d.choices.length, {
  message: "correct_choice fuera de rango",
  path: ["correct_choice"],
});

export const listAdminExercises = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("exercises")
      .select(
        "id, statement_md, difficulty, exam_year, created_at, topic:topics(name,slug), university:universities(short_name), subtopic:subtopics(name)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminExercise = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("exercises")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAdminMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [topics, subtopics, universities] = await Promise.all([
      context.supabase.from("topics").select("id,name,slug").order("order"),
      context.supabase.from("subtopics").select("id,name,topic_id").order("order"),
      context.supabase.from("universities").select("id,short_name,name").order("short_name"),
    ]);
    if (topics.error) throw new Error(topics.error.message);
    if (subtopics.error) throw new Error(subtopics.error.message);
    if (universities.error) throw new Error(universities.error.message);
    return {
      topics: topics.data ?? [],
      subtopics: subtopics.data ?? [],
      universities: universities.data ?? [],
    };
  });

export const createExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => exerciseSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const payload = {
      topic_id: data.topic_id,
      subtopic_id: data.subtopic_id || null,
      university_id: data.university_id || null,
      exam_year: data.exam_year ?? null,
      difficulty: data.difficulty,
      statement_md: data.statement_md,
      choices: data.choices,
      correct_choice: data.correct_choice,
      solution_md: data.solution_md,
      tags: data.tags ?? [],
    };
    const { data: row, error } = await context.supabase
      .from("exercises")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid() }).and(exerciseSchema).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      subtopic_id: rest.subtopic_id || null,
      university_id: rest.university_id || null,
      exam_year: rest.exam_year ?? null,
      tags: rest.tags ?? [],
    };
    const { error } = await context.supabase
      .from("exercises")
      .update(payload)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("exercises").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
