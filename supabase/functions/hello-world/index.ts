export async function handleRequest(event: Request): Promise<Response> {
  return new Response("Hello from Supabase Edge!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
