export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="h-9 w-full max-w-sm bg-white/[0.06] rounded-sm animate-pulse" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm px-4 py-3 flex items-center gap-4">
            <div className="h-8 w-8 bg-white/[0.06] rounded-sm animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-1/3 bg-white/[0.06] rounded-sm animate-pulse" />
              <div className="h-2 w-1/2 bg-white/[0.06] rounded-sm animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-white/[0.06] rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
