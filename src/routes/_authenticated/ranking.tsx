import { createFileRoute } from "@tanstack/react-router";
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
import {
  getExamLeaderboard,
  listPublishedExamsForRanking,
  getExamMinScore,
} from "@/lib/leaderboard.functions";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Ranking · MatePre" }] }),
  component: RankingPage,
});

function RankingPage() {
  const examsFn = useServerFn(listPublishedExamsForRanking);
  const examBoardFn = useServerFn(getExamLeaderboard);

  const examsQ = useQuery({ queryKey: ["rank-exams"], queryFn: () => examsFn() });

  const [examId, setExamId] = useState<string>("");

  const examBoardQ = useQuery({
    queryKey: ["rank-exam-board", examId],
    queryFn: () => examBoardFn({ data: { examId, limit: 100 } }),
    enabled: !!examId,
  });

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

      <Select value={examId} onValueChange={setExamId}>
        <SelectTrigger className="w-full sm:w-96">
          <SelectValue placeholder="Selecciona un examen" />
        </SelectTrigger>
        <SelectContent>
          {(examsQ.data ?? []).map((e: any) => (
            <SelectItem key={e.id} value={e.id}>
              {e.title}
              {e.university ? ` — ${e.university.short_name}` : ""}
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

      {examId && <ExamMinScoreCard examId={examId} myBestScore={examMe?.best_score ?? null} />}
    </div>
  );
}

function BoardTable({
  rows,
  loading,
  scoreLabel,
}: {
  rows: Array<{
    rank: number;
    pseudonym: string;
    scoreText: string;
    subtitle: string;
    is_me: boolean;
  }>;
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
                {r.is_me && (
                  <Badge className="ml-2" variant="secondary">
                    Tú
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {r.scoreText}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{r.subtitle}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Optional per-exam benchmark set by an admin — most exams have none, in
// which case this renders nothing. Compares against the score already
// fetched for the exam leaderboard's "is_me" row, no extra RPC needed.
function ExamMinScoreCard({ examId, myBestScore }: { examId: string; myBestScore: number | null }) {
  const minScoreFn = useServerFn(getExamMinScore);
  const minScoreQ = useQuery({
    queryKey: ["exam-min-score", examId],
    queryFn: () => minScoreFn({ data: { examId } }),
  });

  const minScore = minScoreQ.data?.minScore;
  if (!minScoreQ.data || minScore == null) return null;

  const isBehind = myBestScore == null || myBestScore < minScore;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
        <Target className="h-4 w-4 text-primary" /> Puntaje mínimo de ingreso
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Referencia para este examen:{" "}
        <span className="font-semibold text-foreground">{minScore}</span>
      </p>
      {myBestScore == null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Aún no tienes un intento en este examen para comparar.
        </p>
      ) : isBehind ? (
        <p className="mt-2 text-sm">
          Te faltan{" "}
          <span className="font-semibold">{Math.round(minScore - myBestScore)} puntos</span> para
          alcanzar el puntaje mínimo de referencia. ¡Sigue practicando!
        </p>
      ) : (
        <p className="mt-2 text-sm text-success">
          ¡Vas muy bien! Tu mejor puntaje ya supera el puntaje mínimo de referencia.
        </p>
      )}
    </div>
  );
}
