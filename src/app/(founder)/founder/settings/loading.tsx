export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0 flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-full bg-white/[0.06] rounded-sm animate-pulse" />
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 flex flex-col gap-4">
              <div className="h-4 w-1/4 bg-white/[0.06] rounded-sm animate-pulse" />
              <div className="flex flex-col gap-3">
                <div className="h-9 w-full bg-white/[0.06] rounded-sm animate-pulse" />
                <div className="h-9 w-full bg-white/[0.06] rounded-sm animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
