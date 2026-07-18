"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format as formatDate, parseISO } from "date-fns";
import { ClipboardPaste, ImagePlus, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { RatingInput } from "@/components/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DIRECTIONS,
  DIRECTION_LABELS,
  EMOTIONS,
  EMOTION_LABELS,
  GRADES,
  MARKETS,
  MARKET_LABELS,
  TRADE_STATUSES,
  TRADE_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/models";

import {
  createTradeAction,
  updateTradeAction,
  addTradeImagesAction,
  deleteTradeImageAction,
} from "../actions";
import { useTradeOptions } from "../hooks/use-trade-options";
import { getSignedUrls, uploadTradeImages } from "../lib/images";
import { formatRiskReward, plannedRiskReward } from "../lib/risk-reward";
import { tradeFormSchema, type TradeFormValues } from "../schemas";
import { createTagAction } from "@/features/tags/actions";
import { createMistakeAction } from "@/features/mistakes/actions";

const NONE = "__none__";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatDate(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function defaultsFor(trade?: TradeWithRelations | null): TradeFormValues {
  if (!trade) {
    return {
      symbol: "",
      market: "stock",
      direction: "long",
      status: "closed",
      accountId: null,
      brokerId: null,
      strategyId: null,
      entryPrice: "",
      exitPrice: "",
      stopLoss: "",
      targetPrice: "",
      quantity: "",
      multiplier: 1,
      fees: 0,
      riskAmount: "",
      rewardAmount: "",
      entryAt: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
      exitAt: "",
      setup: "",
      emotion: null,
      confidence: "",
      executionRating: "",
      disciplineRating: "",
      grade: null,
      lessons: "",
      notes: "",
      tagIds: [],
      mistakeIds: [],
    } as TradeFormValues;
  }
  return {
    symbol: trade.symbol,
    market: trade.market as TradeFormValues["market"],
    direction: trade.direction as TradeFormValues["direction"],
    status: trade.status as TradeFormValues["status"],
    accountId: trade.account_id,
    brokerId: trade.broker_id,
    strategyId: trade.strategy_id,
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price ?? "",
    stopLoss: trade.stop_loss ?? "",
    targetPrice: trade.target_price ?? "",
    quantity: trade.quantity,
    multiplier: trade.multiplier,
    fees: trade.fees,
    riskAmount: trade.risk_amount ?? "",
    rewardAmount: trade.reward_amount ?? "",
    entryAt: toLocalInput(trade.entry_at),
    exitAt: toLocalInput(trade.exit_at),
    setup: trade.setup ?? "",
    emotion: (trade.emotion as TradeFormValues["emotion"]) ?? null,
    confidence: trade.confidence ?? "",
    executionRating: trade.execution_rating ?? "",
    disciplineRating: trade.discipline_rating ?? "",
    grade: (trade.grade as TradeFormValues["grade"]) ?? null,
    lessons: trade.lessons ?? "",
    notes: trade.notes ?? "",
    tagIds: trade.tags.map((t) => t.id),
    mistakeIds: trade.mistakes.map((m) => m.id),
  } as TradeFormValues;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export function TradeFormDialog({
  open,
  onOpenChange,
  trade,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade?: TradeWithRelations | null;
  onSaved?: (tradeId: string) => void;
}) {
  const isEdit = !!trade;
  const queryClient = useQueryClient();
  const { data: options } = useTradeOptions();

  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [existing, setExisting] = React.useState<
    { id: string; path: string; url?: string }[]
  >([]);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<TradeFormValues, unknown, TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: defaultsFor(trade),
  });

  // Reset whenever the dialog opens for a new/edited trade.
  React.useEffect(() => {
    if (open) {
      form.reset(defaultsFor(trade));
      setFiles([]);
      setPreviews([]);
      if (trade?.images.length) {
        setExisting(trade.images.map((i) => ({ id: i.id, path: i.storage_path })));
        getSignedUrls(trade.images.map((i) => i.storage_path)).then((map) => {
          setExisting((prev) =>
            prev.map((e) => ({ ...e, url: map[e.path] })),
          );
        });
      } else {
        setExisting([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trade?.id]);

  const addFiles = React.useCallback((incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    const capped = images.slice(0, 8);
    setFiles((prev) => [...prev, ...capped]);
    setPreviews((prev) => [
      ...prev,
      ...capped.map((f) => URL.createObjectURL(f)),
    ]);
  }, []);

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    addFiles(Array.from(list));
  }

  // Paste screenshots from the clipboard (Ctrl/⌘+V) anywhere in the dialog.
  React.useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
            pasted.push(
              new File([blob], `screenshot-${Date.now()}-${pasted.length}.${ext}`, {
                type: blob.type,
              }),
            );
          }
        }
      }
      if (pasted.length > 0) {
        e.preventDefault();
        addFiles(pasted);
        toast.success(
          pasted.length === 1
            ? "Screenshot pasted"
            : `${pasted.length} screenshots pasted`,
        );
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, addFiles]);

  function removeNewFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function removeExisting(imageId: string) {
    // Optimistically drop it from the grid, then delete server-side.
    setExisting((prev) => prev.filter((e) => e.id !== imageId));
    const res = await deleteTradeImageAction(imageId);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Screenshot removed");
    await queryClient.invalidateQueries({ queryKey: ["trades"] });
  }

  async function onSubmit(values: TradeFormValues) {
    setSubmitting(true);
    try {
      const res = isEdit
        ? await updateTradeAction(trade!.id, values)
        : await createTradeAction(values);

      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      const tradeId = res.data!.id;

      if (files.length > 0) {
        const uploaded = await uploadTradeImages(tradeId, files);
        if (uploaded.length > 0) {
          await addTradeImagesAction(tradeId, uploaded);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success(isEdit ? "Trade updated" : "Trade logged");
      onOpenChange(false);
      onSaved?.(tradeId);
    } finally {
      setSubmitting(false);
    }
  }

  const rr = plannedRiskReward(
    form.watch("entryPrice"),
    form.watch("stopLoss"),
    form.watch("targetPrice"),
  );

  const strategyOptions = options?.strategies ?? [];
  const accountOptions = options?.accounts ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEdit ? "Edit trade" : "Log a trade"}</DialogTitle>
          <DialogDescription>
            Record the details, psychology and screenshots of your trade.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid max-h-[64vh] grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <SectionTitle>Instrument</SectionTitle>

              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrument</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AAPL"
                        className="h-9 uppercase"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARKETS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {MARKET_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIRECTIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DIRECTION_LABELS[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRADE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {TRADE_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionTitle>Prices & size</SectionTitle>

              {(
                [
                  ["entryPrice", "Entry price"],
                  ["exitPrice", "Exit price"],
                  ["stopLoss", "Stop loss"],
                  ["targetPrice", "Target"],
                  ["quantity", "Quantity"],
                  ["fees", "Fees"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          className="h-9 font-mono"
                          placeholder="0.00"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">
                    Planned risk : reward
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatRiskReward(rr)}
                  </span>
                </div>
                {rr == null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter entry price, stop loss and target to see the ratio.
                  </p>
                )}
              </div>

              <SectionTitle>Timing</SectionTitle>

              <FormField
                control={form.control}
                name="entryAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry date &amp; time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-9"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit date &amp; time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-9"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SectionTitle>Classification</SectionTitle>

              <FormField
                control={form.control}
                name="strategyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {strategyOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {accountOptions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="setup"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Setup</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Breakout retest"
                        className="h-9"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={(options?.tags ?? []).map((t) => ({
                          value: t.id,
                          label: t.name,
                          color: t.color,
                        }))}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Add tags…"
                        onCreate={async (label) => {
                          const res = await createTagAction(label);
                          if ("error" in res && res.error) {
                            toast.error(res.error);
                            return null;
                          }
                          await queryClient.invalidateQueries({
                            queryKey: ["trade-options"],
                          });
                          return { value: res.data!.id, label: res.data!.name };
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <SectionTitle>Psychology</SectionTitle>

              <FormField
                control={form.control}
                name="emotion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emotion</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {EMOTIONS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {EMOTION_LABELS[e]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {GRADES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {(
                [
                  ["confidence", "Confidence"],
                  ["executionRating", "Execution"],
                  ["disciplineRating", "Discipline"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <RatingInput
                          value={
                            field.value === "" || field.value == null
                              ? null
                              : Number(field.value)
                          }
                          onChange={(v) => field.onChange(v ?? "")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="mistakeIds"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Mistakes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={(options?.mistakes ?? []).map((m) => ({
                          value: m.id,
                          label: m.label,
                          color: m.color,
                        }))}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Tag any mistakes…"
                        onCreate={async (label) => {
                          const res = await createMistakeAction(label);
                          if ("error" in res && res.error) {
                            toast.error(res.error);
                            return null;
                          }
                          await queryClient.invalidateQueries({
                            queryKey: ["trade-options"],
                          });
                          return { value: res.data!.id, label: res.data!.label };
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <SectionTitle>Screenshots</SectionTitle>

              <div className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {existing.map((img) => (
                    <div
                      key={img.id}
                      className="group relative size-20 overflow-hidden rounded-lg border bg-muted"
                    >
                      {img.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt="Trade screenshot"
                          className="size-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExisting(img.id)}
                        aria-label="Delete screenshot"
                        className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 text-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {previews.map((src, i) => (
                    <div
                      key={src}
                      className="group relative size-20 overflow-hidden rounded-lg border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 text-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <label
                    className={cn(
                      "flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    <ImagePlus className="size-5" />
                    <span className="text-[10px]">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickFiles(e.target.files)}
                    />
                  </label>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClipboardPaste className="size-3.5" />
                  Paste a screenshot with{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
                    Ctrl/⌘ + V
                  </kbd>
                </p>
              </div>

              <SectionTitle>Journal</SectionTitle>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="What happened, and why did you take this trade?"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessons"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Lessons</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="What will you do differently next time?"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Log trade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
