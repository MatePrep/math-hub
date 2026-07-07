import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getUniversityLeaderboard,
  getExamLeaderboard,
  listUniversitiesWithExams,
  listPublishedExamsForRanking,
  getMinScoreForRanking,
  getMyBestScoreForUniversity,
} from "@/lib/leaderboard.functions";
import { getUserStats } from "@/lib/attempts.functions";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Ranking · MatePre" }] }),
  component: RankingPage,
});

function RankingPage() {
  const unisFn = useServerFn(listUniversitiesWithExams);
  const examsFn = useServerFn(listPublishedExamsForRanking);
  const uniBoardFn = useServerFn(getUniversityLeaderboard);
  const examBoardFn = useServerFn(getExamLeaderboard);

  const unisQ = useQuery({ queryKey: ["rank-unis"], queryFn: () => unisFn() });
  const examsQ = useQuery({ queryKey: ["rank-exams"], queryFn: () => examsFn() });

  const [uniId, setUniId] = useState<string>("");
  const [examId, setExamId] = useState<string>("");

  const uniBoardQ = useQuery({
    queryKey: ["rank-uni-board", uniId],
    queryFn: () => uniBoardFn({ data: { universityId: uniId, limit: 100 } }),
    enabled: !!uniId,
  });

  const examBoardQ = useQuery({
    queryKey: ["rank-exam-board", examId],
    queryFn: () => examBoardFn({ data: { examId, limit: 100 } }),
    enabled: !!examId,
  });

  const uniRows = uniBoardQ.data ?? [];
  const uniMe = uniRows.find((r: any) => r.is_me);
  const uniTotal = uniRows[0]?.total_count ?? 0;

  const examRows = examBoardQ.data ?? [];
  const examMe = examRows.find((r: any) => r.is_me);
  const examTotal = examRows[0]?.total_count ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
          <Trophy className="h-3 w-3" /> Anónimo
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Ranking</h1>
        <p className="mt-2 text-muted-foreground">
          Compara tu desempeño con otros estudiantes. Solo se muestran pseudónimos.
        </p>
      </header>

      <Tabs defaultValue="uni">
        <TabsList>
          <TabsTrigger value="uni">Por universidad</TabsTrigger>
          <TabsTrigger value="exam">Por examen</TabsTrigger>
        </TabsList>

        <TabsContent value="uni" className="mt-4">
          <Select value={uniId} onValueChange={setUniId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Selecciona una universidad" />
            </SelectTrigger>
            <SelectContent>
              {(unisQ.data ?? []).map((u: any) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Precisión promedio (% de aciertos) entre los exámenes y simulacros rendidos en esta
            universidad durante los últimos 3 meses — no mezcla puntajes en puntos, ya que cada
            examen puede tener su propio esquema de puntos. Se muestran los 100 mejores puestos.
          </p>
          <BoardTable
            loading={uniBoardQ.isLoading && !!uniId}
            rows={uniRows
              .filter((r: any) => r.rank <= 100)
              .map((r: any) => ({
                rank: r.rank,
                pseudonym: r.pseudonym,
                scoreText: `${r.avg_accuracy}%`,
                subtitle: `${r.sessions_count} exámenes`,
                is_me: r.is_me,
              }))}
            scoreLabel="Precisión promedio"
          />
          {uniMe && uniMe.rank > 100 && (
            <p className="mt-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              Estás en el puesto <span className="font-semibold">#{uniMe.rank}</span> de{" "}
              <span className="font-semibold">{uniTotal}</span> estudiantes en los últimos 3 meses.
            </p>
          )}

          {uniId && <MinScoreCard universityId={uniId} />}
        </TabsContent>

        <TabsContent value="exam" className="mt-4">
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-full sm:w-96">
              <SelectValue placeholder="Selecciona un examen" />
            </SelectTrigger>
            <SelectContent>
              {(examsQ.data ?? []).map((e: any) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}{e.university ? ` — ${e.university.short_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Mejor puntaje obtenido en los últimos 3 meses. Se muestran los 100 mejores puestos.
          </p>
          <BoardTable
            loading={examBoardQ.isLoading && !!examId}
            rows={examRows
              .filter((r: any) => r.rank <= 100)
              .map((r: any) => ({
                rank: r.rank,
                pseudonym: r.pseudonym,
                scoreText: `${r.best_score}${r.max_score != null ? ` / ${r.max_score}` : ""} pts`,
                subtitle: `${r.attempts_count} intentos`,
                is_me: r.is_me,
              }))}
            scoreLabel="Mejor puntaje"
          />
          {examMe && examMe.rank > 100 && (
            <p className="mt-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              Estás en el puesto <span className="font-semibold">#{examMe.rank}</span> de{" "}
              <span className="font-semibold">{examTotal}</span> estudiantes en los últimos 3 meses.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BoardTable({
  rows,
  loading,
  scoreLabel,
}: {
  rows: Array<{ rank: number; pseudonym: string; scoreText: string; subtitle: string; is_me: boolean }>;
  loading: boolean;
  scoreLabel: string;
}) {
  if (loading) return <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>;
  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Aún no hay puntuaciones para mostrar. Sé el primero.
      </p>
    );
  }
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Pseudónimo</th>
            <th className="px-4 py-2 text-right">{scoreLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.rank}-${r.pseudonym}`}
              className={`border-t border-border ${r.is_me ? "bg-primary/10 font-semibold" : ""}`}
            >
              <td className="px-4 py-2">{r.rank}</td>
              <td className="px-4 py-2">
                {r.pseudonym}
                {r.is_me && <Badge className="ml-2" variant="secondary">Tú</Badge>}
              </td>
              <td className="px-4 py-2 text-right">{r.scoreText}<span className="ml-2 text-xs font-normal text-muted-foreground">{r.subtitle}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Minimum admission score reference for the university currently selected on
// the "Por universidad" tab — motivational only, never affects the ranking
// itself. See plan-ranking-mensual-puntaje-minimo.md §3.
function MinScoreCard({ universityId }: { universityId: string }) {
  const minScoreFn = useServerFn(getMinScoreForRanking);
  const bestScoreFn = useServerFn(getMyBestScoreForUniversity);
  const statsFn = useServerFn(getUserStats);

  const minScoreQ = useQuery({
    queryKey: ["rank-min-score", universityId],
    queryFn: () => minScoreFn({ data: { universityId } }),
  });

  const hasMinScore = !!minScoreQ.data?.minScore;

  const bestScoreQ = useQuery({
    queryKey: ["rank-my-best-score", universityId],
    queryFn: () => bestScoreFn({ data: { universityId } }),
    enabled: hasMinScore,
  });

  const minScore = minScoreQ.data?.minScore;
  const bestScore = bestScoreQ.data?.bestScore ?? null;
  const isBehind = !!(hasMinScore && minScore && (bestScore == null || bestScore < minScore.minScore));

  const statsQ = useQuery({
    queryKey: ["user-stats-for-ranking"],
    queryFn: () => statsFn(),
    enabled: isBehind,
  });
  const weakTopics = [...(statsQ.data?.topicStats ?? [])]
    .filter((t) => t.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2);

  if (minScoreQ.isLoading) return null;

  if (!minScoreQ.data?.hasCareer) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Completa tu carrera en{" "}
        <Link to="/perfil" className="text-primary hover:underline">
          tu perfil
        </Link>{" "}
        para ver el puntaje mínimo de ingreso de esta universidad.
      </p>
    );
  }

  if (!minScore) return null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
        <Target className="h-4 w-4 text-primary" /> Puntaje mínimo de ingreso
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {minScoreQ.data.careerName} · {minScore.year}: <span className="font-semibold text-foreground">{minScore.minScore}</span>
      </p>
      {bestScore == null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no tienes puntajes en los últimos 3 meses para comparar.
        </p>
      ) : isBehind ? (
        <>
          <p className="mt-2 text-sm">
            Te faltan <span className="font-semibold">{Math.round(minScore.minScore - bestScore)} puntos</span> para
            alcanzar el puntaje mínimo de ingreso de {minScore.year}. ¡Sigue practicando!
          </p>
          {weakTopics.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Practicar {weakTopics.map((t) => t.name).join(" y ")}, tus temas con más margen de mejora,
              te puede ayudar a cerrar esa brecha.{" "}
              <Link
                to="/temas/$slug"
                params={{ slug: weakTopics[0].slug }}
                className="font-medium text-primary hover:underline"
              >
                Practicar {weakTopics[0].name} →
              </Link>
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-success">
          ¡Vas muy bien! Tu mejor puntaje de los últimos 3 meses ya supera el puntaje mínimo de ingreso.
        </p>
      )}
    </div>
  );
}
