"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTradeDialog } from "./trade-dialog-provider";

export function NewTradeButton({
  variant = "default",
  size = "default",
  label = "New trade",
}: {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  label?: string;
}) {
  const { openCreate } = useTradeDialog();
  return (
    <Button variant={variant} size={size} onClick={openCreate}>
      <Plus className="size-4" />
      {label}
    </Button>
  );
}
