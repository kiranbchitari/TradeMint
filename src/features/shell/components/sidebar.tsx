"use client";

import Link from "next/link";

import { PanelLeft, PanelLeftClose } from "lucide-react";

import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NavLinks } from "./nav-links";

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 md:flex print:hidden",
        collapsed ? "w-[68px]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/dashboard" aria-label="TradeMint">
          <Logo size="sm" showText={!collapsed} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-3">
        <NavLinks collapsed={collapsed} />
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "w-full text-muted-foreground",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
