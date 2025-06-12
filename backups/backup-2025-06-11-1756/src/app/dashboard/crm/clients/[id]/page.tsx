export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Client Details: {id}</h1>
      <p>Client details coming soon...</p>
    </div>
  );
}