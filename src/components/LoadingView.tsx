export function LoadingView() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center px-4 py-16">
      <div className="space-y-4">
        <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
        <div className="mt-8 space-y-3">
          {[100, 95, 88, 92, 70].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-surface"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
