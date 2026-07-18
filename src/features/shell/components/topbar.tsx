"use client";

import { Menu, Plus, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useTradeDialog } from "@/features/trades/components/trade-dialog-provider";

import { UserMenu, type ShellUser } from "./user-menu";

export function Topbar({
  user,
  onOpenMobile,
  onOpenPalette,
}: {
  user: ShellUser;
  onOpenMobile: () => void;
  onOpenPalette: () => void;
}) {
  const { openCreate } = useTradeDialog();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur-md sm:px-4 print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobile}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <button
        type="button"
        onClick={onOpenPalette}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">New trade</span>
        </Button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
