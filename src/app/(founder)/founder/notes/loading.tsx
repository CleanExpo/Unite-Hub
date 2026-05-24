export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-6 flex flex-col gap-4">
          <div className="h-5 w-1/2 bg-white/[0.06] rounded-sm animate-pulse" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: `${90 - i * 5}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-6 flex flex-col gap-4">
          <div className="h-4 w-1/3 bg-white/[0.06] rounded-sm animate-pulse" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
