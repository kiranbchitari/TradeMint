"use client";

import * as React from "react";

import { Check, ChevronsUpDown, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string | null;
}

export function MultiSelect({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select…",
  emptyText = "No results.",
  className,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onCreate?: (label: string) => Promise<MultiSelectOption | null>;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const selected = options.filter((o) => value.includes(o.value));
  const hasExact = options.some(
    (o) => o.label.toLowerCase() === search.trim().toLowerCase(),
  );

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  async function handleCreate() {
    if (!onCreate || !search.trim()) return;
    setCreating(true);
    const created = await onCreate(search.trim());
    setCreating(false);
    if (created) {
      onChange([...value, created.value]);
      setSearch("");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between px-2.5 py-1.5",
            className,
          )}
        >
          <span className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((o) => (
                <Badge
                  key={o.value}
                  variant="secondary"
                  className="gap-1 font-normal"
                >
                  {o.color && (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: o.color }}
                    />
                  )}
                  {o.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    className="ml-0.5 rounded-sm hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter>
          <CommandInput
            placeholder="Search…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!onCreate && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => toggle(o.value)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value.includes(o.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.color && (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: o.color }}
                    />
                  )}
                  {o.label}
                </CommandItem>
              ))}
              {onCreate && search.trim() && !hasExact && (
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={handleCreate}
                  disabled={creating}
                >
                  <Plus className="size-4" />
                  Create &quot;{search.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
