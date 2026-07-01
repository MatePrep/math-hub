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

const exerciseBase = z.object({
  topic_id: z.string().uuid(),
  subtopic_id: z.string().uuid().nullable().optional(),
  university_id: z.string().uuid().nullable().optional(),
  exam_year: z.number().int().min(1980).max(2100).nullable().optional(),
  difficulty: z.enum(["facil", "medio", "dificil"]),
  statement_md: z.string().trim().min(5).max(5000),
  statement_image_path: z.string().nullable().optional(),
  solution_image_path: z.string().nullable().optional(),
  choices: z.array(choiceSchema).min(2).max(8),
  correct_choice: z.number().int().min(0),
  solution_md: z.string().trim().min(1).max(8000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

const exerciseSchema = exerciseBase.refine((d) => d.correct_choice < d.choices.length, {
  message: "correct_choice fuera de rango",
  path: ["correct_choice"],
});

const exerciseUpdateSchema = exerciseBase.extend({ id: z.string().uuid() }).refine(
  (d) => d.correct_choice < d.choices.length,
  { message: "correct_choice fuera de rango", path: ["correct_choice"] },
);


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
      context.supabase.from("topics").select("id,name,slug,active,color").order("order"),
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
      statement_image_path: data.statement_image_path ?? null,
      solution_image_path: data.solution_image_path ?? null,
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
  .inputValidator((d) => exerciseUpdateSchema.parse(d))

  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      subtopic_id: rest.subtopic_id || null,
      university_id: rest.university_id || null,
      exam_year: rest.exam_year ?? null,
      statement_image_path: rest.statement_image_path ?? null,
      solution_image_path: rest.solution_image_path ?? null,
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

// ========== TOPICS (subjects) management ==========

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const listAdminTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("topics")
      .select("id, name, slug, description, color, active, order")
      .order("order");
    if (error) throw new Error(error.message);
    const { data: counts } = await context.supabase.from("exercises").select("topic_id");
    const map = new Map<string, number>();
    (counts ?? []).forEach((r: any) => map.set(r.topic_id, (map.get(r.topic_id) ?? 0) + 1));
    return (data ?? []).map((t: any) => ({ ...t, exerciseCount: map.get(t.id) ?? 0 }));
  });

export const createTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(2).max(60),
      description: z.string().trim().max(300).nullable().optional(),
      color: z.string().trim().max(20).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    // case-insensitive duplicate check
    const { data: existing } = await context.supabase
      .from("topics")
      .select("id, name")
      .ilike("name", data.name)
      .maybeSingle();
    if (existing) {
      return { id: existing.id as string, duplicated: true };
    }
    let slug = slugify(data.name);
    if (!slug) slug = `tema-${Date.now()}`;
    // ensure unique slug
    const { data: bySlug } = await context.supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (bySlug) slug = `${slug}-${Date.now().toString(36)}`;
    const { data: maxOrderRow } = await context.supabase
      .from("topics")
      .select("order")
      .order("order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxOrderRow?.order ?? 0) + 1;
    const { data: row, error } = await context.supabase
      .from("topics")
      .insert({
        name: data.name,
        slug,
        description: data.description ?? null,
        color: data.color ?? null,
        order: nextOrder,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, duplicated: false };
  });

export const renameTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(2).max(60),
      description: z.string().trim().max(300).nullable().optional(),
      color: z.string().trim().max(20).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("topics")
      .update({
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTopicActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("topics")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { count } = await context.supabase
      .from("exercises")
      .select("id", { head: true, count: "exact" })
      .eq("topic_id", data.id);
    if ((count ?? 0) > 0) {
      throw new Error(`No se puede eliminar: la materia tiene ${count} ejercicios. Desactívala en su lugar.`);
    }
    const { error } = await context.supabase.from("topics").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ========== EXAMS management ==========

const examSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  time_limit_min: z.number().int().min(1).max(600),
  passing_score: z.number().int().min(0).max(100),
  max_attempts: z.number().int().min(1).max(50).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  question_order: z.enum(["fixed", "random"]),
  exercise_ids: z.array(z.string().uuid()).min(1).max(200),
});

const examUpdateSchema = examSchema.extend({ id: z.string().uuid() });


export const listAdminExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("exams")
      .select("id, title, status, time_limit_min, created_at, exam_questions(count), exam_sessions(count)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((e: any) => ({
      ...e,
      questionCount: e.exam_questions?.[0]?.count ?? 0,
      attemptCount: e.exam_sessions?.[0]?.count ?? 0,
    }));
  });

export const getAdminExam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: exam, error } = await context.supabase
      .from("exams")
      .select("*, exam_questions(exercise_id, position)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!exam) return null;
    const { count: attemptCount } = await context.supabase
      .from("exam_sessions")
      .select("id", { head: true, count: "exact" })
      .eq("exam_id", data.id);
    const exercise_ids = (exam.exam_questions ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((q: any) => q.exercise_id);
    return { ...exam, exercise_ids, attemptCount: attemptCount ?? 0 };
  });

export const listExerciseBank = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("exercises")
      .select("id, statement_md, difficulty, topic:topics(id,name), university:universities(short_name)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => examSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("exams")
      .insert({
        title: data.title,
        description: data.description ?? null,
        time_limit_min: data.time_limit_min,
        passing_score: data.passing_score,
        max_attempts: data.max_attempts ?? null,
        status: data.status,
        question_order: data.question_order,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const inserts = data.exercise_ids.map((eid, i) => ({
      exam_id: row.id,
      exercise_id: eid,
      position: i,
      points: 1,
    }));
    const { error: qErr } = await context.supabase.from("exam_questions").insert(inserts);
    if (qErr) throw new Error(qErr.message);
    return { id: row.id as string };
  });

export const updateExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid() }).and(examSchema).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, exercise_ids, ...rest } = data;
    const { error } = await context.supabase
      .from("exams")
      .update({
        title: rest.title,
        description: rest.description ?? null,
        time_limit_min: rest.time_limit_min,
        passing_score: rest.passing_score,
        max_attempts: rest.max_attempts ?? null,
        status: rest.status,
        question_order: rest.question_order,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    // Replace exam_questions
    await context.supabase.from("exam_questions").delete().eq("exam_id", id);
    const inserts = exercise_ids.map((eid, i) => ({
      exam_id: id,
      exercise_id: eid,
      position: i,
      points: 1,
    }));
    const { error: qErr } = await context.supabase.from("exam_questions").insert(inserts);
    if (qErr) throw new Error(qErr.message);
    return { id };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
