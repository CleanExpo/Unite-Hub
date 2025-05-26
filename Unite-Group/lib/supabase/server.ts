import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export function createClient() {
  return createServerComponentClient<Database>({ cookies })
}

// Add the missing named export that's being referenced elsewhere in the codebase
export const createServerClient = createClient

// Default export as a fallback
export default { createClient, createServerClient }
