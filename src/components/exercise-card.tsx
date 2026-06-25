import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/lib/math-render";

const difficultyLabel = { facil: "Fácil", medio: "Medio", dificil: "Difícil" } as const;
const difficultyClass: Record<string, string> = {
  facil: "bg-success/15 text-success border-success/30",
  medio: "bg-accent/20 text-accent-foreground border-accent/40",
  dificil: "bg-destructive/15 text-destructive border-destructive/30",
};

type ExerciseRow = {
  id: string;
  statement_md: string;
  difficulty: "facil" | "medio" | "dificil";
  exam_year: number | null;
  topic?: { slug: string; name: string } | null;
  subtopic?: { slug: string; name: string } | null;
  university?: { slug: string; short_name: string } | null;
};

export function ExerciseCard({ ex }: { ex: ExerciseRow }) {
  return (
    <Link
      to="/ejercicio/$id"
      params={{ id: ex.id }}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className={difficultyClass[ex.difficulty]}>
          {difficultyLabel[ex.difficulty]}
        </Badge>
        {ex.topic && <Badge variant="secondary">{ex.topic.name}</Badge>}
        {ex.university && (
          <Badge variant="outline">
            {ex.university.short_name}
            {ex.exam_year ? ` ${ex.exam_year}` : ""}
          </Badge>
        )}
      </div>
      <div className="mt-3 line-clamp-3 text-sm text-foreground/90">
        <MathText text={ex.statement_md} />
      </div>
      <p className="mt-3 text-xs font-medium text-primary group-hover:underline">
        Resolver ejercicio →
      </p>
    </Link>
  );
}
