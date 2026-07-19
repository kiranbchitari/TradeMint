import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LineChart,
  ListChecks,
  NotebookPen,
  Settings,
  Tags,
  Upload,
  Users2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Keyboard shortcut hint (single key), shown in the sidebar. */
  shortcut?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "D" },
      { title: "Journal", href: "/journal", icon: BookOpen, shortcut: "J" },
      { title: "Trades", href: "/trades", icon: ListChecks },
      { title: "Shared with me", href: "/shared", icon: Users2 },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Library",
    items: [
      { title: "Strategies", href: "/strategies", icon: LineChart },
      { title: "Playbook", href: "/playbook", icon: NotebookPen },
      { title: "Tags", href: "/tags", icon: Tags },
      { title: "Notes", href: "/notes", icon: FileText },
    ],
  },
  {
    label: "Data",
    items: [
      { title: "Import Trades", href: "/import", icon: Upload },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
];

export const SETTINGS_NAV: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
};

/** Flattened list for command palette / search. */
export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  SETTINGS_NAV,
];
