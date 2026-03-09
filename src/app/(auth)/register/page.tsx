import { redirect } from "next/navigation";

// No public registration — private founder CRM
export default function RegisterPage() {
  redirect("/auth/login");
}
