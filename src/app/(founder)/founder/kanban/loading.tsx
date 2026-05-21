export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[280px] flex flex-col gap-3">
            <div className="h-3 w-24 bg-white/[0.06] rounded-sm animate-pulse" />
            {[0, 1, 2].map((j) => (
              <div key={j} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-3 flex flex-col gap-2">
                <div className="h-2 w-4/5 bg-white/[0.06] rounded-sm animate-pulse" />
                <div className="h-2 w-3/5 bg-white/[0.06] rounded-sm animate-pulse" />
                <div className="h-2 w-1/3 bg-white/[0.06] rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
