export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-white/[0.04] rounded-sm w-40 mb-2" />
        <div className="h-3 bg-white/[0.03] rounded-sm w-56" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 animate-pulse">
            <div className="h-3 bg-white/[0.04] rounded-sm w-20 mb-3" />
            <div className="h-7 bg-white/[0.04] rounded-sm w-14 mb-2" />
            <div className="h-2 bg-white/[0.03] rounded-sm w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 animate-pulse">
            <div className="w-8 h-8 bg-white/[0.04] rounded-sm mb-2" />
            <div className="h-3 bg-white/[0.04] rounded-sm w-20" />
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 animate-pulse">
        <div className="h-4 bg-white/[0.04] rounded-sm w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/[0.04] rounded-sm flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-white/[0.04] rounded-sm w-3/4 mb-1" />
                <div className="h-2 bg-white/[0.03] rounded-sm w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
