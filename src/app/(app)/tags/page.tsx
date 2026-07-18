import type { Metadata } from "next";

import { PageContainer } from "@/components/page-header";
import { TagsManager } from "@/features/tags/components/tags-manager";
import { getTagUsage, getTags } from "@/features/tags/queries";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const [tags, usage] = await Promise.all([getTags(), getTagUsage()]);
  return (
    <PageContainer>
      <TagsManager tags={tags} usage={usage} />
    </PageContainer>
  );
}
