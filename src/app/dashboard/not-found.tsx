import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-bold text-gray-700 mb-4">404</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-400 mb-6">
          This dashboard page doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard/overview"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
