export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-32 bg-white/[0.06] rounded-sm animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-white/[0.06] rounded-sm animate-pulse" />
            <div className="h-8 w-8 bg-white/[0.06] rounded-sm animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-2 w-full bg-white/[0.06] rounded-sm animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.03] rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
