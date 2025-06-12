export default async function EditTask({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Task: {id}</h1>
      <p>Task editing coming soon...</p>
    </div>
  );
}