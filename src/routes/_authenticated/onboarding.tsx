import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import {
  getFullProfile,
  updateFullProfile,
  listAllUniversities,
  PREP_TIME_VALUES,
  PREP_METHOD_VALUES,
} from "@/lib/profile.functions";
import { listTopics } from "@/lib/exercises.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bienvenido · MatePre" }] }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 5;

const PREP_TIME_OPTIONS: Array<{ value: (typeof PREP_TIME_VALUES)[number]; label: string }> = [
  { value: "recien_empiezo", label: "Recién empiezo" },
  { value: "menos_3_meses", label: "Menos de 3 meses" },
  { value: "3_a_6_meses", label: "3 a 6 meses" },
  { value: "mas_6_meses", label: "Más de 6 meses" },
];

const PREP_METHOD_OPTIONS: Array<{ value: (typeof PREP_METHOD_VALUES)[number]; label: string }> = [
  { value: "academia", label: "Academia preuniversitaria" },
  { value: "autodidacta", label: "Autodidacta" },
  { value: "colegio_particular", label: "Colegio / profesores particulares" },
  { value: "primera_vez", label: "Esta es mi primera preparación formal" },
];

type UniRow = { universityId: string; examDate: string };

const profileQO = (fetchProfile: () => Promise<any>) =>
  queryOptions({ queryKey: ["full-profile"], queryFn: () => fetchProfile() });

function OnboardingPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getFullProfile);
  const save = useServerFn(updateFullProfile);
  const universitiesFn = useServerFn(listAllUniversities);
  const topicsFn = useServerFn(listTopics);

  const qo = useMemo(() => profileQO(fetchProfile), [fetchProfile]);
  const { data } = useSuspenseQuery(qo);
  const universitiesQ = useQuery({ queryKey: ["all-universities"], queryFn: () => universitiesFn() });
  const topicsQ = useQuery({ queryKey: ["topics"], queryFn: () => topicsFn() });
  const allUniversities = universitiesQ.data ?? [];
  const allTopics = topicsQ.data ?? [];

  const [step, setStep] = useState(1);
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [prepTime, setPrepTime] = useState<string | null>(null);
  const [prepMethod, setPrepMethod] = useState<string | null>(null);
  const [career, setCareer] = useState("");
  const [weakTopicIds, setWeakTopicIds] = useState<string[]>([]);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data?.profile?.onboarding_completed) {
      navigate({ to: "/panel", replace: true });
      return;
    }
    setUniversities(
      (data?.universities ?? []).map((u: any) => ({
        universityId: u.university_id,
        examDate: u.exam_date ?? "",
      })),
    );
    setPrepTime(data?.profile?.prep_time ?? null);
    setPrepMethod(data?.profile?.prep_method ?? null);
    setCareer(data?.profile?.career ?? "");
    setWeakTopicIds(data?.profile?.initial_weak_topic_ids ?? []);
    setWeeklyStudyHours(
      data?.profile?.weekly_study_hours != null ? String(data.profile.weekly_study_hours) : "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function addUniversityRow() {
    const used = new Set(universities.map((u) => u.universityId));
    const next = allUniversities.find((u: any) => !used.has(u.id));
    if (!next) {
      toast.error("Ya agregaste todas las universidades disponibles");
      return;
    }
    setUniversities((rows) => [...rows, { universityId: next.id, examDate: "" }]);
  }
  function updateUniversityRow(index: number, patch: Partial<UniRow>) {
    setUniversities((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeUniversityRow(index: number) {
    setUniversities((rows) => rows.filter((_, i) => i !== index));
  }
  function toggleWeakTopic(id: string) {
    setWeakTopicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function finish() {
    setSubmitting(true);
    try {
      await save({
        data: {
          universities: universities.map((u) => ({
            universityId: u.universityId,
            examDate: u.examDate || null,
          })),
          prepTime: prepTime as any,
          prepMethod: prepMethod as any,
          career: career.trim() || null,
          weeklyStudyHours: weeklyStudyHours ? Number(weeklyStudyHours) : null,
          initialWeakTopicIds: weakTopicIds,
          onboardingCompleted: true,
        },
      });
      toast.success("¡Listo! Ya puedes empezar a practicar.");
      navigate({ to: "/panel", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo guardar tu información");
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const canProceedStep1 = universities.length > 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Cuéntanos sobre ti</h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Unas preguntas rápidas para personalizar tu experiencia. Paso {step} de {TOTAL_STEPS}.
      </p>
      <Progress value={(step / TOTAL_STEPS) * 100} className="mt-4" />

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        {step === 1 && (
          <div>
            <h2 className="font-display text-lg font-bold">¿A qué universidad(es) buscas postular?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agrega al menos una. Si conoces la fecha de tu examen, indícala para tu cuenta regresiva.
            </p>
            <div className="mt-4 space-y-2">
              {universities.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Aún no agregaste ninguna universidad.
                </p>
              )}
              {universities.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={row.universityId}
                    onValueChange={(v) => updateUniversityRow(i, { universityId: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Universidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUniversities.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.short_name ?? u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    className="w-40"
                    value={row.examDate}
                    onChange={(e) => updateUniversityRow(i, { examDate: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeUniversityRow(i)} aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={addUniversityRow}>
              <Plus className="mr-1 h-3 w-3" /> Agregar universidad
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-lg font-bold">¿Cuánto tiempo llevas preparándote?</h2>
            <div className="mt-4 space-y-2">
              {PREP_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrepTime(opt.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    prepTime === opt.value
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-lg font-bold">¿Cómo te has preparado hasta ahora?</h2>
            <div className="mt-4 space-y-2">
              {PREP_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrepMethod(opt.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    prepMethod === opt.value
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-lg font-bold">¿A qué carrera te gustaría postular?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Opcional.</p>
            <div className="mt-4">
              <Label htmlFor="career">Carrera</Label>
              <Input
                id="career"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="ej. Ingeniería Civil"
                maxLength={120}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-display text-lg font-bold">¿En qué temas sientes que necesitas más refuerzo?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nos ayuda a sugerirte por dónde empezar mientras acumulas tu propio historial.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allTopics.map((t: any) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                >
                  <Checkbox
                    checked={weakTopicIds.includes(t.id)}
                    onCheckedChange={() => toggleWeakTopic(t.id)}
                  />
                  {t.name}
                </label>
              ))}
            </div>

            <div className="mt-6">
              <Label htmlFor="hours">¿Cuántas horas a la semana puedes dedicar a estudiar?</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                max={168}
                value={weeklyStudyHours}
                onChange={(e) => setWeeklyStudyHours(e.target.value)}
                placeholder="ej. 10"
                className="max-w-[140px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
              Atrás
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && step < TOTAL_STEPS && (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s + 1)} disabled={submitting}>
              Omitir por ahora
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !canProceedStep1}
            >
              Siguiente
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={finish} disabled={submitting}>
                Omitir y terminar
              </Button>
              <Button type="button" onClick={finish} disabled={submitting}>
                {submitting ? "Guardando…" : "Empezar a practicar"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
