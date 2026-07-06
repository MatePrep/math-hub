import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/admin.functions";
import { getExerciseReviewBadgeCount } from "@/lib/exercise-review.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) throw redirect({ to: "/panel" });
    } catch (e: any) {
      if (e?.isRedirect) throw e;
      throw redirect({ to: "/panel" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const badgeFn = useServerFn(getExerciseReviewBadgeCount);
  const badgeQ = useQuery({
    queryKey: ["admin-exercise-review-badge"],
    queryFn: () => badgeFn(),
    refetchInterval: 60_000,
  });
  const pendingCount = badgeQ.data?.count ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Administración</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/admin/ejercicios" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Ejercicios
          </Link>
          <Link to="/admin/importar" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Importar
          </Link>
          <Link to="/admin/examenes" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Exámenes
          </Link>
          <Link to="/admin/materias" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Materias
          </Link>
          <Link to="/admin/universidades" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Universidades
          </Link>
          <Link
            to="/admin/revisar"
            activeProps={{ className: "text-primary font-semibold" }}
            className="relative text-muted-foreground hover:text-foreground"
          >
            Revisar
            {pendingCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

