import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy } from "lucide-react";
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
} from "@/lib/leaderboard.functions";

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
          <BoardTable
            loading={uniBoardQ.isLoading && !!uniId}
            rows={(uniBoardQ.data ?? []).map((r: any, i: number) => ({
              rank: i + 1,
              pseudonym: r.pseudonym,
              score: r.avg_score,
              subtitle: `${r.sessions_count} exámenes`,
              is_me: r.is_me,
            }))}
            scoreLabel="Promedio"
          />
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
          <BoardTable
            loading={examBoardQ.isLoading && !!examId}
            rows={(examBoardQ.data ?? []).map((r: any, i: number) => ({
              rank: i + 1,
              pseudonym: r.pseudonym,
              score: r.best_score,
              subtitle: `${r.attempts_count} intentos`,
              is_me: r.is_me,
            }))}
            scoreLabel="Mejor puntaje"
          />
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
  rows: Array<{ rank: number; pseudonym: string; score: number; subtitle: string; is_me: boolean }>;
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
              <td className="px-4 py-2 text-right">{r.score}%<span className="ml-2 text-xs font-normal text-muted-foreground">{r.subtitle}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
