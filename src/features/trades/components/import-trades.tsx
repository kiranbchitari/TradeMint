"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Download, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { importTradesAction } from "../actions";
import { downloadCsv, parseCsv } from "../lib/csv";

const HEADER_ALIASES: Record<string, string> = {
  symbol: "symbol",
  ticker: "symbol",
  instrument: "symbol",
  market: "market",
  direction: "direction",
  side: "direction",
  status: "status",
  entry: "entry_price",
  entryprice: "entry_price",
  exit: "exit_price",
  exitprice: "exit_price",
  stop: "stop_loss",
  stoploss: "stop_loss",
  target: "target_price",
  targetprice: "target_price",
  quantity: "quantity",
  qty: "quantity",
  size: "quantity",
  fees: "fees",
  fee: "fees",
  entryat: "entry_at",
  entrydate: "entry_at",
  date: "entry_at",
  exitat: "exit_at",
  exitdate: "exit_at",
  setup: "setup",
  notes: "notes",
};

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

type Row = Record<string, string>;

function isValid(row: Row) {
  return (
    !!row.symbol &&
    (row.direction === "long" || row.direction === "short") &&
    !!row.entry_price &&
    !!row.quantity &&
    !!row.entry_at
  );
}

export function ImportTrades() {
  const router = useRouter();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const matrix = parseCsv(String(reader.result));
      if (matrix.length < 2) {
        toast.error("CSV has no data rows.");
        return;
      }
      const headers = matrix[0].map((h) => HEADER_ALIASES[norm(h)] ?? norm(h));
      const parsed = matrix.slice(1).map((cells) => {
        const row: Row = {};
        headers.forEach((key, i) => {
          const val = (cells[i] ?? "").trim();
          if (val) row[key] = key === "direction" ? val.toLowerCase() : val;
        });
        return row;
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  const validRows = rows.filter(isValid);
  const invalidCount = rows.length - validRows.length;

  function runImport() {
    startTransition(async () => {
      const res = await importTradesAction(validRows);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Imported ${res.data?.count ?? 0} trades`);
      router.push("/journal");
    });
  }

  function downloadTemplate() {
    downloadCsv(
      "trademint-import-template.csv",
      "Symbol,Direction,Entry,Exit,StopLoss,Target,Quantity,Fees,EntryAt,ExitAt,Setup,Notes\nAAPL,long,190.5,195.2,188,196,100,1.5,2024-01-15T09:45,2024-01-15T11:30,Breakout,Clean setup",
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Upload CSV"
        action={
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="size-4" />
            Template
          </Button>
        }
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center transition-colors hover:border-primary/50">
          <FileUp className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium">
            {fileName ?? "Choose a CSV file"}
          </span>
          <span className="text-xs text-muted-foreground">
            Headers are auto-mapped (Symbol, Direction, Entry, Quantity, EntryAt…)
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </SectionCard>

      {rows.length > 0 && (
        <SectionCard
          title={`Preview — ${validRows.length} valid${invalidCount ? `, ${invalidCount} skipped` : ""}`}
          action={
            <Button onClick={runImport} disabled={pending || validRows.length === 0}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Import {validRows.length}
            </Button>
          }
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validRows.slice(0, 8).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.symbol}</TableCell>
                    <TableCell className="capitalize">{r.direction}</TableCell>
                    <TableCell className="font-mono">{r.entry_price}</TableCell>
                    <TableCell className="font-mono">{r.exit_price ?? "—"}</TableCell>
                    <TableCell className="font-mono">{r.quantity}</TableCell>
                    <TableCell>{r.entry_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {rows.length === 0 && (
        <EmptyState
          icon={Upload}
          title="Import your trade history"
          description="Export a CSV from your broker or another journal, then upload it here. Download the template to see the expected format."
        />
      )}
    </div>
  );
}
