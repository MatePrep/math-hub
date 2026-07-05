import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import {
  createExam,
  updateExam,
  listExerciseBank,
  listAdminMeta,
  getTopicQuestionCounts,
} from "@/lib/admin.functions";


type Status = "draft" | "published" | "archived";
type Order = "fixed" | "random";
type ExamType = "standard" | "template";
type Difficulty = "facil" | "medio" | "dificil";

export interface TemplateRule {
  topic_id: string;
  difficulty_filter: Difficulty | null;
  question_count: number;
}

export interface ExamFormValues {
  id?: string;
  title: string;
  description: string | null;
  university_id: string;
  time_limit_min: number;
  passing_score: number;
  max_attempts: number | null;
  status: Status;
  question_order: Order;
  exam_type: ExamType;
  allow_multiple_attempts: boolean;
  exercise_ids: string[];
  template_rules: TemplateRule[];
  points_correct: number;
  points_incorrect: number;
  points_empty: number;
}

const empty: ExamFormValues = {
  title: "",
  description: "",
  university_id: "",
  time_limit_min: 60,
  passing_score: 60,
  max_attempts: null,
  status: "draft",
  question_order: "fixed",
  exam_type: "standard",
  allow_multiple_attempts: false,
  exercise_ids: [],
  template_rules: [],
  points_correct: 1,
  points_incorrect: -1,
  points_empty: 0,
};

