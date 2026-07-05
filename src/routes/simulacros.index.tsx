import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer, Shuffle, Play, ChevronDown, History, LogIn } from "lucide-react";
import { listPublishedTemplates, listMyTemplateSessions } from "@/lib/exams.functions";
import { getFullProfile, listAllUniversities } from "@/lib/profile.functions";
import { useSignedIn } from "@/hooks/use-signed-in";

export const Route = createFileRoute("/simulacros/")({
  head: () => ({
    meta: [
      { title: "Simulacros — MatePre" },
      { name: "description", content: "Genera simulacros de examen aleatorios a partir de las plantillas disponibles." },
      { property: "og:title", content: "Simulacros — MatePre" },
      { property: "og:description", content: "Practica con simulacros aleatorios personalizados." },
    ],
  }),
  component: SimulacrosPage,
});

function SimulacrosPage() {
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const listFn = useServerFn(listPublishedTemplates);
  const sessionsFn = useServerFn(listMyTemplateSessions);
  const profileFn = useServerFn(getFullProfile);
  const universitiesFn = useServerFn(listAllUniversities);

  const [universityId, setUniversityId] = useState<string | "all" | null>(null);

  const profileQ = useQuery({
    queryKey: ["full-profile-mini"],
    queryFn: () => profileFn(),
    enabled: signedIn === true,
  });
  const universitiesQ = useQuery({ queryKey: ["all-universities"], queryFn: () => universitiesFn() });
  const q = useQuery({
    queryKey: ["published-templates", universityId],
    queryFn: () => listFn({ data: { universityId: universityId && universityId !== "all" ? universityId : undefined } }),
    enabled: universityId !== null,
  });
  const sessionsQ = useQuery({
    queryKey: ["my-template-sessions"],
    queryFn: () => sessionsFn(),
    enabled: signedIn === true,
  });
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (universityId === null && signedIn !== null) {
      setUniversityId(profileQ.data?.universities[0]?.university_id ?? "all");
    }
  }, [profileQ.data, universityId, signedIn]);

  const sessionsByExam = new Map<string, any[]>();
  (sessionsQ.data ?? []).forEach((s: any) => {
    if (!s.exam_id) return;
    if (!sessionsByExam.has(s.exam_id)) sessionsByExam.set(s.exam_id, []);
    sessionsByExam.get(s.exam_id)!.push(s);
  });

  function toggleHistory(id: string) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onGenerateClick() {
    toast("Inicia sesión para generar un simulacro", {
      description: "Crea una cuenta gratis para guardar tu progreso.",
    });
    navigate({ to: "/auth" });
  }

  const showIncompleteProfileHint =
    signedIn === true && profileQ.data && profileQ.data.universities.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
          <Shuffle className="h-3 w-3" /> Preguntas aleatorias
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Simulacros</h1>
        <p className="mt-2 text-muted-foreground">
          Cada simulacro se arma con preguntas aleatorias del banco según la plantilla. Si repites uno, obtendrás una combinación distinta.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="max-w-xs flex-1">
          <Select value={universityId ?? undefined} onValueChange={(v) => setUniversityId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Universidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las universidades</SelectItem>
              {(universitiesQ.data ?? [])
                .filter((u: any) => u.active)
                .map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.short_name ?? u.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {showIncompleteProfileHint && (
          <p className="text-xs text-muted-foreground">
            Aún no elegiste tu universidad objetivo.{" "}
            <Link to="/perfil" className="font-medium text-primary hover:underline">
              Complétalo en tu perfil →
            </Link>
          </p>
        )}
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {q.data && q.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Aún no hay plantillas disponibles.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {(q.data ?? []).map((t: any, i: number) => {
          const attempts = sessionsByExam.get(t.id) ?? [];
          const isExpanded = expandedHistory.has(t.id);
          return (
            <article
              key={t.id}
              className="animate-fade-up rounded-xl border border-border bg-card"
              style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
            >
              <div className="p-5">
                <h2 className="font-display text-lg font-bold">{t.title}</h2>
                {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.university && <Badge variant="secondary">{t.university.short_name}</Badge>}
                  <Badge variant="outline"><Timer className="mr-1 h-3 w-3" /> {t.time_limit_min} min</Badge>
                  <Badge variant="outline">{t.totalQuestions} preguntas</Badge>
                  <Badge variant="outline">{t.ruleCount} materia(s)</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {signedIn === true ? (
                    <Button asChild className="press">
                      <Link to="/simulacro/$id" params={{ id: t.id }}>
                        <Play className="mr-2 h-4 w-4" /> Generar nuevo simulacro
                      </Link>
                    </Button>
                  ) : (
                    <Button className="press" onClick={onGenerateClick}>
                      <LogIn className="mr-2 h-4 w-4" /> Ingresar para generar
                    </Button>
                  )}
                  {attempts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleHistory(t.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                      {attempts.length} intento{attempts.length !== 1 ? "s" : ""}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {attempts.length > 0 && (
                <div className="collapsible" data-open={isExpanded}>
                  <div className="border-t border-border px-5 pb-4 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Historial</p>
                    <div className="space-y-2">
                      {attempts.map((a: any) => (
                        <Link
                          key={a.id}
                          to="/examen-sesion/$sessionId/resultado"
                          params={{ sessionId: a.id }}
                          className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-primary/40"
                        >
                          <div>
                            <p className="font-medium">{new Date(a.started_at).toLocaleString("es-PE")}</p>
                            <p className="text-xs text-muted-foreground">{a.score ?? 0}% · {a.total} preguntas</p>
                          </div>
                          <span className="text-primary">Ver resultado →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
