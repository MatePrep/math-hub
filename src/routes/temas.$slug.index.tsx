import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getTopicBySlug, listExercises, getSubtopicFrequency } from "@/lib/exercises.functions";
import { getFullProfile } from "@/lib/profile.functions";
import { useSignedIn } from "@/hooks/use-signed-in";
import { ExerciseCard } from "@/components/exercise-card";
import { ExerciseCardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, HelpCircle } from "lucide-react";

const searchSchema = z.object({
  difficulty: fallback(z.enum(["all", "facil", "medio", "dificil"]), "all").default("all"),
});

const topicQO = (slug: string) =>
  queryOptions({ queryKey: ["topic", slug], queryFn: () => getTopicBySlug({ data: { slug } }) });

const exercisesQO = (slug: string, difficulty?: "facil" | "medio" | "dificil") =>
  queryOptions({
    queryKey: ["exercises", "topic", slug, difficulty ?? "all"],
    queryFn: () =>
      listExercises({
        data: { topicSlug: slug, difficulty, limit: 100 },
      }),
  });

export const Route = createFileRoute("/temas/$slug/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ difficulty: search.difficulty }),
  loader: async ({ context, params, deps }) => {
    const topic = await context.queryClient.ensureQueryData(topicQO(params.slug));
    if (!topic) throw notFound();
    const diff = deps.difficulty === "all" ? undefined : deps.difficulty;
    await context.queryClient.ensureQueryData(exercisesQO(params.slug, diff));
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Temas · MatePre` },
      { name: "description", content: `Ejercicios de ${params.slug} con solución paso a paso.` },
    ],
  }),
  component: TopicPage,
  pendingComponent: TopicPagePending,
  pendingMs: 150,
  pendingMinMs: 300,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="font-display text-2xl font-bold">Tema no encontrado</h2>
      <Link to="/temas" className="mt-4 inline-block text-primary hover:underline">
        Volver a temas
      </Link>
    </div>
  ),
});

function TopicPagePending() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-3.5 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-3 h-9 w-64 animate-pulse rounded bg-muted motion-reduce:animate-none sm:h-10" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden space-y-2 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            />
          ))}
        </aside>
        <section className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ExerciseCardSkeleton key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}

const diffs = [
  { v: "all", label: "Todos" },
  { v: "facil", label: "Fácil" },
  { v: "medio", label: "Medio" },
  { v: "dificil", label: "Difícil" },
] as const;

function TopicPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: topic } = useSuspenseQuery(topicQO(slug));
  const { data: exercises } = useSuspenseQuery(
    exercisesQO(slug, search.difficulty === "all" ? undefined : search.difficulty),
  );

  const signedIn = useSignedIn();
  const profileFn = useServerFn(getFullProfile);
  const profileQ = useQuery({
    queryKey: ["full-profile"],
    queryFn: () => profileFn(),
    enabled: signedIn === true,
  });
  const targetUniversities = (profileQ.data?.universities ?? [])
    .map((u: any) => u.university)
    .filter(Boolean);

  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const effectiveUniversityId = selectedUniversityId || targetUniversities[0]?.id || "";

  const freqFn = useServerFn(getSubtopicFrequency);
  const freqQ = useQuery({
    queryKey: ["subtopic-frequency", slug, effectiveUniversityId],
    queryFn: () => freqFn({ data: { topicSlug: slug, universityId: effectiveUniversityId } }),
    enabled: !!effectiveUniversityId,
  });

  useEffect(() => {
    if (freqQ.isError) {
      toast.error("No se pudo cargar la frecuencia por universidad. Mostrando orden por defecto.");
    }
  }, [freqQ.isError]);

  if (!topic) return null;

  const freqMap = freqQ.data ?? {};
  const hasTargetUniversity = targetUniversities.length > 0;
  const subtopicsRanked = hasTargetUniversity
    ? [...topic.subtopics]
        .map((s: any) => ({ ...s, count: freqMap[s.id] ?? 0 }))
        .sort((a, b) => b.count - a.count || a.order - b.order)
    : topic.subtopics.map((s: any) => ({ ...s, count: 0 }));
  const topFrequentIds = new Set(
    subtopicsRanked
      .filter((s) => s.count > 0)
      .slice(0, 3)
      .map((s) => s.id),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground" aria-label="Migas">
        <Link to="/temas" className="hover:underline">
          Temas
        </Link>{" "}
        / <span className="text-foreground">{topic.name}</span>
      </nav>
      <header className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{topic.name}</h1>
          {topic.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{topic.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="press inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Practicar <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>¿Qué quieres practicar?</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/practica/$topicSlug" params={{ topicSlug: topic.slug }}>
                Todo el tema
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              Un subtema en específico
            </DropdownMenuLabel>
            {subtopicsRanked.map((s) => (
              <DropdownMenuItem key={s.id} asChild>
                <Link
                  to="/practica/$topicSlug"
                  params={{ topicSlug: topic.slug }}
                  search={{ subtopic: s.slug }}
                >
                  {topFrequentIds.has(s.id) && <span aria-hidden="true">🔥 </span>}
                  {s.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subtemas
            </h2>
            {hasTargetUniversity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="text-muted-foreground/70 hover:text-foreground"
                    aria-label="¿Cómo están ordenados los subtemas?"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-64 text-left">
                    Los subtemas están ordenados de mayor a menor frecuencia según los exámenes
                    reales (con año conocido) de los últimos 10 años en la universidad seleccionada.
                    Los 3 más frecuentes están marcados con 🔥, como sugerencia de en qué enfocar tu
                    estudio.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {hasTargetUniversity && targetUniversities.length > 1 && (
            <Select value={effectiveUniversityId} onValueChange={setSelectedUniversityId}>
              <SelectTrigger className="mt-3 w-full">
                <SelectValue placeholder="Universidad" />
              </SelectTrigger>
              <SelectContent>
                {targetUniversities.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    Frecuencia para: {u.short_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Mobile/tablet: horizontal scrollable chips so subtopics never push
              the exercise list below the fold. Desktop keeps the full vertical list.
              Mirrors the desktop list's top-frequent styling so both breakpoints read
              as one page. No edge-to-edge bleed here (unlike the admin nav scroller):
              this lives inside a grid item (`aside`), which defaults to min-width:auto,
              so a negative-margin child inflates the implicit column track and pushes
              the whole page wider than the viewport instead of just visually bleeding. */}
          <SubtopicChipScroller
            subtopics={subtopicsRanked}
            topicSlug={topic.slug}
            topFrequentIds={topFrequentIds}
          />

          <ul className="mt-3 hidden space-y-1 lg:block">
            {subtopicsRanked.map((s) => {
              const isTopFrequent = topFrequentIds.has(s.id);
              return (
                <li key={s.id}>
                  <div
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      isTopFrequent
                        ? "border border-primary/30 bg-primary/5"
                        : "border border-transparent"
                    }`}
                  >
                    <Link
                      to="/temas/$slug/$subtopic"
                      params={{ slug: topic.slug, subtopic: s.slug }}
                      className="press flex-1 text-foreground/80 hover:text-foreground hover:underline"
                    >
                      {isTopFrequent && <span aria-hidden="true">🔥 </span>}
                      {s.name}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          {!hasTargetUniversity && (
            <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Agrega tu universidad objetivo en{" "}
              <Link to="/perfil" className="text-primary hover:underline">
                tu perfil
              </Link>{" "}
              para ver qué tan frecuente es cada subtema en sus exámenes reales.
            </p>
          )}
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dificultad:
            </span>
            {diffs.map((d) => (
              <Link
                key={d.v}
                from={Route.fullPath}
                to="."
                search={(prev: { difficulty: "all" | "facil" | "medio" | "dificil" }) => ({
                  ...prev,
                  difficulty: d.v,
                })}
                className="rounded-full"
              >
                <Badge
                  variant={search.difficulty === d.v ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {d.label}
                </Badge>
              </Link>
            ))}
          </div>
          {exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hay ejercicios con esos filtros.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {exercises.map((ex: any, i: number) => (
                <div
                  key={ex.id}
                  className="animate-fade-up"
                  style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
                >
                  <ExerciseCard ex={ex} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type ScrollableSubtopic = { id: string; slug: string; name: string };

// Mobile subtopic chip row. Native overflow-x scrollbars read as broken chrome on a
// chip list, so it's hidden (`.no-scrollbar`) in favor of edge-fade overlays that
// only appear on the side there's actually more to scroll toward — tracked via
// scrollLeft/scrollWidth rather than shown unconditionally, so a short list that
// doesn't overflow never shows a fade with nothing behind it. Scroll-snap gives the
// swipe a tactile "settle" per chip instead of free-floating, and each chip reuses
// the app's list-rhythm stagger (`animate-fade-up` + `--i`) for its entrance.
function SubtopicChipScroller({
  subtopics,
  topicSlug,
  topFrequentIds,
}: {
  subtopics: ScrollableSubtopic[];
  topicSlug: string;
  topFrequentIds: Set<string>;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    setFade({
      left: overflowing && el.scrollLeft > 4,
      right: overflowing && el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateFade();
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
  }, [updateFade, subtopics.length]);

  return (
    <div className="relative mt-3 lg:hidden">
      <div
        ref={scrollerRef}
        onScroll={updateFade}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth"
      >
        {subtopics.map((s, i) => {
          const isTopFrequent = topFrequentIds.has(s.id);
          return (
            <Link
              key={s.id}
              to="/temas/$slug/$subtopic"
              params={{ slug: topicSlug, subtopic: s.slug }}
              className={`press animate-fade-up shrink-0 snap-start whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                isTopFrequent
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-border text-foreground/80 hover:border-primary/30 hover:text-foreground"
              }`}
              style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
            >
              {isTopFrequent && <span aria-hidden="true">🔥 </span>}
              {s.name}
            </Link>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
          fade.left ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
          fade.right ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
