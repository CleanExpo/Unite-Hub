import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-mono font-bold text-white/10 mb-4">404</div>
        <h1 className="text-xl font-mono font-bold text-white/90 mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-white/40 mb-6">
          This dashboard page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard/overview"
          className="inline-flex items-center justify-center px-5 py-2 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm transition-colors hover:bg-[#00F5FF]/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
