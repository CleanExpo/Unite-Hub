export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-80 flex-shrink-0 flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm px-3 py-3 flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="h-2 w-1/3 bg-white/[0.06] rounded-sm animate-pulse" />
                <div className="h-2 w-16 bg-white/[0.06] rounded-sm animate-pulse" />
              </div>
              <div className="h-3 w-2/3 bg-white/[0.06] rounded-sm animate-pulse" />
              <div className="h-2 w-4/5 bg-white/[0.06] rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-6 flex flex-col gap-4">
          <div className="h-5 w-2/3 bg-white/[0.06] rounded-sm animate-pulse" />
          <div className="h-2 w-1/3 bg-white/[0.06] rounded-sm animate-pulse" />
          <div className="flex-1 flex flex-col gap-3 mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
