"use client";

import * as React from "react";

import {
  AreaSeries,
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { useTheme } from "next-themes";

interface Props {
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
  entryAt: string;
  exitAt: string | null;
  direction: string;
}

/**
 * A contextual price chart for a single trade. Real OHLC market data isn't
 * stored, so this renders a plausible price path between entry and exit with
 * reference lines for entry / exit / stop / target.
 */
function buildSeries(
  entryPrice: number,
  exitPrice: number | null,
  entryAt: string,
  exitAt: string | null,
) {
  const start = Math.floor(new Date(entryAt).getTime() / 1000);
  const end = exitAt
    ? Math.floor(new Date(exitAt).getTime() / 1000)
    : start + 3600;
  const steps = 60;
  const span = Math.max(end - start, steps);
  const target = exitPrice ?? entryPrice;
  const volatility = Math.abs(target - entryPrice) || entryPrice * 0.01;

  const points: { time: Time; value: number }[] = [];
  let prev = entryPrice;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const drift = entryPrice + (target - entryPrice) * t;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * volatility * 0.18;
    const value = i === 0 ? entryPrice : i === steps ? target : drift + noise;
    prev = value;
    points.push({
      time: (start + Math.round(span * t)) as Time,
      value: Number(prev.toFixed(2)),
    });
  }
  return points;
}

export function TradePriceChart({
  entryPrice,
  exitPrice,
  stopLoss,
  targetPrice,
  entryAt,
  exitAt,
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (!ref.current) return;
    const dark = resolvedTheme === "dark";
    const text = dark ? "#a1a1aa" : "#71717a";
    const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

    const chart: IChartApi = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: text,
        fontFamily: "var(--font-sans)",
      },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: grid },
      rightPriceScale: { borderColor: grid },
      crosshair: { mode: 0 },
      height: 320,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#6366f1",
      topColor: "rgba(99,102,241,0.25)",
      bottomColor: "rgba(99,102,241,0)",
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(buildSeries(entryPrice, exitPrice, entryAt, exitAt));

    const line = (price: number | null, color: string, title: string) => {
      if (price == null) return;
      series.createPriceLine({
        price,
        color,
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title,
      });
    };
    line(entryPrice, "#71717a", "Entry");
    line(exitPrice, exitPrice != null && exitPrice >= entryPrice ? "#22c55e" : "#ef4444", "Exit");
    line(stopLoss, "#ef4444", "Stop");
    line(targetPrice, "#22c55e", "Target");

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [entryPrice, exitPrice, stopLoss, targetPrice, entryAt, exitAt, resolvedTheme]);

  return <div ref={ref} className="h-80 w-full" />;
}
