import type { Metadata } from "next";

import { PageContainer } from "@/components/page-header";
import { NotesApp } from "@/features/notes/components/notes-app";
import { getNotes } from "@/features/notes/queries";

export const metadata: Metadata = { title: "Notes" };

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notes = await getNotes();
  return (
    <PageContainer>
      <NotesApp notes={notes} initialId={id} />
    </PageContainer>
  );
}
