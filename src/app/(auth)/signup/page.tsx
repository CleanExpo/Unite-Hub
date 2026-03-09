import { redirect } from "next/navigation";

// No public sign-up — private founder CRM
export default function SignupPage() {
  redirect("/auth/login");
}
