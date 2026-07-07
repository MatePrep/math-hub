import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{q.data?.length ?? 0} ejercicios</p>
        <Button asChild size="sm">
          <Link to="/admin/ejercicios/nuevo"><Plus className="mr-1 h-4 w-4" /> Nuevo ejercicio</Link>
        </Button>
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
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Cargando…</TableCell></TableRow>
            )}
            {q.data?.map((ex: any) => (
              <TableRow key={ex.id}>
                <TableCell className="max-w-md">
                  <MathText text={ex.statement_md} clampLines={1} className="text-sm" />
                </TableCell>
                <TableCell>{ex.topic?.name}{ex.subtopic ? ` · ${ex.subtopic.name}` : ""}</TableCell>
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
                    <Button size="icon" variant="ghost" onClick={() => onDelete(ex.id)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Sin ejercicios todavía.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
