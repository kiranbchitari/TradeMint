import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-header";
import { getProfile } from "@/features/auth/queries";
import { SettingsView } from "@/features/settings/components/settings-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const [profile, brokersRes, accountsRes] = await Promise.all([
    getProfile(),
    supabase.from("brokers").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences and data."
      />
      <SettingsView
        profile={profile}
        brokers={brokersRes.data ?? []}
        accounts={accountsRes.data ?? []}
      />
    </PageContainer>
  );
}
