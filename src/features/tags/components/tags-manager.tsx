"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2, Plus, Tags as TagsIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ENTITY_COLORS } from "@/features/strategies/schemas";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/models";

import { createTagAction, deleteTagAction, updateTagAction } from "../actions";

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ENTITY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "size-8 rounded-full ring-offset-2 ring-offset-background",
            value === c && "ring-2 ring-foreground",
          )}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}

export function TagsManager({
  tags,
  usage,
}: {
  tags: Tag[];
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(ENTITY_COLORS[0]);
  const [pending, startTransition] = React.useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createTagAction(name, color);
      if ("error" in res && res.error) toast.error(res.error);
      else {
        toast.success("Tag created");
        setName("");
        router.refresh();
      }
    });
  }

  function recolor(id: string, c: string) {
    startTransition(async () => {
      await updateTagAction(id, { color: c });
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteTagAction(id);
      toast.success("Tag deleted");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Organise trades with reusable tags.
        </p>
      </div>

      <Card className="mb-4 gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">New tag</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. earnings"
              className="h-9"
            />
          </div>
          <ColorPicker value={color} onChange={setColor} />
          <Button onClick={add} disabled={pending || !name.trim()}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </div>
      </Card>

      {tags.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="No tags yet"
          description="Create tags to categorise your trades."
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((t) => (
            <Card
              key={t.id}
              className="flex-row items-center justify-between gap-2 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: t.color ?? "var(--muted-foreground)" }}
                />
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {usage[t.id] ?? 0} trades
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ColorPicker value={t.color ?? ""} onChange={(c) => recolor(t.id, c)} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(t.id)}
                  aria-label="Delete tag"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
