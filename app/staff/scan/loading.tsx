export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 pb-10 pt-4">
        <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-white/15" />
        <div className="h-4 flex-1 animate-pulse rounded-full bg-white/15" />
        <div className="h-10 w-16 flex-shrink-0 animate-pulse rounded-full bg-white/15" />
      </div>

      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-6 pt-10">
        <div className="mx-auto h-11 w-full max-w-xs animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  )
}