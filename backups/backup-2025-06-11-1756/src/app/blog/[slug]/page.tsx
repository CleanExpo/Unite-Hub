export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Blog Post: {slug}</h1>
      <p>Blog post content coming soon...</p>
    </div>
  );
}