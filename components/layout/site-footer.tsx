export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6">
        <p>
          GoCentralScores is not affiliated with Harmonix Music Systems or any
          of their publishers. GoCentralScores is also not affiliated with
          MiloHax, GOCentral, or the RBEnhanced projects. However, we acknowledge
          the use of the GOCentral API and their assistance with this project.
        </p>
        <p>
          site by{" "}
          <a
            href="https://github.com/elcanadiano"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            elcanadiano
          </a>
        </p>
      </div>
    </footer>
  );
}
