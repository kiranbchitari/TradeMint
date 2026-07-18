import type { Metadata } from "next";

import { PageContainer } from "@/components/page-header";
import { PlaybookManager } from "@/features/playbook/components/playbook-manager";
import { getPlaybooks } from "@/features/playbook/queries";

export const metadata: Metadata = { title: "Playbook" };

export default async function PlaybookPage() {
  const playbooks = await getPlaybooks();
  return (
    <PageContainer>
      <PlaybookManager playbooks={playbooks} />
    </PageContainer>
  );
}
