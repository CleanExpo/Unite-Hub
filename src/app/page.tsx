import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

// Auth redirect — must render at request time, not build time
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const user = await getUser();

  if (user) {
    redirect("/founder/dashboard");
  }

  redirect("/auth/login");
}
