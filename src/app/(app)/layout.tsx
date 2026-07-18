import { redirect } from "next/navigation";

import { AppShell } from "@/features/shell/components/app-shell";
import { getProfile } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware already guards these routes.
  if (!user) redirect("/login");

  const profile = await getProfile();

  const shellUser = {
    name:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Trader",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };

  return <AppShell user={shellUser}>{children}</AppShell>;
}
