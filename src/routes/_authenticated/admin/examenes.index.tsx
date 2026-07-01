import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { listAdminExams, deleteExam } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/examenes/")({
  component: AdminExamsList,
});

function AdminExamsList() {
  const router = useRouter();
  const listFn = useServerFn(listAdminExams);
  const del = useServerFn(deleteExam);
  const q = useQuery({ queryKey: ["admin-exams"], queryFn: () => listFn() });

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este examen? Se borrarán también las sesiones asociadas.")) return;
    try {
      await del({ data: { id } });
      toast.success("Examen eliminado");
      router.invalidate();
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{q.data?.length ?? 0} exámenes</p>
        <Button asChild size="sm">
          <Link to="/admin/examenes/nuevo"><Plus className="mr-1 h-4 w-4" /> Nuevo examen</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Preguntas</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.data?.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "published" ? "default" : "outline"} className="capitalize">{e.status}</Badge>
                </TableCell>
                <TableCell>{e.questionCount}</TableCell>
                <TableCell>{e.time_limit_min} min</TableCell>
                <TableCell>{e.attemptCount}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost">
                    <Link to="/admin/examenes/$id" params={{ id: e.id }} aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(e.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Sin exámenes todavía.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
