import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import {
  getFullProfile,
  updateFullProfile,
  listAllUniversities,
  PREP_TIME_VALUES,
  PREP_METHOD_VALUES,
} from "@/lib/profile.functions";
import { listTopics } from "@/lib/exercises.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

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

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil · MatePre" }] }),
  component: PerfilPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
});

type UniRow = { universityId: string; examDate: string };

function PerfilPage() {
  const fetchProfile = useServerFn(getFullProfile);
  const save = useServerFn(updateFullProfile);
  const universitiesFn = useServerFn(listAllUniversities);
  const topicsFn = useServerFn(listTopics);

  const qo = useMemo(
    () => queryOptions({ queryKey: ["full-profile"], queryFn: () => fetchProfile() }),
    [fetchProfile],
  );
  const { data } = useSuspenseQuery(qo);
  const universitiesQ = useQuery({
    queryKey: ["all-universities"],
    queryFn: () => universitiesFn(),
  });
  const topicsQ = useQuery({ queryKey: ["topics"], queryFn: () => topicsFn() });
  const allUniversities = universitiesQ.data ?? [];
  const allTopics = topicsQ.data ?? [];

  const [fullName, setFullName] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [career, setCareer] = useState("");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [weeklyGoalQuestions, setWeeklyGoalQuestions] = useState(50);
  const [weeklyGoalExams, setWeeklyGoalExams] = useState(2);
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [prepTime, setPrepTime] = useState<string | null>(null);
  const [prepMethod, setPrepMethod] = useState<string | null>(null);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState<string>("");
  const [weakTopicIds, setWeakTopicIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = data?.profile;
    setFullName(p?.full_name ?? "");
    setPseudonym(p?.pseudonym ?? "");
    setCareer(p?.career ?? "");
    setLeaderboardOptIn(p?.leaderboard_opt_in ?? true);
    setWeeklyGoalQuestions(p?.weekly_goal_questions ?? 50);
    setWeeklyGoalExams(p?.weekly_goal_exams ?? 2);
    setPrepTime(p?.prep_time ?? null);
    setPrepMethod(p?.prep_method ?? null);
    setWeeklyStudyHours(p?.weekly_study_hours != null ? String(p.weekly_study_hours) : "");
    setWeakTopicIds(p?.initial_weak_topic_ids ?? []);
    setUniversities(
      (data?.universities ?? []).map((u: any) => ({
        universityId: u.university_id,
        examDate: u.exam_date ?? "",
      })),
    );
  }, [data]);

  function toggleWeakTopic(id: string) {
    setWeakTopicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pseudonym && !/^[a-zA-Z0-9_-]{3,30}$/.test(pseudonym)) {
      toast.error("El pseudónimo debe tener 3-30 caracteres (letras, números, - o _)");
      return;
    }
    const seen = new Set<string>();
    for (const u of universities) {
      if (seen.has(u.universityId)) {
        toast.error("No puedes repetir la misma universidad");
        return;
      }
      seen.add(u.universityId);
    }
    setBusy(true);
    try {
      await save({
        data: {
          fullName,
          pseudonym: pseudonym.trim() || null,
          career: career.trim() || null,
          leaderboardOptIn,
          weeklyGoalQuestions,
          weeklyGoalExams,
          prepTime: prepTime as any,
          prepMethod: prepMethod as any,
          weeklyStudyHours: weeklyStudyHours ? Number(weeklyStudyHours) : null,
          initialWeakTopicIds: weakTopicIds,
          universities: universities.map((u) => ({
            universityId: u.universityId,
            examDate: u.examDate || null,
          })),
        },
      });
      toast.success("Perfil actualizado");
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Tu perfil</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="pseudonym">Pseudónimo (para el ranking)</Label>
          <Input
            id="pseudonym"
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            placeholder="ej. mate_crack99"
            maxLength={30}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Este nombre es el único que verán otros estudiantes en el ranking. Debe ser único.
          </p>
        </div>

        <div>
          <Label htmlFor="career">Carrera (opcional)</Label>
          <Input id="career" value={career} onChange={(e) => setCareer(e.target.value)} maxLength={120} />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
          <div>
            <Label htmlFor="ranking-opt-in" className="cursor-pointer">
              Participar en el ranking
            </Label>
            <p className="text-xs text-muted-foreground">
              Si lo desactivas, no aparecerás en el leaderboard de tu(s) universidad(es).
            </p>
          </div>
          <Switch id="ranking-opt-in" checked={leaderboardOptIn} onCheckedChange={setLeaderboardOptIn} />
        </div>

        <div>
          <Label className="text-base">Metas semanales</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="goal-questions" className="text-xs text-muted-foreground">
                Preguntas por semana
              </Label>
              <Input
                id="goal-questions"
                type="number"
                min={1}
                max={1000}
                value={weeklyGoalQuestions}
                onChange={(e) => setWeeklyGoalQuestions(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="goal-exams" className="text-xs text-muted-foreground">
                Simulacros por semana
              </Label>
              <Input
                id="goal-exams"
                type="number"
                min={0}
                max={50}
                value={weeklyGoalExams}
                onChange={(e) => setWeeklyGoalExams(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-base">Universidades objetivo</Label>
            <Button type="button" size="sm" variant="outline" onClick={addUniversityRow}>
              <Plus className="mr-1 h-3 w-3" /> Agregar
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Agrega una o varias. Si tienes la fecha de tu examen, indícala para ver la cuenta regresiva en tu panel.
          </p>
          <div className="mt-3 space-y-2">
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
        </div>

        <div>
          <Label className="text-base">Contexto de preparación</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Nos ayuda a personalizar tu experiencia. Todo aquí es opcional.
          </p>

          <div className="mt-3 space-y-4">
            <div>
              <Label htmlFor="prep-time" className="text-xs text-muted-foreground">
                ¿Cuánto tiempo llevas preparándote?
              </Label>
              <Select value={prepTime ?? undefined} onValueChange={setPrepTime}>
                <SelectTrigger id="prep-time">
                  <SelectValue placeholder="Sin definir" />
                </SelectTrigger>
                <SelectContent>
                  {PREP_TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prep-method" className="text-xs text-muted-foreground">
                ¿Cómo te has preparado hasta ahora?
              </Label>
              <Select value={prepMethod ?? undefined} onValueChange={setPrepMethod}>
                <SelectTrigger id="prep-method">
                  <SelectValue placeholder="Sin definir" />
                </SelectTrigger>
                <SelectContent>
                  {PREP_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hours" className="text-xs text-muted-foreground">
                ¿Cuántas horas a la semana puedes dedicar a estudiar?
              </Label>
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

            <div>
              <Label className="text-xs text-muted-foreground">
                ¿En qué temas sientes que necesitas más refuerzo?
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              <p className="mt-1 text-xs text-muted-foreground">
                Solo se usa como referencia inicial hasta que tengas historial propio de resultados.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
