import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useMatches,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  capturedAuthParams,
  capturedAuthHasSession,
  translateHashAuthError,
} from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">La página no cargó</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Admi-Tec — Práctica de matemáticas para preuniversitarios" },
      {
        name: "description",
        content:
          "Plataforma peruana para practicar matemáticas por tema, dificultad y examen de admisión (UNI, San Marcos, PUCP, UNALM, UNFV).",
      },
      { name: "author", content: "Admi-Tec" },
      {
        property: "og:title",
        content: "Admi-Tec — Práctica de matemáticas para preuniversitarios",
      },
      {
        property: "og:description",
        content: "Ejercicios resueltos paso a paso para tu examen de admisión.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:title",
        content: "Admi-Tec — Práctica de matemáticas para preuniversitarios",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  // The public site runs the navy/amber "at" brand register; the authenticated app
  // (everything under the _authenticated pathless layout) keeps the calmer notebook
  // theme. Header/footer are shared chrome, so they switch register based on which
  // side of the signup wall the current route falls on — see DESIGN.md's Product
  // Surface Rule.
  const matches = useMatches();
  const isPublic = !matches.some((m) => m.routeId.startsWith("/_authenticated"));

  useEffect(() => {
    // Only actual identity changes (login/logout) warrant refetching every
    // active query app-wide. USER_UPDATED fires on routine metadata syncs
    // (e.g. Google avatar sync) unrelated to most of the cache, and firing a
    // blanket invalidateQueries() for it was forcing unrelated public data
    // (topics, universities, etc.) to refetch on top of whatever the route
    // loader already re-runs via router.invalidate().
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  // Surface feedback for the redirect Supabase sends after an email confirmation /
  // magic link / OAuth callback lands back on the app (see src/lib/auth-redirect.ts).
  // Covers both the implicit flow (#access_token in the hash) and PKCE (?code= in the
  // query string) since we can't assume which one the project is configured to use.
  useEffect(() => {
    if (!capturedAuthParams) return;

    // Google auth opens in a popup (see auth.tsx's handleGoogle); when this page loads
    // inside it, defer to the opener instead of toasting/navigating in the small window.
    // The opener polls localStorage + the session directly, so this is best-effort —
    // it just makes the popup close itself a little faster when it works.
    const isPopup = typeof window !== "undefined" && !!window.opener;

    const error = capturedAuthParams.get("error");
    if (error) {
      const message = translateHashAuthError(capturedAuthParams);
      if (isPopup) {
        try {
          localStorage.setItem("matepre_google_auth_error", message);
        } catch {
          // ignore — the opener's popup.closed poll still catches this
        }
        window.close();
      } else {
        toast.error(message);
      }
      return;
    }

    if (!capturedAuthHasSession) return;

    if (isPopup) {
      // Confirm the session before closing — getSession() awaits the client's full
      // initialization, including detectSessionInUrl's code/token exchange. Closing
      // the popup any earlier risks interrupting that exchange mid-flight, so the
      // session never actually reaches localStorage and the opener sees nothing.
      supabase.auth.getSession().then(({ data }) => {
        try {
          if (data.session) localStorage.setItem("matepre_google_auth_success", "1");
        } catch {
          // ignore — the opener's own getSession() fallback poll still catches this
        }
        window.close();
      });
      return;
    }

    // Email confirmation / magic link / invite carry a `type`; a plain OAuth (Google) login
    // doesn't, so only show the "confirmed" toast for the former and stay silent for the latter.
    const type = capturedAuthParams.get("type");

    // Password recovery gets its own dedicated flow: /restablecer-password reads this
    // same session itself and asks the student to set a new password before treating
    // them as "logged in normally". Don't race it by auto-redirecting to /panel here.
    if (type === "recovery") return;

    if (type === "signup" || type === "email_change" || type === "invite") {
      toast.success("¡Correo confirmado! Tu cuenta ya está activa.");
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate({ to: "/panel", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/panel", replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={cn("flex min-h-dvh flex-col bg-background text-foreground", isPublic && "at")}
      >
        <SiteHeader isPublic={isPublic} />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter isPublic={isPublic} />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
