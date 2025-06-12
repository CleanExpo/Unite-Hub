export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project Details: {id}</h1>
      <p>Project details coming soon...</p>
    </div>
  );
}