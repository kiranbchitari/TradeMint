"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import type { TradeWithRelations } from "@/types/models";

import { TradeFormDialog } from "./trade-form-dialog";

interface TradeDialogContextValue {
  openCreate: () => void;
  openEdit: (trade: TradeWithRelations) => void;
}

const TradeDialogContext =
  React.createContext<TradeDialogContextValue | null>(null);

export function useTradeDialog() {
  const ctx = React.useContext(TradeDialogContext);
  if (!ctx) {
    throw new Error("useTradeDialog must be used within a TradeDialogProvider");
  }
  return ctx;
}

export function TradeDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TradeWithRelations | null>(null);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = React.useCallback((trade: TradeWithRelations) => {
    setEditing(trade);
    setOpen(true);
  }, []);

  const value = React.useMemo(
    () => ({ openCreate, openEdit }),
    [openCreate, openEdit],
  );

  return (
    <TradeDialogContext.Provider value={value}>
      {children}
      <TradeFormDialog
        open={open}
        onOpenChange={setOpen}
        trade={editing}
        onSaved={() => router.refresh()}
      />
    </TradeDialogContext.Provider>
  );
}
