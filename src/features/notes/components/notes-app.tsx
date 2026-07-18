"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Eye, FileText, Loader2, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { MarkdownContent } from "@/components/markdown-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/models";

import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "../actions";

export function NotesApp({
  notes,
  initialId,
}: {
  notes: Note[];
  initialId?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialId ?? notes[0]?.id ?? null,
  );
  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [preview, setPreview] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
      setTags(selected.tags.join(", "));
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  function newNote() {
    startTransition(async () => {
      const res = await createNoteAction({ title: "Untitled", content: "" });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setSelectedId(res.data!.id);
      setTitle(res.data!.title);
      setContent("");
      setTags("");
      router.refresh();
    });
  }

  function save() {
    if (!selected) return;
    const id = selected.id;
    startTransition(async () => {
      const res = await updateNoteAction(id, {
        title: title.trim() || "Untitled",
        content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        router.refresh();
      }
    });
  }

  function togglePin() {
    if (!selected) return;
    startTransition(async () => {
      await updateNoteAction(selected.id, { is_pinned: !selected.is_pinned });
      router.refresh();
    });
  }

  function remove() {
    if (!selected) return;
    const id = selected.id;
    startTransition(async () => {
      await deleteNoteAction(id);
      toast.success("Note deleted");
      setSelectedId(notes.find((n) => n.id !== id)?.id ?? null);
      router.refresh();
    });
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 lg:flex-row">
      {/* List */}
      <div className="flex w-full shrink-0 flex-col rounded-xl border bg-card lg:w-72">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">Notes</span>
          <Button size="icon-sm" variant="ghost" onClick={newNote} aria-label="New note">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {notes.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No notes yet.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    className={cn(
                      "w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                      n.id === selectedId
                        ? "bg-muted"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {n.is_pinned && (
                        <Pin className="size-3 shrink-0 text-primary" />
                      )}
                      <span className="truncate text-sm font-medium">
                        {n.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(n.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="h-8 border-0 px-1 text-base font-semibold shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPreview((p) => !p)}
                aria-label="Toggle preview"
              >
                {preview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={togglePin}
                aria-label="Pin note"
              >
                <Pin
                  className={cn(
                    "size-4",
                    selected.is_pinned && "fill-primary text-primary",
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={remove}
                aria-label="Delete note"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {preview ? (
                <MarkdownContent>
                  {content || "*Nothing to preview yet.*"}
                </MarkdownContent>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write in markdown… # headings, **bold**, - lists, ![img](url)"
                  className="min-h-full resize-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
                />
              )}
            </div>

            <div className="border-t px-3 py-2">
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="h-8 border-0 px-1 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="No note selected"
            description="Create a note or pick one from the list."
            action={
              <Button onClick={newNote}>
                <Plus className="size-4" /> New note
              </Button>
            }
            className="m-auto border-0"
          />
        )}
      </div>
    </div>
  );
}
