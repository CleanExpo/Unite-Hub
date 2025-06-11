export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Details: {id}</h1>
      <p>Task details coming soon...</p>
    </div>
  );
}