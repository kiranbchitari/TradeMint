"use client";

import * as React from "react";

import { useTheme } from "next-themes";

interface Props {
  symbol: string;
  market: string;
}

/**
 * Live market chart for a trade's instrument, embedded from TradingView's
 * free Advanced Chart widget. Real OHLC isn't stored on the trade, so we
 * resolve the symbol to TradingView and let it stream real data. Entry /
 * exit / stop / target are shown in the Metrics panel beside this chart.
 */
function toTradingViewSymbol(symbol: string, market: string): string {
  const s = symbol.trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return "";
  switch (market) {
    case "forex":
      return `FX:${s.replace(/[^A-Z]/g, "")}`;
    case "crypto":
      return `BINANCE:${s.replace(/[^A-Z0-9]/g, "")}`;
    default:
      // Stocks / futures / options — let TradingView resolve the exchange.
      // (allow_symbol_change lets the user correct it if the guess is off.)
      return s.replace(/[^A-Z0-9.]/g, "");
  }
}

export function TradePriceChart({ symbol, market }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const tvSymbol = toTradingViewSymbol(symbol, market);

  React.useEffect(() => {
    const container = ref.current;
    if (!container || !tvSymbol) return;

    container.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1",
      locale: "en",
      hide_side_toolbar: true,
      allow_symbol_change: true,
      calendar: false,
      backgroundColor:
        resolvedTheme === "dark" ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)",
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [tvSymbol, resolvedTheme]);

  // The height MUST live on an outer wrapper: TradingView's embed script
  // rewrites the `.tradingview-widget-container` element's inline style to
  // height:100%;width:100%, so any height set there is lost and the box
  // collapses to the iframe's 150px default. clamp() keeps it responsive.
  const heightStyle = { height: "clamp(480px, 72vh, 820px)" } as const;

  if (!tvSymbol) {
    return (
      <div
        style={heightStyle}
        className="flex w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
      >
        No symbol to chart.
      </div>
    );
  }

  return (
    <div style={heightStyle} className="w-full overflow-hidden rounded-lg">
      <div ref={ref} className="tradingview-widget-container h-full w-full" />
    </div>
  );
}
