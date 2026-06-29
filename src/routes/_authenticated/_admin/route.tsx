import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin")({
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
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Administración</h1>
        <nav className="flex gap-3 text-sm">
          <Link
            to="/admin/ejercicios"
            activeProps={{ className: "text-primary font-semibold" }}
            className="text-muted-foreground hover:text-foreground"
          >
            Ejercicios
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
