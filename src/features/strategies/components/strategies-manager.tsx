"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { LineChart, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import type { Strategy } from "@/types/models";

import { deleteStrategyAction } from "../actions";
import { StrategyCard, type StrategyStats } from "./strategy-card";
import { StrategyFormDialog } from "./strategy-form-dialog";

export function StrategiesManager({
  strategies,
  stats,
  currency,
}: {
  strategies: Strategy[];
  stats: Record<string, StrategyStats>;
  currency: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Strategy | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Strategy | null>(null);
  const [pending, startTransition] = React.useTransition();

  const empty: StrategyStats = { pnl: 0, trades: 0, winRate: 0, avgR: null };

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      const res = await deleteStrategyAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Strategy deleted");
        router.refresh();
      }
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Strategies</h1>
          <p className="text-sm text-muted-foreground">
            Build and track your repeatable trading strategies.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> New strategy
        </Button>
      </div>

      {strategies.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No strategies yet"
          description="Create your first strategy to start tracking its performance."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> New strategy
            </Button>
          }
          className="py-20"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              stats={stats[s.id] ?? empty}
              currency={currency}
              onEdit={() => {
                setEditing(s);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      <StrategyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        strategy={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Trades keep their history but will no longer be linked to this
              strategy.
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
