export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Project: {id}</h1>
      <p>Project editing coming soon...</p>
    </div>
  );
}