"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Signup is disabled — this is a private, single-owner CRM.
 * Redirect anyone who lands here back to the sign-in page.
 */
export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/signin");
  }, [router]);

  return null;
}
