export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          <span className="font-display font-semibold text-foreground">MatePre</span> · Práctica de
          matemáticas para preuniversitarios del Perú.
        </p>
        <p>Hecho con ♥ para estudiantes peruanos.</p>
      </div>
    </footer>
  );
}
