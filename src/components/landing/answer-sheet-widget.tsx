import { useEffect, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathText, ChoiceText } from "@/lib/math-render";
import { dailyExerciseQO, submitDailyExerciseAnswer } from "@/lib/daily-exercise.functions";

const difficultyLabel = { facil: "Fácil", medio: "Medio", dificil: "Difícil" } as const;

type StoredAnswer = {
  exerciseId: string;
  selectedChoice: number;
  isCorrect: boolean;
  correctChoice: number;
};

function readStoredAnswer(exerciseId: string): StoredAnswer | null {
  try {
    const raw = localStorage.getItem("admitec_daily_answer");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAnswer;
    return parsed.exerciseId === exerciseId ? parsed : null;
  } catch {
    return null;
  }
}

function storeAnswer(answer: StoredAnswer) {
  try {
    localStorage.setItem("admitec_daily_answer", JSON.stringify(answer));
  } catch {
    // best-effort only — the widget still works without persistence, it just
    // won't remember the answer across a reload on this visit
  }
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The landing page's one bold, signature moment: a real exercise pulled from
 * the database, the same for every visitor on a given day (see get_daily_exercise
 * in the DB — deterministic per calendar date, no cron needed) and answerable
 * in place. The accuracy readout reflects everyone who answered today's exercise.
 */
export function AnswerSheetWidget() {
  const { data: daily } = useSuspenseQuery(dailyExerciseQO);
  const submitAnswer = useServerFn(submitDailyExerciseAnswer);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctChoice: number;
    totalAnswers: number;
    correctAnswers: number;
  } | null>(
    daily
      ? (() => {
          const stored = readStoredAnswer(daily.exerciseId);
          return stored
            ? {
                isCorrect: stored.isCorrect,
                correctChoice: stored.correctChoice,
                totalAnswers: daily.totalAnswers,
                correctAnswers: daily.correctAnswers,
              }
            : null;
        })()
      : null,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!daily) return;
    const stored = readStoredAnswer(daily.exerciseId);
    if (stored) setSelected(stored.selectedChoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily?.exerciseId]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!daily) return null;

  async function handleSelect(i: number) {
    if (result || submitting || !daily) return;
    setSelected(i);
    setSubmitting(true);
    try {
      const res = await submitAnswer({ data: { selectedChoice: i } });
      setResult(res);
      storeAnswer({
        exerciseId: daily.exerciseId,
        selectedChoice: i,
        isCorrect: res.isCorrect,
        correctChoice: res.correctChoice,
      });
    } catch {
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  }

  const accuracy = result
    ? result.totalAnswers > 0
      ? Math.round((result.correctAnswers / result.totalAnswers) * 100)
      : 0
    : null;

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-lg border border-border bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
    >
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
      />

      {/* Sheet header */}
      <div className="relative flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-data text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Reto del día{daily.topicName ? ` · ${daily.topicName}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
          <span
            className="font-data text-sm font-semibold tabular-nums text-foreground"
            aria-live="off"
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="relative px-5 py-5">
        <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
          {difficultyLabel[daily.difficulty]}
        </p>
        <MathText
          text={daily.statementMd}
          clampLines={3}
          className="mt-2 text-pretty text-lg font-medium leading-snug text-foreground sm:text-xl"
        />

        <ul className="mt-5 flex flex-col gap-2" role="radiogroup" aria-label="Alternativas">
          {daily.choices.map((choiceText, i) => {
            const isPicked = selected === i;
            const isAnswerRow = result && i === result.correctChoice;
            const isWrongPick = result && isPicked && !result.isCorrect;
            return (
              <li key={i}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={!!result || submitting}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    visible && "animate-reveal-row",
                    "press flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors duration-300 disabled:cursor-default",
                    isAnswerRow
                      ? "border-success/60 bg-success/10"
                      : isWrongPick
                        ? "border-destructive/60 bg-destructive/10"
                        : isPicked
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent hover:border-primary/40",
                  )}
                  style={visible ? { animationDelay: `${i * 70}ms` } : undefined}
                >
                  <span
                    className={cn(
                      "font-data grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors duration-300",
                      isAnswerRow
                        ? "border-success bg-success text-success-foreground"
                        : isWrongPick
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {isAnswerRow ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : isWrongPick ? (
                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      isAnswerRow || isWrongPick
                        ? "font-semibold text-foreground"
                        : "text-foreground/85",
                    )}
                  >
                    <ChoiceText text={choiceText} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Score readout */}
      <div className="relative flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4">
        <div>
          <p className="font-data text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
            Aciertos de hoy
          </p>
          <p className="font-data mt-0.5 text-3xl font-bold tabular-nums text-foreground">
            {accuracy ?? "—"}
            {accuracy !== null && <span className="text-lg text-muted-foreground">%</span>}
          </p>
        </div>
        <span
          className={cn(
            "font-data rounded-md border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] transition-colors duration-500",
            result
              ? "border-success/50 bg-success/10 text-success"
              : "border-border text-muted-foreground",
          )}
        >
          {result ? "Resuelto" : "Sin resolver"}
        </span>
      </div>
    </div>
  );
}
