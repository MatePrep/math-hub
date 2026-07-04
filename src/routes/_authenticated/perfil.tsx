import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { getFullProfile, updateFullProfile, listAllUniversities } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

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

  const qo = useMemo(
    () => queryOptions({ queryKey: ["full-profile"], queryFn: () => fetchProfile() }),
    [fetchProfile],
  );
  const { data } = useSuspenseQuery(qo);
  const universitiesQ = useQuery({
    queryKey: ["all-universities"],
    queryFn: () => universitiesFn(),
  });
  const allUniversities = universitiesQ.data ?? [];

  const [fullName, setFullName] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [career, setCareer] = useState("");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [weeklyGoalQuestions, setWeeklyGoalQuestions] = useState(50);
  const [weeklyGoalExams, setWeeklyGoalExams] = useState(2);
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = data?.profile;
    setFullName(p?.full_name ?? "");
    setPseudonym(p?.pseudonym ?? "");
    setCareer(p?.career ?? "");
    setLeaderboardOptIn(p?.leaderboard_opt_in ?? true);
    setWeeklyGoalQuestions(p?.weekly_goal_questions ?? 50);
    setWeeklyGoalExams(p?.weekly_goal_exams ?? 2);
    setUniversities(
      (data?.universities ?? []).map((u: any) => ({
        universityId: u.university_id,
        examDate: u.exam_date ?? "",
      })),
    );
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

        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
