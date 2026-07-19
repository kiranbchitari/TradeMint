"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/models";

import { createStrategyAction, updateStrategyAction } from "../actions";
import { ENTITY_COLORS } from "../schemas";

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export function StrategyFormDialog({
  open,
  onOpenChange,
  strategy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy?: Strategy | null;
}) {
  const router = useRouter();
  const isEdit = !!strategy;
  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<string>(ENTITY_COLORS[0]);
  const [expectedRr, setExpectedRr] = React.useState("");
  const [rulesText, setRulesText] = React.useState("");
  const [checklistText, setChecklistText] = React.useState("");

  // Sync the form to the selected strategy each time the dialog opens. This is
  // a deliberate prop→state reset: React's `key`-remount alternative would skip
  // resetting when the SAME strategy is reopened after an unsaved edit, so the
  // set-state-in-effect rule is intentionally disabled for this block.
  React.useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(strategy?.name ?? "");
    setDescription(strategy?.description ?? "");
    setColor(strategy?.color ?? ENTITY_COLORS[0]);
    setExpectedRr(strategy?.expected_rr != null ? String(strategy.expected_rr) : "");
    setRulesText((strategy?.rules ?? []).join("\n"));
    setChecklistText(
      Array.isArray(strategy?.checklist)
        ? (strategy!.checklist as { label: string }[])
            .map((c) => c.label)
            .join("\n")
        : "",
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, strategy]);

  function submit() {
    const input = {
      name,
      description,
      color,
      expectedRr,
      rules: lines(rulesText),
      checklist: lines(checklistText),
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateStrategyAction(strategy!.id, input)
        : await createStrategyAction(input);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Strategy updated" : "Strategy created");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit strategy" : "New strategy"}</DialogTitle>
          <DialogDescription>
            Define the rules and checklist for a repeatable strategy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Breakout"
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {ENTITY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                    color === c && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="When and why you use this strategy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Expected RR</Label>
              <Input
                type="number"
                step="any"
                value={expectedRr}
                onChange={(e) => setExpectedRr(e.target.value)}
                placeholder="2.0"
                className="h-9 font-mono"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Rules (one per line)</Label>
            <Textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={3}
              placeholder={"Price above 20 EMA\nVolume expansion\nClear level"}
            />
          </div>

          <div className="grid gap-2">
            <Label>Checklist (one per line)</Label>
            <Textarea
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
              rows={3}
              placeholder={"Confirm trend\nSet stop\nSize position"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create strategy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
