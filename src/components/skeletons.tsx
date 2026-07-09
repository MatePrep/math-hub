export function TopicCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5 motion-reduce:animate-none">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-3.5 w-10 rounded bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full rounded bg-muted" />
        <div className="h-3.5 w-3/4 rounded bg-muted" />
      </div>
      <div className="mt-4 h-3.5 w-28 rounded bg-muted" />
    </div>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm motion-reduce:animate-none sm:p-5">
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-md bg-muted" />
        <div className="h-5 w-20 rounded-md bg-muted" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full rounded bg-muted" />
        <div className="h-3.5 w-full rounded bg-muted" />
        <div className="h-3.5 w-2/3 rounded bg-muted" />
      </div>
      <div className="mt-4 h-3.5 w-36 rounded bg-muted" />
    </div>
  );
}
