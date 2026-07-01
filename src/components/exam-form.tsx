import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/lib/admin.functions";

type Status = "draft" | "published" | "archived";
type Order = "fixed" | "random";

export interface ExamFormValues {
  id?: string;
  title: string;
  description: string | null;
  time_limit_min: number;
  passing_score: number;
  max_attempts: number | null;
  status: Status;
  question_order: Order;
  exercise_ids: string[];
}

const empty: ExamFormValues = {
  title: "",
  description: "",
  time_limit_min: 60,
  passing_score: 60,
  max_attempts: null,
  status: "draft",
  question_order: "fixed",
  exercise_ids: [],
};

export function ExamForm({ initial }: { initial?: ExamFormValues }) {
  const navigate = useNavigate();
  const create = useServerFn(createExam);
  const update = useServerFn(updateExam);
  const bankFn = useServerFn(listExerciseBank);
  const bank = useQuery({ queryKey: ["exercise-bank"], queryFn: () => bankFn() });

  const [v, setV] = useState<ExamFormValues>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  useEffect(() => {
    if (initial) setV(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const topics = useMemo(() => {
    const map = new Map<string, string>();
    (bank.data ?? []).forEach((e: any) => {
      if (e.topic?.id) map.set(e.topic.id, e.topic.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [bank.data]);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (v.exercise_ids.length === 0) {
      toast.error("Añade al menos una pregunta");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: v.title,
        description: v.description || null,
        time_limit_min: Number(v.time_limit_min),
        passing_score: Number(v.passing_score),
        max_attempts: v.max_attempts ? Number(v.max_attempts) : null,
        status: v.status,
        question_order: v.question_order,
        exercise_ids: v.exercise_ids,
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
          <Label>Tiempo (min) *</Label>
          <Input type="number" min={1} max={600} value={v.time_limit_min} onChange={(e) => setV((s) => ({ ...s, time_limit_min: Number(e.target.value) }))} required />
        </div>
        <div>
          <Label>Puntaje aprobatorio (%) *</Label>
          <Input type="number" min={0} max={100} value={v.passing_score} onChange={(e) => setV((s) => ({ ...s, passing_score: Number(e.target.value) }))} required />
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
      </div>

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
              {topics.map((t) => (
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

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : initial?.id ? "Actualizar" : "Crear examen"}</Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/examenes" })}>Cancelar</Button>
      </div>
    </form>
  );
}
