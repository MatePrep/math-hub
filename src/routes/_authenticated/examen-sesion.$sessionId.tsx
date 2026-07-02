import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Flag, CheckCircle2 } from "lucide-react";
import { MathText, ChoiceText } from "@/lib/math-render";
import { getExamSession, saveExamAnswers, submitExamSession } from "@/lib/exams.functions";
import { getExerciseImageUrl } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/examen-sesion/$sessionId")({
  component: TakeExam,
});

function TakeExam() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getExamSession);
  const saveFn = useServerFn(saveExamAnswers);
  const submitFn = useServerFn(submitExamSession);

  const q = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: () => getFn({ data: { sessionId } }),
    staleTime: Infinity,
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [imgUrls, setImgUrls] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const savedRef = useRef({ answers: "", flagged: "" });

  const session = q.data?.session as any | undefined;
  const questions: any[] = q.data?.questions ?? [];

  // Init from session
  useEffect(() => {
    if (!session) return;
    setAnswers((session.answers as any) ?? {});
    setFlagged(new Set((session.flagged as any) ?? []));
    const timeLimitMs = (session.time_limit_min ?? 60) * 60 * 1000;
    const elapsed = Date.now() - new Date(session.started_at).getTime();
    setSecondsLeft(Math.max(0, Math.floor((timeLimitMs - elapsed) / 1000)));
    if (session.status !== "in_progress") {
      navigate({ to: "/examen-sesion/$sessionId/resultado", params: { sessionId }, replace: true });
    }
  }, [session, navigate, sessionId]);

  // Preload image URLs
  useEffect(() => {
    let alive = true;
    (async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        questions
          .filter((qz) => qz.statement_image_path)
          .map(async (qz) => {
            const u = await getExerciseImageUrl(qz.statement_image_path);
            if (u) map[qz.id] = u;
          }),
      );
      if (alive) setImgUrls(map);
    })();
    return () => { alive = false; };
  }, [questions]);

  const doSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitFn({ data: { sessionId, answers } });
      navigate({ to: "/examen-sesion/$sessionId/resultado", params: { sessionId }, replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Error al enviar");
      setSubmitting(false);
    }
  }, [answers, sessionId, submitFn, navigate, submitting]);

  // Timer
  useEffect(() => {
    if (!session || session.status !== "in_progress") return;
    if (secondsLeft <= 0) {
      doSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, session, doSubmit]);

  // Autosave debounced
  useEffect(() => {
    const flag = Array.from(flagged);
    const a = JSON.stringify(answers);
    const f = JSON.stringify(flag);
    if (a === savedRef.current.answers && f === savedRef.current.flagged) return;
    const t = setTimeout(() => {
      saveFn({ data: { sessionId, answers, flagged: flag } })
        .then(() => { savedRef.current = { answers: a, flagged: f }; })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [answers, flagged, saveFn, sessionId]);

  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (q.isLoading || !session) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Cargando…</div>;
  if (questions.length === 0) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">Examen sin preguntas.</div>;

  const ex = questions[idx];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeUp = secondsLeft <= 0;
  const lowTime = secondsLeft > 0 && secondsLeft < 60;

  function pick(i: number) {
    setAnswers((a) => ({ ...a, [ex.id]: i }));
  }
  function toggleFlag() {
    setFlagged((s) => {
      const next = new Set(s);
      if (next.has(ex.id)) next.delete(ex.id); else next.add(ex.id);
      return next;
    });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Pregunta <strong>{idx + 1}</strong> de {questions.length}</p>
            <p className="text-xs text-muted-foreground">Respondidas: {answered}/{questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${lowTime ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Timer className="h-4 w-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            {ex.topic?.name && <Badge variant="secondary">{ex.topic.name}</Badge>}
            <Button variant="ghost" size="sm" onClick={toggleFlag} className={flagged.has(ex.id) ? "text-warning" : ""}>
              <Flag className="mr-1 h-4 w-4" /> {flagged.has(ex.id) ? "Desmarcar" : "Marcar"}
            </Button>
          </div>
          <MathText text={ex.statement_md} />
          {imgUrls[ex.id] && (
            <img src={imgUrls[ex.id]} alt="Enunciado" className="mt-4 max-h-96 rounded-md object-contain" />
          )}
          <ul className="mt-5 space-y-2">
            {(ex.choices as string[]).map((c, i) => {
              const picked = answers[ex.id] === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={timeUp}
                    onClick={() => pick(i)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${picked ? "border-primary bg-primary/10 font-medium" : "border-border bg-background hover:border-primary/40"}`}
                  >
                    <span className="mr-2 font-semibold text-primary">{String.fromCharCode(65 + i)}.</span>
                    <ChoiceText text={c} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} className="min-h-11">Anterior</Button>
          {idx < questions.length - 1 ? (
            <Button type="button" onClick={() => setIdx((i) => i + 1)} className="min-h-11">Siguiente</Button>
          ) : (
            <Button
              type="button"
              onClick={doSubmit}
              disabled={submitting || answers[ex.id] === undefined}
              className="min-h-11"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> {submitting ? "Enviando…" : "Finalizar examen"}
            </Button>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:h-fit">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Preguntas</p>
        <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
          {questions.map((qz, i) => {
            const isAnswered = answers[qz.id] !== undefined;
            const isFlagged = flagged.has(qz.id);
            const isCurrent = i === idx;
            return (
              <button
                key={qz.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`relative h-9 rounded-md border text-xs font-semibold transition ${
                  isCurrent ? "border-primary ring-2 ring-primary/40" :
                  isAnswered ? "border-success/50 bg-success/10 text-success" :
                  "border-border bg-background hover:border-primary/40"
                }`}
                aria-label={`Ir a pregunta ${i + 1}`}
              >
                {i + 1}
                {isFlagged && <Flag className="absolute right-0 top-0 h-2.5 w-2.5 text-warning" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <p><span className="inline-block h-3 w-3 rounded-sm border border-success/50 bg-success/10 align-middle" /> Respondida</p>
          <p><Flag className="inline h-3 w-3 text-warning" /> Marcada</p>
        </div>
        <Button className="mt-4 w-full" onClick={doSubmit} disabled={submitting} size="sm">
          Finalizar
        </Button>
      </aside>
    </div>
  );
}
