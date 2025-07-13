export default function ProductLoading() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="rounded-lg border p-8">
              <div className="aspect-square bg-muted animate-pulse rounded" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            </div>
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}