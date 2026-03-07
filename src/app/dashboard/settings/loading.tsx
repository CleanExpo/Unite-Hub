export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="animate-pulse">
        <div className="h-6 bg-white/[0.04] rounded-sm w-28 mb-2" />
        <div className="h-3 bg-white/[0.03] rounded-sm w-56" />
      </div>

      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 space-y-4 animate-pulse">
          <div className="h-4 bg-white/[0.04] rounded-sm w-32 mb-4" />
          {[1, 2].map((field) => (
            <div key={field}>
              <div className="h-3 bg-white/[0.04] rounded-sm w-20 mb-2" />
              <div className="h-9 bg-white/[0.03] rounded-sm w-full" />
            </div>
          ))}
        </div>
      ))}

      <div className="animate-pulse">
        <div className="h-9 bg-white/[0.04] rounded-sm w-28" />
      </div>
    </div>
  );
}
