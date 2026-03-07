export default function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-white/[0.04] rounded-sm w-32 mb-2" />
        <div className="h-3 bg-white/[0.03] rounded-sm w-48" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 animate-pulse">
            <div className="h-3 bg-white/[0.04] rounded-sm w-20 mb-3" />
            <div className="h-7 bg-white/[0.04] rounded-sm w-16" />
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 animate-pulse">
        <div className="h-4 bg-white/[0.04] rounded-sm w-36 mb-4" />
        <div className="h-64 bg-white/[0.03] rounded-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 animate-pulse">
            <div className="h-4 bg-white/[0.04] rounded-sm w-28 mb-4" />
            <div className="h-40 bg-white/[0.03] rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
