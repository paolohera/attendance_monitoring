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
        <Skeleton className="h-4 w-24" />

        <div className="mt-3 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}