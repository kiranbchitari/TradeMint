import { redirect } from "next/navigation";

// Unauthenticated visitors are bounced to /login by middleware before
// reaching this point; authenticated visitors land on the dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
