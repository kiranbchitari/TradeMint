"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAV_GROUPS, SETTINGS_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group/nav flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      {!collapsed && item.shortcut && (
        <kbd className="rounded border bg-muted px-1.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover/nav:opacity-100">
          {item.shortcut}
        </kbd>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-2.5 pb-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <div className="mt-auto">
        <NavRow
          item={SETTINGS_NAV}
          collapsed={collapsed}
          active={isActive(pathname, SETTINGS_NAV.href)}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}
