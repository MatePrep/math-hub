import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listTopics = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("topics")
    .select("id, slug, name, description, icon, order, color")
    .eq("active", true)
    .order("order");
  if (error) throw new Error(error.message);
  const { data: counts } = await sb.from("exercises").select("topic_id");
  const map = new Map<string, number>();
  (counts ?? []).forEach((r) => map.set(r.topic_id, (map.get(r.topic_id) ?? 0) + 1));
  return (data ?? []).map((t) => ({ ...t, exerciseCount: map.get(t.id) ?? 0 }));
});

export const listUniversities = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("universities")
    .select("id, slug, name, short_name, description")
    .eq("active", true)
    .order("short_name");
  if (error) throw new Error(error.message);
  const { data: counts } = await sb.from("exercises").select("university_id");
  const map = new Map<string, number>();
  (counts ?? []).forEach((r) => {
    if (r.university_id) map.set(r.university_id, (map.get(r.university_id) ?? 0) + 1);
  });
  return (data ?? []).map((u) => ({ ...u, exerciseCount: map.get(u.id) ?? 0 }));
});

const topicInput = z.object({ slug: z.string() });

export const getTopicBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => topicInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: topic, error } = await sb
      .from("topics")
      .select("id, slug, name, description, icon")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!topic) return null;
    const { data: subtopics } = await sb
      .from("subtopics")
      .select("id, slug, name, order")
      .eq("topic_id", topic.id)
      .order("order");
    return { ...topic, subtopics: subtopics ?? [] };
  });

const subtopicFreqInput = z.object({
  topicSlug: z.string(),
  universityId: z.string().uuid(),
  yearsBack: z.number().int().min(1).max(50).default(10),
});

export const getSubtopicFrequency = createServerFn({ method: "GET" })
  .inputValidator((d) => subtopicFreqInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const cutoffYear = new Date().getFullYear() - data.yearsBack + 1;
    const { data: rows, error } = await sb
      .from("exercises")
      .select("subtopic_id, exam_year, topic:topics!inner(slug)")
      .eq("topics.slug", data.topicSlug)
      .eq("university_id", data.universityId)
      .not("exam_year", "is", null)
      .gte("exam_year", cutoffYear);
    if (error) throw new Error(error.message);
    const map = new Map<string, number>();
    (rows ?? []).forEach((r) => {
      if (r.subtopic_id) map.set(r.subtopic_id, (map.get(r.subtopic_id) ?? 0) + 1);
    });
    return Object.fromEntries(map);
  });

const exFilters = z.object({
  topicSlug: z.string().optional(),
  subtopicSlug: z.string().optional(),
  universitySlug: z.string().optional(),
  difficulty: z.enum(["facil", "medio", "dificil"]).optional(),
  year: z.number().int().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listExercises = createServerFn({ method: "GET" })
  .inputValidator((d) => exFilters.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Force an inner join on subtopics only when filtering by it, so `.eq("subtopics.slug", ...)`
    // takes effect — otherwise leave it a left join so exercises without a subtopic still show up.
    const subtopicEmbed = data.subtopicSlug ? "subtopics!inner(slug,name)" : "subtopics(slug,name)";
    let q = sb
      .from("exercises")
      .select(
        `id, statement_md, statement_image_path, difficulty, exam_year, tags, choices, correct_choice, topic:topics!inner(slug,name), subtopic:${subtopicEmbed}, university:universities(slug,short_name)`,
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.topicSlug) q = q.eq("topics.slug", data.topicSlug);
    if (data.subtopicSlug) q = q.eq("subtopics.slug", data.subtopicSlug);
    if (data.difficulty) q = q.eq("difficulty", data.difficulty);
    if (data.year) q = q.eq("exam_year", data.year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let result = rows ?? [];
    if (data.universitySlug) {
      result = result.filter((r: any) => r.university?.slug === data.universitySlug);
    }
    return result;
  });

export const getExercise = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ex, error } = await sb
      .from("exercises")
      .select(
        "id, statement_md, statement_image_path, choices, correct_choice, solution_md, difficulty, exam_year, tags, topic:topics(slug,name), subtopic:subtopics(slug,name), university:universities(slug,short_name,name)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return ex;
  });

export const searchExercises = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const term = `%${data.q.replace(/[%_]/g, "")}%`;
    const { data: rows, error } = await sb
      .from("exercises")
      .select(
        "id, statement_md, difficulty, exam_year, topic:topics(slug,name), university:universities(slug,short_name)",
      )
      .ilike("statement_md", term)
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUniversityBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => topicInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: u, error } = await sb
      .from("universities")
      .select("id, slug, name, short_name, description")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return u;
  });
