export default function ContactsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-6 bg-white/[0.04] rounded-sm w-32" />
        <div className="h-8 bg-white/[0.04] rounded-sm w-48" />
      </div>

      <div className="animate-pulse">
        <div className="h-9 bg-white/[0.03] rounded-sm w-full" />
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-3 border-b border-white/[0.06] animate-pulse">
          {['w-24', 'w-32', 'w-28', 'w-20', 'w-16'].map((w, i) => (
            <div key={i} className={`h-3 bg-white/[0.04] rounded-sm ${w}`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="grid grid-cols-5 gap-4 p-3 border-b border-white/[0.04] animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/[0.04] rounded-sm flex-shrink-0" />
              <div className="h-3 bg-white/[0.04] rounded-sm w-24" />
            </div>
            <div className="h-3 bg-white/[0.03] rounded-sm w-32" />
            <div className="h-3 bg-white/[0.03] rounded-sm w-20" />
            <div className="h-3 bg-white/[0.03] rounded-sm w-16" />
            <div className="h-3 bg-white/[0.03] rounded-sm w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
