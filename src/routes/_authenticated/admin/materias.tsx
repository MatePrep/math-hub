import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  listAdminTopics,
  createTopic,
  renameTopic,
  setTopicActive,
  deleteTopic,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/materias")({
  component: MateriasPage,
});

interface TopicRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  active: boolean;
  exerciseCount: number;
}

function MateriasPage() {
  const listFn = useServerFn(listAdminTopics);
  const createFn = useServerFn(createTopic);
  const renameFn = useServerFn(renameTopic);
  const setActiveFn = useServerFn(setTopicActive);
  const delFn = useServerFn(deleteTopic);
  const q = useQuery({ queryKey: ["admin-topics"], queryFn: () => listFn() });

  const [editing, setEditing] = useState<TopicRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setName(""); setDescription(""); setColor("#3B82F6");
    setDialogOpen(true);
  }
  function openEdit(t: TopicRow) {
    setEditing(t);
    setName(t.name); setDescription(t.description ?? ""); setColor(t.color ?? "#3B82F6");
    setDialogOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Nombre muy corto"); return; }
    setSaving(true);
    try {
      if (editing) {
        await renameFn({ data: { id: editing.id, name: name.trim(), description: description.trim() || null, color } });
        toast.success("Materia actualizada");
      } else {
        const res = await createFn({ data: { name: name.trim(), description: description.trim() || null, color } });
        toast[res.duplicated ? "info" : "success"](res.duplicated ? "Ya existía" : "Materia creada");
      }
      setDialogOpen(false);
      q.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(t: TopicRow) {
    try {
      await setActiveFn({ data: { id: t.id, active: !t.active } });
      q.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Error"); }
  }
  async function onDelete(t: TopicRow) {
    if (!confirm(`¿Eliminar la materia "${t.name}"?`)) return;
    try {
      await delFn({ data: { id: t.id } });
      toast.success("Eliminada"); q.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Error"); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{q.data?.length ?? 0} materias</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nueva materia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div><Label>Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div>
              <div><Label>Descripción</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300} /></div>
              <div><Label>Color</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" /></div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ejercicios</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.data?.map((t: TopicRow) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded" style={{ background: t.color ?? "#e5e7eb" }} />
                    <span className="font-medium">{t.name}</span>
                    {t.description && <span className="text-xs text-muted-foreground">{t.description}</span>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{t.exerciseCount}</Badge></TableCell>
                <TableCell><Switch checked={t.active} onCheckedChange={() => onToggle(t)} /></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(t)} aria-label="Eliminar" disabled={t.exerciseCount > 0}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Sin materias.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
