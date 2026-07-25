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
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white p-4">
              <Skeleton className="h-4 w-56" />
              <div className="mt-3 flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="-mx-4 -mb-4 mt-3 h-8 rounded-none" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}