"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { TradeWithRelations } from "@/types/models";

import { deleteTradeAction } from "../actions";
import { useTradeDialog } from "./trade-dialog-provider";

export function TradeDetailActions({ trade }: { trade: TradeWithRelations }) {
  const router = useRouter();
  const { openEdit } = useTradeDialog();
  const [pending, startTransition] = React.useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteTradeAction(trade.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Trade deleted");
      router.push("/journal");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => openEdit(trade)}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the {trade.symbol} trade and its
              screenshots. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                remove();
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
