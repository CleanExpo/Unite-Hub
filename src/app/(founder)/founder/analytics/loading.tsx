export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 flex flex-col gap-3">
            <div className="h-2 w-1/2 bg-white/[0.06] rounded-sm animate-pulse" />
            <div className="h-7 w-2/3 bg-white/[0.06] rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4">
        <div className="h-2 w-32 bg-white/[0.06] rounded-sm animate-pulse mb-4" />
        <div className="h-[280px] bg-white/[0.03] rounded-sm animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4">
            <div className="h-2 w-32 bg-white/[0.06] rounded-sm animate-pulse mb-4" />
            <div className="h-[180px] bg-white/[0.03] rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
