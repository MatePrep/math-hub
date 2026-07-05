import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderUp, FileUp, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { MathText, ChoiceText } from "@/lib/math-render";
import { listAdminMeta, bulkImportExercises } from "@/lib/admin.functions";
import { uploadExerciseImage, validateImageFile } from "@/lib/storage";
import {
  parseExerciseMarkdown,
  normalizeForMatch,
  type ParsedExercise,
  type ParsedDifficulty,
} from "@/lib/markdown-exercise-parser";

export const Route = createFileRoute("/_authenticated/admin/importar")({
  component: AdminImportExercises,
});

type Override = {
  topicId?: string | null;
  subtopicId?: string | null;
  universityId?: string | null;
  difficulty?: ParsedDifficulty | null;
};

interface ImportResult {
  insertedCount: number;
  failed: Array<{ filename: string; message: string }>;
}

interface ResolvedRow extends ParsedExercise {
  topicId: string | null;
  subtopicId: string | null;
  universityId: string | null;
  difficulty: ParsedDifficulty | null;
  statementImageFile: File | null;
  solutionImageFile: File | null;
  subtopicsForTopic: any[];
  blockingErrors: string[];
  warnings: string[];
  isValid: boolean;
}

function findImageFile(files: File[], refPath: string | null): File | null {
  if (!refPath) return null;
  const norm = refPath.replace(/^\.?\//, "").toLowerCase();
  const base = norm.split("/").pop()!;
  const bySuffix = files.find((f) => {
    const rel = ((f as any).webkitRelativePath || f.name).toLowerCase();
    return rel.endsWith(norm);
  });
  if (bySuffix) return bySuffix;
  return files.find((f) => f.name.toLowerCase() === base) ?? null;
}

function AdminImportExercises() {
  const fetchMeta = useServerFn(listAdminMeta);
  const importFn = useServerFn(bulkImportExercises);
  const meta = useQuery({ queryKey: ["admin-meta"], queryFn: () => fetchMeta() });

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedExercise[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function setOverride(filename: string, patch: Override) {
    setOverrides((o) => ({ ...o, [filename]: { ...o[filename], ...patch } }));
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const mdFiles = files.filter((f) => f.name.toLowerCase().endsWith(".md"));
    if (mdFiles.length === 0) {
      toast.error("No se encontraron archivos .md en la selección.");
      return;
    }
    const parsed = await Promise.all(
      mdFiles.map(async (f) => parseExerciseMarkdown(f.name, await f.text())),
    );
    setRawFiles(files);
    setParsedRows(parsed);
    setOverrides({});
    setImportResult(null);
  }

  const resolvedRows = useMemo(() => {
    if (!meta.data) return [];
    return parsedRows.map((p) => {
      const o = overrides[p.filename] ?? {};

      const topicMatch = p.frontmatter.tema
        ? meta.data.topics.find(
            (t: any) => normalizeForMatch(t.name) === normalizeForMatch(p.frontmatter.tema!),
          ) ?? null
        : null;
      const topicId = o.topicId !== undefined ? o.topicId : (topicMatch?.id ?? null);

      const subtopicsForTopic = topicId
        ? meta.data.subtopics.filter((s: any) => s.topic_id === topicId)
        : [];
      const subtopicMatch = p.frontmatter.subtema
        ? subtopicsForTopic.find(
            (s: any) => normalizeForMatch(s.name) === normalizeForMatch(p.frontmatter.subtema!),
          ) ?? null
        : null;
      const subtopicId = o.subtopicId !== undefined ? o.subtopicId : (subtopicMatch?.id ?? null);

      const universityMatch = p.frontmatter.universidad
        ? meta.data.universities.find(
            (u: any) =>
              u.active &&
              (normalizeForMatch(u.name) === normalizeForMatch(p.frontmatter.universidad!) ||
                normalizeForMatch(u.short_name) === normalizeForMatch(p.frontmatter.universidad!)),
          ) ?? null
        : null;
      const universityId =
        o.universityId !== undefined ? o.universityId : (universityMatch?.id ?? null);

      const difficulty = o.difficulty !== undefined ? o.difficulty : p.difficulty;

      const statementImageFile = findImageFile(rawFiles, p.frontmatter.imagen_enunciado);
      const solutionImageFile = findImageFile(rawFiles, p.frontmatter.imagen_solucion);

      const blockingErrors = [...p.errors];
      if (!topicId) {
        blockingErrors.push(
          `El tema "${p.frontmatter.tema ?? "(vacío)"}" no existe en el catálogo. Selecciónalo manualmente o créalo en Materias.`,
        );
      }
      if (!difficulty) blockingErrors.push("Selecciona una dificultad válida.");
      if (p.frontmatter.imagen_enunciado && !statementImageFile) {
        blockingErrors.push(`No se encontró la imagen "${p.frontmatter.imagen_enunciado}" en los archivos seleccionados.`);
      }
      if (p.frontmatter.imagen_solucion && !solutionImageFile) {
        blockingErrors.push(`No se encontró la imagen "${p.frontmatter.imagen_solucion}" en los archivos seleccionados.`);
      }

      const warnings: string[] = [];
      if (p.frontmatter.subtema && !subtopicMatch && o.subtopicId === undefined) {
        warnings.push(`Subtema "${p.frontmatter.subtema}" no reconocido — se importará sin subtema.`);
      }
      if (p.frontmatter.universidad && !universityMatch && o.universityId === undefined) {
        warnings.push(`Universidad "${p.frontmatter.universidad}" no reconocida — se importará sin universidad.`);
      }

      return {
        ...p,
        topicId,
        subtopicId,
        universityId,
        difficulty,
        statementImageFile,
        solutionImageFile,
        subtopicsForTopic,
        blockingErrors,
        warnings,
        isValid: blockingErrors.length === 0,
      };
    });
  }, [parsedRows, meta.data, overrides, rawFiles]);

  const validCount = resolvedRows.filter((r) => r.isValid).length;

  async function onImport() {
    const validRows = resolvedRows.filter((r) => r.isValid);
    if (validRows.length === 0 || importing) return;
    setImporting(true);
    const imageCache = new Map<File, string>();
    async function resolveImagePath(file: File | null): Promise<string | null> {
      if (!file) return null;
      const cached = imageCache.get(file);
      if (cached) return cached;
      const err = validateImageFile(file);
      if (err) throw new Error(`${file.name}: ${err}`);
      const path = await uploadExerciseImage(file);
      imageCache.set(file, path);
      return path;
    }

    try {
      const payload = [];
      for (const r of validRows) {
        const statement_image_path = await resolveImagePath(r.statementImageFile);
        const solution_image_path = await resolveImagePath(r.solutionImageFile);
        payload.push({
          _filename: r.filename,
          topic_id: r.topicId,
          subtopic_id: r.subtopicId,
          university_id: r.universityId,
          exam_year: r.frontmatter.anio_examen,
          difficulty: r.difficulty,
          statement_md: r.statement_md,
          statement_image_path,
          solution_image_path,
          choices: r.choices,
          correct_choice: r.correctChoiceIndex,
          solution_md: r.solution_md,
          tags: r.frontmatter.etiquetas,
        });
      }
      const result = await importFn({ data: payload });
      setImportResult(result);
      if (result.failed.length === 0) {
        toast.success(`${result.insertedCount} ejercicio(s) importado(s) correctamente.`);
      } else {
        toast.warning(`${result.insertedCount} importado(s), ${result.failed.length} con errores.`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setRawFiles([]);
    setParsedRows([]);
    setOverrides({});
    setImportResult(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold">Importar ejercicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube una carpeta (o varios archivos sueltos) con un archivo <code>.md</code> por
          ejercicio — frontmatter YAML + enunciado/alternativas/solución en markdown. Si un
          ejercicio referencia una imagen, inclúyela en la misma selección.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          {...({ webkitdirectory: "", directory: "" } as any)}
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          ref={filesInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <Button type="button" variant="outline" onClick={() => folderInputRef.current?.click()}>
          <FolderUp className="mr-2 h-4 w-4" /> Seleccionar carpeta
        </Button>
        <Button type="button" variant="outline" onClick={() => filesInputRef.current?.click()}>
          <FileUp className="mr-2 h-4 w-4" /> Seleccionar archivos sueltos
        </Button>
        {parsedRows.length > 0 && (
          <Button type="button" variant="ghost" onClick={reset}>
            Limpiar selección
          </Button>
        )}
      </div>

      {importResult && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm ${
            importResult.failed.length === 0
              ? "border-success/40 bg-success/5"
              : "border-amber-400/40 bg-amber-400/10"
          }`}
        >
          <p className="font-semibold">
            {importResult.insertedCount} ejercicio(s) importado(s) correctamente
            {importResult.failed.length > 0 ? `, ${importResult.failed.length} con errores` : ""}.
          </p>
          {importResult.failed.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              {importResult.failed.map((f, i) => (
                <li key={i}>{f.filename}: {f.message}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm">
              <Link to="/admin/ejercicios">Ver ejercicios</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              Importar otro lote
            </Button>
          </div>
        </div>
      )}

      {!importResult && parsedRows.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm">
              <strong>{parsedRows.length}</strong> ejercicio(s) detectado(s) ·{" "}
              <strong className="text-success">{validCount}</strong> listo(s) para importar
              {parsedRows.length - validCount > 0 && (
                <>
                  {" "}· <strong className="text-destructive">{parsedRows.length - validCount}</strong> con errores
                </>
              )}
            </p>
            <Button
              type="button"
              className="press"
              onClick={onImport}
              disabled={validCount === 0 || importing || meta.isLoading}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {importing ? "Importando…" : `Importar ${validCount} ejercicio(s)`}
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {resolvedRows.map((r) => (
              <ImportRowCard
                key={r.filename}
                row={r}
                topics={meta.data?.topics ?? []}
                universities={meta.data?.universities ?? []}
                onOverride={(patch) => setOverride(r.filename, patch)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ImportRowCard({
  row,
  topics,
  universities,
  onOverride,
}: {
  row: ResolvedRow;
  topics: any[];
  universities: any[];
  onOverride: (patch: Override) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={`rounded-xl border p-4 ${row.isValid ? "border-border bg-card" : "border-destructive/40 bg-destructive/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {row.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="font-mono text-sm">{row.filename}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {row.frontmatter.etiquetas.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs text-muted-foreground">Tema</Label>
          <Select
            value={row.topicId ?? "__none"}
            onValueChange={(v) => onOverride({ topicId: v === "__none" ? null : v, subtopicId: null })}
          >
            <SelectTrigger><SelectValue placeholder="Sin resolver" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— sin tema —</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Subtema</Label>
          <Select
            value={row.subtopicId ?? "__none"}
            onValueChange={(v) => onOverride({ subtopicId: v === "__none" ? null : v })}
            disabled={!row.topicId}
          >
            <SelectTrigger><SelectValue placeholder="(ninguno)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— ninguno —</SelectItem>
              {row.subtopicsForTopic.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Universidad</Label>
          <Select
            value={row.universityId ?? "__none"}
            onValueChange={(v) => onOverride({ universityId: v === "__none" ? null : v })}
          >
            <SelectTrigger><SelectValue placeholder="Genérico (todas)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Genérico — todas las universidades</SelectItem>
              {universities.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.short_name}
                  {u.active === false ? " (inactiva)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Dificultad</Label>
          <Select
            value={row.difficulty ?? "__none"}
            onValueChange={(v) => onOverride({ difficulty: v === "__none" ? null : (v as ParsedDifficulty) })}
          >
            <SelectTrigger><SelectValue placeholder="Sin resolver" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="facil">Fácil</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="dificil">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {row.blockingErrors.length > 0 && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <ul className="list-inside list-disc">
            {row.blockingErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {row.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <ul className="list-inside list-disc">
            {row.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="mt-3 text-sm font-medium text-primary hover:underline"
      >
        {showPreview ? "Ocultar vista previa" : "Ver vista previa"}
      </button>

      {showPreview && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Enunciado</p>
            <MathText text={row.statement_md ?? "_(vacío)_"} className="text-sm" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Alternativas</p>
            <ul className="space-y-1 text-sm">
              {row.choices.map((c, i) => (
                <li key={i} className={i === row.correctChoiceIndex ? "font-semibold text-success" : ""}>
                  {row.choiceLetters[i]}. <ChoiceText text={c} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Solución paso a paso</p>
            <MathText text={row.solution_md ?? "_(vacío)_"} className="text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
