interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q, type, page } = params;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      {q && <p>Searching for: {q}</p>}
      {type && <p>Type: {type}</p>}
      {page && <p>Page: {page}</p>}
      <p>Search functionality coming soon...</p>
    </div>
  );
}