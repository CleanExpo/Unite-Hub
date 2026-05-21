export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 bg-white/[0.06] rounded-sm animate-pulse" />
        <div className="h-3 w-64 bg-white/[0.06] rounded-sm animate-pulse" />
      </div>
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-white/[0.06]">
          {["40%", "20%", "15%", "15%", "10%"].map((w, i) => (
            <div key={i} className="h-2 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-white/[0.03]">
            {["40%", "20%", "15%", "15%", "10%"].map((w, j) => (
              <div key={j} className="h-2 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
