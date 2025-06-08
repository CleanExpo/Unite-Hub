import { Metadata } from 'next';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Search Results | Unite Group',
  description: 'Search results for Unite Group services, resources, and information.',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
    page?: string;
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const type = searchParams.type;
  const page = parseInt(searchParams.page || '1', 10);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <Breadcrumbs />
      </div>

      {/* Search Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Search Results
          </h1>
          {query && (
            <p className="mt-2 text-lg text-gray-600">
              Showing results for <span className="font-medium">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchResults 
          initialQuery={query} 
          initialType={type}
          initialPage={page}
        />
      </div>
    </main>
  );
}
