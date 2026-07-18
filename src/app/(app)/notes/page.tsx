import type { Metadata } from "next";

import { PageContainer } from "@/components/page-header";
import { NotesApp } from "@/features/notes/components/notes-app";
import { getNotes } from "@/features/notes/queries";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <PageContainer>
      <NotesApp notes={notes} />
    </PageContainer>
  );
}
