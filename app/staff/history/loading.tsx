import { Skeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F3EFE7]">
      <header className="flex items-center justify-between px-6 py-5">
        <Skeleton className="h-6 w-32 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-6 w-36" />
        <Skeleton className="mt-2 h-3 w-56" />

        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
              <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}