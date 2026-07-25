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

      <main className="mx-auto max-w-sm px-6 py-12">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-3 h-6 w-32" />
        <Skeleton className="mt-1 h-3 w-44" />

        <div className="mt-4 rounded-[28px] bg-white p-6">
          <div className="flex flex-col items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1.5 h-10 w-full" />
              </div>
            ))}
            <Skeleton className="mt-1 h-12 w-full" />
          </div>
        </div>
      </main>
    </div>
  )
}