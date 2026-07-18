"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Logo } from "@/components/brand";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  TradeDialogProvider,
  useTradeDialog,
} from "@/features/trades/components/trade-dialog-provider";

import { CommandPalette } from "./command-palette";
import { NavLinks } from "./nav-links";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { ShellUser } from "./user-menu";

const COLLAPSE_KEY = "tm-sidebar-collapsed";

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  return (
    <TradeDialogProvider>
      <ShellChrome user={user}>{children}</ShellChrome>
    </TradeDialogProvider>
  );
}

function ShellChrome({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { openCreate } = useTradeDialog();

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Global keyboard shortcuts.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          openCreate();
          break;
        case "d":
          router.push("/dashboard");
          break;
        case "j":
          router.push("/journal");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-14 justify-center border-b px-4">
            <SheetTitle asChild>
              <span>
                <Logo size="sm" />
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
