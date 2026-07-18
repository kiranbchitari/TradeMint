"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileText,
  ImageIcon,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SymbolIcon } from "@/components/symbol-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EMOTION_LABELS, type Emotion } from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber, formatR } from "@/lib/format";
import type { TradeWithRelations } from "@/types/models";

import {
  DirectionBadge,
  GradeBadge,
  PnlText,
  StatusBadge,
} from "./trade-badges";

function SortHeader({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown className="size-3 opacity-50" />
    </button>
  );
}

export function createTradeColumns({
  currency,
  onEdit,
  onDelete,
}: {
  currency: string;
  onEdit: (trade: TradeWithRelations) => void;
  onDelete: (trade: TradeWithRelations) => void;
}): ColumnDef<TradeWithRelations>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "entry_at",
      header: ({ column }) => (
        <SortHeader
          label="Date"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {formatDate(row.original.exit_at ?? row.original.entry_at)}
        </span>
      ),
    },
    {
      accessorKey: "symbol",
      header: "Instrument",
      cell: ({ row }) => (
        <Link
          href={`/trades/${row.original.id}`}
          className="group flex items-center gap-2.5 font-medium"
        >
          <SymbolIcon
            symbol={row.original.symbol}
            market={row.original.market}
            size="md"
          />
          <span className="group-hover:underline">{row.original.symbol}</span>
        </Link>
      ),
    },
    {
      accessorKey: "direction",
      header: "Side",
      cell: ({ row }) => <DirectionBadge direction={row.original.direction} />,
    },
    {
      accessorKey: "entry_price",
      header: "Entry",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">
          {formatNumber(row.original.entry_price)}
        </span>
      ),
    },
    {
      accessorKey: "exit_price",
      header: "Exit",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">
          {row.original.exit_price == null
            ? "—"
            : formatNumber(row.original.exit_price)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">
          {formatNumber(row.original.quantity)}
        </span>
      ),
    },
    {
      accessorKey: "initial_risk",
      header: "Risk",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {row.original.initial_risk == null
            ? "—"
            : formatCurrency(row.original.initial_risk, currency)}
        </span>
      ),
    },
    {
      accessorKey: "reward_amount",
      header: "Reward",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {row.original.reward_amount == null
            ? "—"
            : formatCurrency(row.original.reward_amount, currency)}
        </span>
      ),
    },
    {
      accessorKey: "net_pnl",
      header: ({ column }) => (
        <SortHeader
          label="P&L"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <PnlText value={row.original.net_pnl} currency={currency} />
      ),
    },
    {
      accessorKey: "r_multiple",
      header: ({ column }) => (
        <SortHeader
          label="R"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">
          {formatR(row.original.r_multiple)}
        </span>
      ),
    },
    {
      accessorKey: "setup",
      header: "Setup",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.setup ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "emotion",
      header: "Emotion",
      cell: ({ row }) =>
        row.original.emotion ? (
          <span className="text-sm">
            {EMOTION_LABELS[row.original.emotion as Emotion] ??
              row.original.emotion}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "mistakes",
      header: "Mistakes",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.mistakes.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex max-w-40 flex-wrap gap-1">
            {row.original.mistakes.slice(0, 2).map((m) => (
              <Badge key={m.id} variant="secondary" className="font-normal">
                {m.label}
              </Badge>
            ))}
            {row.original.mistakes.length > 2 && (
              <Badge variant="secondary">
                +{row.original.mistakes.length - 2}
              </Badge>
            )}
          </div>
        ),
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => <GradeBadge grade={row.original.grade} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "tags",
      header: "Tags",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.tags.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex max-w-40 flex-wrap gap-1">
            {row.original.tags.slice(0, 2).map((t) => (
              <Badge key={t.id} variant="outline" className="font-normal">
                {t.name}
              </Badge>
            ))}
            {row.original.tags.length > 2 && (
              <Badge variant="outline">+{row.original.tags.length - 2}</Badge>
            )}
          </div>
        ),
    },
    {
      id: "screenshot",
      header: "Shots",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.images.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ImageIcon className="size-3.5" />
            {row.original.images.length}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "notes",
      header: "Notes",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.notes ? (
          <FileText className="size-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/trades/${row.original.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
