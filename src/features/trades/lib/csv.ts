import type { TradeWithRelations } from "@/types/models";

const EXPORT_COLUMNS: {
  key: string;
  header: string;
  get: (t: TradeWithRelations) => string | number | null;
}[] = [
  { key: "symbol", header: "Symbol", get: (t) => t.symbol },
  { key: "market", header: "Market", get: (t) => t.market },
  { key: "direction", header: "Direction", get: (t) => t.direction },
  { key: "status", header: "Status", get: (t) => t.status },
  { key: "entry_price", header: "Entry", get: (t) => t.entry_price },
  { key: "exit_price", header: "Exit", get: (t) => t.exit_price },
  { key: "stop_loss", header: "StopLoss", get: (t) => t.stop_loss },
  { key: "target_price", header: "Target", get: (t) => t.target_price },
  { key: "quantity", header: "Quantity", get: (t) => t.quantity },
  { key: "fees", header: "Fees", get: (t) => t.fees },
  { key: "net_pnl", header: "NetPnL", get: (t) => t.net_pnl },
  { key: "r_multiple", header: "RMultiple", get: (t) => t.r_multiple },
  { key: "entry_at", header: "EntryAt", get: (t) => t.entry_at },
  { key: "exit_at", header: "ExitAt", get: (t) => t.exit_at },
  { key: "setup", header: "Setup", get: (t) => t.setup },
  { key: "emotion", header: "Emotion", get: (t) => t.emotion },
  { key: "grade", header: "Grade", get: (t) => t.grade },
  { key: "strategy", header: "Strategy", get: (t) => t.strategy?.name ?? null },
  { key: "tags", header: "Tags", get: (t) => t.tags.map((x) => x.name).join("|") },
  {
    key: "mistakes",
    header: "Mistakes",
    get: (t) => t.mistakes.map((x) => x.label).join("|"),
  },
  { key: "notes", header: "Notes", get: (t) => t.notes },
];

function escapeCell(value: string | number | null): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function tradesToCsv(trades: TradeWithRelations[]): string {
  const header = EXPORT_COLUMNS.map((c) => c.header).join(",");
  const rows = trades.map((t) =>
    EXPORT_COLUMNS.map((c) => escapeCell(c.get(t))).join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal CSV parser supporting quoted fields. Returns rows of string cells. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
