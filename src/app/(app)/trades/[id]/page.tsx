import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDistanceStrict } from "date-fns";
import { ArrowLeft, ImageIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SymbolIcon } from "@/components/symbol-icon";
import { Badge } from "@/components/ui/badge";
import { getUserCurrency } from "@/features/auth/queries";
import { AiPlaceholderCard } from "@/features/ai/components/ai-placeholder-card";
import { ScreenshotGallery } from "@/features/trades/components/screenshot-gallery";
import { TradeDetailActions } from "@/features/trades/components/trade-detail-actions";
import { TradePriceChart } from "@/features/trades/components/trade-price-chart";
import {
  DirectionBadge,
  GradeBadge,
  PnlText,
  StatusBadge,
} from "@/features/trades/components/trade-badges";
import { getTradeById } from "@/features/trades/queries";
import {
  formatRiskReward,
  plannedRiskReward,
} from "@/features/trades/lib/risk-reward";
import { STORAGE_BUCKETS, EMOTION_LABELS, type Emotion } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatR,
} from "@/lib/format";

export const metadata: Metadata = { title: "Trade details" };

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, currency] = await Promise.all([
    getTradeById(id),
    getUserCurrency(),
  ]);

  if (!trade) notFound();

  // Signed URLs for private screenshots.
  let imageUrls: { url: string; caption: string | null }[] = [];
  if (trade.images.length > 0) {
    const supabase = await createClient();
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKETS.tradeImages)
      .createSignedUrls(
        trade.images.map((i) => i.storage_path),
        3600,
      );
    imageUrls = trade.images.map((img, i) => ({
      url: signed?.[i]?.signedUrl ?? "",
      caption: img.caption,
    }));
  }

  const holding =
    trade.exit_at != null
      ? formatDistanceStrict(new Date(trade.entry_at), new Date(trade.exit_at))
      : "—";

  const riskReward = plannedRiskReward(
    trade.entry_price,
    trade.stop_loss,
    trade.target_price,
  );

  return (
    <PageContainer>
      <Link
        href="/journal"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to journal
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <SymbolIcon
            symbol={trade.symbol}
            market={trade.market}
            size="xl"
            className="mt-0.5"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                {trade.symbol}
              </h1>
              <DirectionBadge direction={trade.direction} />
              <StatusBadge status={trade.status} />
              <GradeBadge grade={trade.grade} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(trade.entry_at)}
              {trade.strategy?.name ? ` · ${trade.strategy.name}` : ""}
              {trade.account?.name ? ` · ${trade.account.name}` : ""}
            </p>
          </div>
        </div>
        <TradeDetailActions trade={trade} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Price action" contentClassName="p-4">
            <TradePriceChart
              entryPrice={trade.entry_price}
              exitPrice={trade.exit_price}
              stopLoss={trade.stop_loss}
              targetPrice={trade.target_price}
              entryAt={trade.entry_at}
              exitAt={trade.exit_at}
              direction={trade.direction}
            />
          </SectionCard>

          <SectionCard title="Screenshots">
            {imageUrls.length > 0 ? (
              <ScreenshotGallery images={imageUrls} />
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="No screenshots"
                description="Add chart screenshots when editing this trade."
                className="border-0"
              />
            )}
          </SectionCard>

          <SectionCard title="Journal">
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {trade.notes || (
                    <span className="text-muted-foreground">No notes.</span>
                  )}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Lessons
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {trade.lessons || (
                    <span className="text-muted-foreground">No lessons recorded.</span>
                  )}
                </p>
              </div>
              {trade.mistakes.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Mistakes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.mistakes.map((m) => (
                      <Badge key={m.id} variant="secondary">
                        {m.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <AiPlaceholderCard
            title="AI Trade Review"
            description="An AI coach will analyse this trade's execution, risk and psychology, then suggest concrete improvements."
            bullets={[
              "Execution quality score",
              "Risk & sizing feedback",
              "Emotional pattern check",
              "What to repeat / avoid",
            ]}
          />
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <SectionCard title="Metrics">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Net P&L</span>
              <PnlText
                value={trade.net_pnl}
                currency={currency}
                className="text-xl"
              />
            </div>
            <div className="divide-y">
              <DataRow label="R multiple" value={formatR(trade.r_multiple)} />
              <DataRow
                label="Entry"
                value={formatNumber(trade.entry_price)}
              />
              <DataRow
                label="Exit"
                value={
                  trade.exit_price == null
                    ? "—"
                    : formatNumber(trade.exit_price)
                }
              />
              <DataRow
                label="Stop loss"
                value={trade.stop_loss == null ? "—" : formatNumber(trade.stop_loss)}
              />
              <DataRow
                label="Target"
                value={
                  trade.target_price == null
                    ? "—"
                    : formatNumber(trade.target_price)
                }
              />
              <DataRow
                label="Risk : reward"
                value={formatRiskReward(riskReward)}
              />
              <DataRow label="Quantity" value={formatNumber(trade.quantity)} />
              <DataRow
                label="Fees"
                value={formatCurrency(trade.fees, currency)}
              />
              <DataRow
                label="Initial risk"
                value={
                  trade.initial_risk == null
                    ? "—"
                    : formatCurrency(trade.initial_risk, currency)
                }
              />
              <DataRow label="Holding time" value={holding} />
            </div>
          </SectionCard>

          <SectionCard title="Classification">
            <div className="divide-y">
              <DataRow label="Strategy" value={trade.strategy?.name ?? "—"} />
              <DataRow label="Setup" value={trade.setup ?? "—"} />
              <DataRow
                label="Emotion"
                value={
                  trade.emotion
                    ? EMOTION_LABELS[trade.emotion as Emotion] ?? trade.emotion
                    : "—"
                }
              />
              <DataRow
                label="Confidence"
                value={trade.confidence ? `${trade.confidence}/5` : "—"}
              />
              <DataRow
                label="Execution"
                value={
                  trade.execution_rating ? `${trade.execution_rating}/5` : "—"
                }
              />
              <DataRow
                label="Discipline"
                value={
                  trade.discipline_rating ? `${trade.discipline_rating}/5` : "—"
                }
              />
            </div>
            {trade.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trade.tags.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Timeline">
            <ol className="relative space-y-4 border-l pl-4">
              <li className="relative">
                <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">Entered</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(trade.entry_at)}
                </p>
              </li>
              {trade.exit_at && (
                <li className="relative">
                  <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-muted-foreground" />
                  <p className="text-sm font-medium">Exited</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(trade.exit_at)}
                  </p>
                </li>
              )}
              <li className="relative">
                <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-border" />
                <p className="text-sm font-medium">Logged</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(trade.created_at)}
                </p>
              </li>
            </ol>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}