export function ExamForm({ initial }: { initial?: ExamFormValues }) {
  const navigate = useNavigate();
  const create = useServerFn(createExam);
  const update = useServerFn(updateExam);
  const bankFn = useServerFn(listExerciseBank);
  const metaFn = useServerFn(listAdminMeta);
  const countsFn = useServerFn(getTopicQuestionCounts);
  const bank = useQuery({ queryKey: ["exercise-bank"], queryFn: () => bankFn() });
  const meta = useQuery({ queryKey: ["admin-meta"], queryFn: () => metaFn() });

  const [v, setV] = useState<ExamFormValues>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  useEffect(() => {
    if (initial) setV({ ...empty, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const bankTopics = useMemo(() => {
    const map = new Map<string, string>();
    (bank.data ?? []).forEach((e: any) => {
      if (e.topic?.id) map.set(e.topic.id, e.topic.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [bank.data]);

  const allTopics: Array<{ id: string; name: string }> = (meta.data?.topics ?? []) as any;
  const allUniversities: Array<{ id: string; short_name: string; name: string }> = (meta.data?.universities ?? []) as any;

  const selectedSet = new Set(v.exercise_ids);
  const available = (bank.data ?? []).filter((e: any) => {
    if (selectedSet.has(e.id)) return false;
    if (topicFilter !== "all" && e.topic?.id !== topicFilter) return false;
    if (filter && !e.statement_md.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const selectedItems = v.exercise_ids
    .map((id) => (bank.data ?? []).find((e: any) => e.id === id))
    .filter(Boolean) as any[];

  function add(id: string) {
    setV((s) => ({ ...s, exercise_ids: [...s.exercise_ids, id] }));
  }
  function remove(id: string) {
    setV((s) => ({ ...s, exercise_ids: s.exercise_ids.filter((x) => x !== id) }));
  }
  function move(id: string, delta: number) {
    setV((s) => {
      const arr = [...s.exercise_ids];
      const i = arr.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, exercise_ids: arr };
    });
  }

  function addRule() {
    setV((s) => ({
      ...s,
      template_rules: [
        ...s.template_rules,
        { topic_id: allTopics[0]?.id ?? "", difficulty_filter: null, question_count: 5 },
      ],
    }));
  }
  function updateRule(i: number, patch: Partial<TemplateRule>) {
    setV((s) => ({
      ...s,
      template_rules: s.template_rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  }
  function removeRule(i: number) {
    setV((s) => ({ ...s, template_rules: s.template_rules.filter((_, idx) => idx !== i) }));
  }

  const templateTotal = useMemo(
    () => v.template_rules.reduce((sum, r) => sum + (Number(r.question_count) || 0), 0),
    [v.template_rules],
  );

  const availabilityPairs = useMemo(
    () =>
      v.exam_type === "template"
        ? v.template_rules
            .filter((r) => r.topic_id)
            .map((r) => ({ topic_id: r.topic_id, difficulty_filter: r.difficulty_filter }))
        : [],
    [v.exam_type, v.template_rules],
  );

  const availability = useQuery({
    queryKey: ["topic-question-counts", availabilityPairs],
    queryFn: () => countsFn({ data: { pairs: availabilityPairs } }),
    enabled: availabilityPairs.length > 0,
  });

  function availableFor(topicId: string, diff: Difficulty | null): number | null {
    const rows = availability.data ?? [];
    const match = rows.find(
      (r: any) => r.topic_id === topicId && (r.difficulty_filter ?? null) === (diff ?? null),
    );
    return match ? match.count : null;
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.university_id) {
      toast.error("Selecciona una universidad");
      return;
    }
    if (v.exam_type === "standard" && v.exercise_ids.length === 0) {
      toast.error("Añade al menos una pregunta");
      return;
    }
    if (v.exam_type === "template" && v.template_rules.length === 0) {
      toast.error("Añade al menos una regla");
      return;
    }
    if (v.exam_type === "template" && v.template_rules.some((r) => !r.topic_id || r.question_count < 1)) {
      toast.error("Cada regla necesita materia y cantidad ≥ 1");
      return;
    }
    if (v.exam_type === "template") {
      const shortages = v.template_rules
        .map((r) => ({ r, avail: availableFor(r.topic_id, r.difficulty_filter) }))
        .filter((x) => x.avail !== null && x.r.question_count > (x.avail as number));
      if (shortages.length > 0) {
        if (v.status === "published") {
          toast.error("No puedes publicar: algunas reglas piden más preguntas de las que existen en el banco.");
          return;
        }
        const ok = confirm(
          `Advertencia: ${shortages.length} regla(s) piden más preguntas de las disponibles. Puedes guardar como borrador; los estudiantes no podrán generar el examen hasta que agregues más ejercicios. ¿Continuar?`,
        );
        if (!ok) return;
      }
    }
    setSaving(true);

    try {
      const payload = {
        title: v.title,
        description: v.description || null,
        university_id: v.university_id,
        time_limit_min: Number(v.time_limit_min),
        passing_score: Number(v.passing_score),
        max_attempts: v.max_attempts ? Number(v.max_attempts) : null,
        status: v.status,
        question_order: v.question_order,
        exam_type: v.exam_type,
        allow_multiple_attempts: v.allow_multiple_attempts,
        exercise_ids: v.exam_type === "standard" ? v.exercise_ids : [],
        template_rules: v.exam_type === "template" ? v.template_rules : [],
        points_correct: Number(v.points_correct),
        points_incorrect: Number(v.points_incorrect),
        points_empty: Number(v.points_empty),
      };
      if (initial?.id) {
        await update({ data: { id: initial.id, ...payload } });
        toast.success("Examen actualizado");
      } else {
        await create({ data: payload });
        toast.success("Examen creado");
      }
      navigate({ to: "/admin/examenes" });
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Título *</Label>
          <Input value={v.title} onChange={(e) => setV((s) => ({ ...s, title: e.target.value }))} required maxLength={120} />
        </div>
        <div className="sm:col-span-2">
          <Label>Descripción</Label>
          <Textarea value={v.description ?? ""} onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))} rows={2} maxLength={1000} />
        </div>
        <div>
          <Label>Universidad *</Label>
          <Select value={v.university_id} onValueChange={(x) => setV((s) => ({ ...s, university_id: x }))}>
            <SelectTrigger><SelectValue placeholder="Selecciona una universidad" /></SelectTrigger>
            <SelectContent>
              {allUniversities.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.short_name ?? u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de examen *</Label>
          <Select value={v.exam_type} onValueChange={(x) => setV((s) => ({ ...s, exam_type: x as ExamType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Estándar (preguntas fijas)</SelectItem>
              <SelectItem value="template">Plantilla (aleatorio por materia)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tiempo (min) *</Label>
          <Input type="number" min={1} max={600} value={v.time_limit_min} onChange={(e) => setV((s) => ({ ...s, time_limit_min: Number(e.target.value) }))} required />
        </div>
        <div>
          <Label>Puntaje mínimo aprobatorio (puntos) *</Label>
          <Input type="number" min={0} max={100000} value={v.passing_score} onChange={(e) => setV((s) => ({ ...s, passing_score: Number(e.target.value) }))} required />
        </div>
        <div>
          <Label>Máx. intentos (opcional)</Label>
          <Input type="number" min={1} max={50} value={v.max_attempts ?? ""} onChange={(e) => setV((s) => ({ ...s, max_attempts: e.target.value ? Number(e.target.value) : null }))} placeholder="Sin límite" />
        </div>
        <div>
          <Label>Orden</Label>
          <Select value={v.question_order} onValueChange={(x) => setV((s) => ({ ...s, question_order: x as Order }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fijo</SelectItem>
              <SelectItem value="random">Aleatorio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={v.status} onValueChange={(x) => setV((s) => ({ ...s, status: x as Status }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3 rounded-md border border-border bg-card p-3">
          <Switch checked={v.allow_multiple_attempts} onCheckedChange={(c) => setV((s) => ({ ...s, allow_multiple_attempts: c }))} id="allow-multi" />
          <Label htmlFor="allow-multi" className="cursor-pointer">Permitir múltiples intentos (respeta "Máx. intentos" si lo defines)</Label>
        </div>

        <div className="sm:col-span-2 rounded-md border border-border bg-card p-3">
          <Label className="text-base">Puntaje por pregunta</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Propio de este examen — prellenado con +1 / -1 / 0, puedes ajustarlo solo para este examen.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Correcta</Label>
              <Input type="number" step="0.5" value={v.points_correct} onChange={(e) => setV((s) => ({ ...s, points_correct: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Incorrecta</Label>
              <Input type="number" step="0.5" value={v.points_incorrect} onChange={(e) => setV((s) => ({ ...s, points_incorrect: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vacía / sin responder</Label>
              <Input type="number" step="0.5" value={v.points_empty} onChange={(e) => setV((s) => ({ ...s, points_empty: Number(e.target.value) }))} required />
            </div>
          </div>
        </div>
      </div>

      {v.exam_type === "template" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold">
              Reglas de plantilla ({v.template_rules.length})
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Total: {templateTotal} preguntas</Badge>
              <Button type="button" size="sm" variant="outline" onClick={addRule} disabled={allTopics.length === 0}>
                <Plus className="mr-1 h-3 w-3" /> Añadir regla
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cada regla escoge N ejercicios aleatorios de una materia y (opcionalmente) una dificultad. Al iniciar, todas las preguntas se mezclan.
          </p>
          <div className="mt-3 space-y-2">
            {v.template_rules.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Aún no hay reglas.
              </p>
            )}
            {v.template_rules.map((r, i) => {
              const avail = r.topic_id ? availableFor(r.topic_id, r.difficulty_filter) : null;
              const insufficient = avail !== null && r.question_count > avail;
              return (
                <div
                  key={i}
                  className={`rounded-md border bg-card p-3 ${insufficient ? "border-destructive/60" : "border-border"}`}
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_120px_40px]">
                    <Select value={r.topic_id} onValueChange={(x) => updateRule(i, { topic_id: x })}>
                      <SelectTrigger><SelectValue placeholder="Materia" /></SelectTrigger>
                      <SelectContent>
                        {allTopics.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={r.difficulty_filter ?? "any"}
                      onValueChange={(x) => updateRule(i, { difficulty_filter: x === "any" ? null : (x as Difficulty) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquier dificultad</SelectItem>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={r.question_count}
                      onChange={(e) => updateRule(i, { question_count: Number(e.target.value) })}
                      aria-label="Cantidad"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(i)} aria-label="Quitar regla">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {r.topic_id && (
                    <p className={`mt-2 text-xs ${insufficient ? "text-destructive" : "text-muted-foreground"}`}>
                      {avail === null
                        ? "Consultando disponibilidad…"
                        : insufficient
                          ? `Solo hay ${avail} preguntas en el banco para este filtro. Añade más ejercicios o reduce la cantidad.`
                          : `Disponibles en el banco: ${avail}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      ) : (
        <>
          <div>
            <h3 className="font-display text-lg font-bold">Preguntas seleccionadas ({selectedItems.length})</h3>
            <div className="mt-2 space-y-2">
              {selectedItems.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Aún no has añadido preguntas.
                </p>
              )}
              {selectedItems.map((e, i) => (
                <div key={e.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                  <span className="w-6 text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.statement_md.slice(0, 100)}</p>
                    <div className="mt-1 flex gap-1 text-xs">
                      {e.topic?.name && <Badge variant="secondary">{e.topic.name}</Badge>}
                      <Badge variant="outline" className="capitalize">{e.difficulty}</Badge>
                      {e.university?.short_name && <Badge variant="outline">{e.university.short_name}</Badge>}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(e.id, -1)} disabled={i === 0} aria-label="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => move(e.id, 1)} disabled={i === selectedItems.length - 1} aria-label="Bajar">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(e.id)} aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold">Banco de ejercicios</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Input placeholder="Buscar…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los temas</SelectItem>
                  {bankTopics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto rounded-md border border-border p-2">
              {bank.isLoading && <p className="p-3 text-sm text-muted-foreground">Cargando…</p>}
              {available.map((e: any) => (
                <div key={e.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.statement_md.slice(0, 100)}</p>
                    <div className="mt-1 flex gap-1 text-xs">
                      {e.topic?.name && <Badge variant="secondary">{e.topic.name}</Badge>}
                      <Badge variant="outline" className="capitalize">{e.difficulty}</Badge>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => add(e.id)}>
                    <Plus className="mr-1 h-3 w-3" /> Añadir
                  </Button>
                </div>
              ))}
              {available.length === 0 && !bank.isLoading && (
                <p className="p-3 text-center text-sm text-muted-foreground">Sin resultados.</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : initial?.id ? "Actualizar" : "Crear examen"}</Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/examenes" })}>Cancelar</Button>
      </div>
    </form>
  );
}
