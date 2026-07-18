"use client";

import { useRouter } from "next/navigation";

import { Monitor, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ALL_NAV_ITEMS } from "@/config/navigation";
import { useTradeDialog } from "@/features/trades/components/trade-dialog-provider";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { openCreate } = useTradeDialog();

  function run(fn: () => void) {
    onOpenChange(false);
    // Defer so the dialog closes before navigation/state changes.
    requestAnimationFrame(fn);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(openCreate)}>
            <Plus className="size-4" />
            New trade
            <span className="ml-auto text-xs text-muted-foreground">N</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Navigation">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.title}
                onSelect={() => run(() => router.push(item.href))}
              >
                <Icon className="size-4" />
                {item.title}
                {item.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.shortcut}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun className="size-4" /> Light
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon className="size-4" /> Dark
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))}>
            <Monitor className="size-4" /> System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
