import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-mono font-bold text-white/10 mb-4">404</div>
        <h1 className="text-2xl font-mono font-bold text-white/90 mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-white/40 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#00F5FF] text-[#050505] font-mono font-bold rounded-sm transition-colors hover:bg-[#00F5FF]/90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
