import Link from "next/link";

import { FileText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { formatRelative } from "@/lib/format";
import type { Note } from "@/types/models";

function preview(content: string) {
  return content
    .replace(/[#*_`>[\]()!-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

export function RecentNotesCard({ notes }: { notes: Note[] }) {
  return (
    <SectionCard title="Recent notes" href="/notes" contentClassName="p-2">
      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Capture ideas and reflections in Notes."
          className="border-0"
        />
      ) : (
        <ul>
          {notes.slice(0, 5).map((n) => (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(n.updated_at)}
                  </span>
                </div>
                {n.content && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {preview(n.content)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
