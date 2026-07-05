import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin.functions";

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
          <Link to="/admin/configuracion" activeProps={{ className: "text-primary font-semibold" }} className="text-muted-foreground hover:text-foreground">
            Configuración
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

