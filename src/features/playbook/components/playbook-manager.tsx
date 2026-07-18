"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2, MoreHorizontal, NotebookPen, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import type { Playbook } from "@/types/models";

import {
  createPlaybookAction,
  deletePlaybookAction,
  updatePlaybookAction,
} from "../actions";

const lines = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);
const commas = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export function PlaybookManager({ playbooks }: { playbooks: Playbook[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Playbook | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Playbook | null>(null);
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [expectedRr, setExpectedRr] = React.useState("");
  const [rulesText, setRulesText] = React.useState("");
  const [checklistText, setChecklistText] = React.useState("");
  const [tagsText, setTagsText] = React.useState("");

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setExpectedRr("");
    setRulesText("");
    setChecklistText("");
    setTagsText("");
    setOpen(true);
  }

  function openEdit(p: Playbook) {
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description ?? "");
    setExpectedRr(p.expected_rr != null ? String(p.expected_rr) : "");
    setRulesText((p.rules ?? []).join("\n"));
    setChecklistText(
      Array.isArray(p.checklist)
        ? (p.checklist as { label: string }[]).map((c) => c.label).join("\n")
        : "",
    );
    setTagsText((p.tags ?? []).join(", "));
    setOpen(true);
  }

  function submit() {
    const input = {
      title,
      description,
      expectedRr,
      rules: lines(rulesText),
      checklist: lines(checklistText),
      tags: commas(tagsText),
    };
    startTransition(async () => {
      const res = editing
        ? await updatePlaybookAction(editing.id, input)
        : await createPlaybookAction(input);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Playbook updated" : "Playbook created");
      setOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      const res = await deletePlaybookAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Playbook deleted");
        router.refresh();
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Playbook</h1>
          <p className="text-sm text-muted-foreground">
            Your library of trading setups and their rules.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New setup
        </Button>
      </div>

      {playbooks.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No setups yet"
          description="Document your best setups so you only take A+ trades."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New setup
            </Button>
          }
          className="py-20"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((p) => {
            const checklistCount = Array.isArray(p.checklist)
              ? p.checklist.length
              : 0;
            return (
              <Card key={p.id} className="gap-0 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {p.description && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {p.expected_rr != null && (
                    <Badge variant="secondary">
                      {formatNumber(p.expected_rr, 1)}R target
                    </Badge>
                  )}
                  <Badge variant="outline">{p.rules.length} rules</Badge>
                  <Badge variant="outline">{checklistCount} checks</Badge>
                </div>
                {p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                    {p.tags.map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit setup" : "New setup"}</DialogTitle>
            <DialogDescription>
              Capture the exact conditions for a high-quality setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9"
                placeholder="Opening range breakout"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Expected RR</Label>
              <Input
                type="number"
                step="any"
                value={expectedRr}
                onChange={(e) => setExpectedRr(e.target.value)}
                className="h-9 w-32 font-mono"
                placeholder="2.0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Rules (one per line)</Label>
              <Textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Checklist (one per line)</Label>
              <Textarea
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="h-9"
                placeholder="momentum, gap, large-cap"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending || !title.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create setup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the setup from your playbook.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
