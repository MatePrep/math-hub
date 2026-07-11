import { useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { listAdminExercises, deleteExercise } from "@/lib/admin.functions";
import { MathText } from "@/lib/math-render";

export const Route = createFileRoute("/_authenticated/admin/ejercicios/")({
  component: AdminExercisesList,
});

function AdminExercisesList() {
  const router = useRouter();
  const fetchList = useServerFn(listAdminExercises);
  const delFn = useServerFn(deleteExercise);
  const q = useQuery({ queryKey: ["admin-exercises"], queryFn: () => fetchList() });

  const [filter, setFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const allTopics = useMemo(() => {
    const map = new Map<string, string>();
    (q.data ?? []).forEach((e: any) => {
      if (e.topic?.id) map.set(e.topic.id, e.topic.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [q.data]);

  const allUniversities = useMemo(() => {
    const map = new Map<string, string>();
    (q.data ?? []).forEach((e: any) => {
      if (e.university?.id) map.set(e.university.id, e.university.short_name);
    });
    return Array.from(map, ([id, short_name]) => ({ id, short_name }));
  }, [q.data]);

  const years = useMemo(() => {
    const set = new Set<number>();
    (q.data ?? []).forEach((e: any) => {
      if (e.exam_year) set.add(e.exam_year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [q.data]);

  const filtered = useMemo(() => {
    return (q.data ?? []).filter((e: any) => {
      if (topicFilter !== "all" && e.topic?.id !== topicFilter) return false;
      if (universityFilter !== "all" && e.university?.id !== universityFilter) return false;
      if (yearFilter !== "all" && String(e.exam_year) !== yearFilter) return false;
      if (filter && !e.statement_md.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [q.data, filter, topicFilter, universityFilter, yearFilter]);

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este ejercicio?")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Ejercicio eliminado");
      router.invalidate();
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {q.data?.length ?? 0} ejercicios
        </p>
        <Button asChild size="sm">
          <Link to="/admin/ejercicios/nuevo">
            <Plus className="mr-1 h-4 w-4" /> Nuevo ejercicio
          </Link>
        </Button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Buscar…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los temas</SelectItem>
            {allTopics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={universityFilter} onValueChange={setUniversityFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las universidades</SelectItem>
            {allUniversities.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.short_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los años</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enunciado</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Universidad</TableHead>
              <TableHead>Dificultad</TableHead>
              <TableHead>Año</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {filtered.map((ex: any) => (
              <TableRow key={ex.id}>
                <TableCell className="max-w-md">
                  <MathText text={ex.statement_md} clampLines={1} className="text-sm" />
                </TableCell>
                <TableCell>
                  {ex.topic?.name}
                  {ex.subtopic ? ` · ${ex.subtopic.name}` : ""}
                </TableCell>
                <TableCell>{ex.university?.short_name ?? "—"}</TableCell>
                <TableCell className="capitalize">{ex.difficulty}</TableCell>
                <TableCell>{ex.exam_year ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild size="icon" variant="ghost">
                      <Link to="/admin/ejercicios/$id" params={{ id: ex.id }} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(ex.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!q.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  {(q.data?.length ?? 0) === 0
                    ? "Sin ejercicios todavía."
                    : "Ningún ejercicio coincide con los filtros."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
