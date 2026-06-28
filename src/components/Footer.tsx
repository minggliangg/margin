/*
  A quiet signature line on the landing screen. Mirrors the convention used
  across the author's other projects (a small "created by" link), but tuned to
  margin.'s book-like palette: a hairline rule, muted sans-serif text, the
  accent reserved for hover. It sits below the fold so it never competes with
  the primary actions above it.
*/
export function Footer() {
  return (
    <footer className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="mt-4 flex flex-col items-center gap-1.5 font-sans text-xs text-muted sm:flex-row sm:justify-center sm:gap-2">
        <span>margin. · a client-side Markdown reader</span>
        <span className="hidden text-line sm:inline">·</span>
        <a
          href="https://minggliangg.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-accent"
        >
          created by minggliangg
        </a>
      </div>
    </footer>
  )
}
