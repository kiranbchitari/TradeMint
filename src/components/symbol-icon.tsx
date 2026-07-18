"use client";

import { useState } from "react";

import type { Market } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Sizing                                                              */
/* ------------------------------------------------------------------ */

const SIZES = {
  sm: { box: "size-6 rounded-md", text: "text-[9px]" },
  md: { box: "size-8 rounded-lg", text: "text-[11px]" },
  lg: { box: "size-10 rounded-lg", text: "text-sm" },
  xl: { box: "size-14 rounded-xl", text: "text-lg" },
} as const;

type SizeKey = keyof typeof SIZES;

/* ------------------------------------------------------------------ */
/* Deterministic monogram fallback                                     */
/* ------------------------------------------------------------------ */

// Tasteful, high-contrast tiles that read on both light and dark themes.
const MONO_COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#3B82F6", // blue
  "#0EA5E9", // sky
  "#06B6D4", // cyan
  "#14B8A6", // teal
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#F43F5E", // rose
  "#D946EF", // fuchsia
  "#8B5A2B", // brown
];

function hashString(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(symbol: string) {
  const cleaned = symbol.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function Monogram({
  symbol,
  size,
  className,
}: {
  symbol: string;
  size: SizeKey;
  className?: string;
}) {
  const s = SIZES[size];
  const color = MONO_COLORS[hashString(symbol) % MONO_COLORS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold text-white ring-1 ring-black/5",
        s.box,
        s.text,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials(symbol)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Symbol parsing                                                      */
/* ------------------------------------------------------------------ */

// ISO currency -> flagcdn country code (EU flag for the euro).
const CURRENCY_COUNTRY: Record<string, string> = {
  USD: "us", EUR: "eu", GBP: "gb", JPY: "jp", CHF: "ch", CAD: "ca",
  AUD: "au", NZD: "nz", INR: "in", CNY: "cn", CNH: "cn", HKD: "hk",
  SGD: "sg", ZAR: "za", MXN: "mx", BRL: "br", SEK: "se", NOK: "no",
  DKK: "dk", PLN: "pl", TRY: "tr", RUB: "ru", KRW: "kr", THB: "th",
  AED: "ae", SAR: "sa",
};

const CRYPTO_QUOTES = [
  "USDT", "USDC", "BUSD", "TUSD", "DAI", "USD", "EUR", "GBP", "INR",
  "BTC", "ETH", "BNB", "PERP",
];

function cleanSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

/** Split a forex pair into [base, quote] country codes, or null. */
function forexFlags(symbol: string): [string, string] | null {
  const parts = cleanSymbol(symbol).split(/[/\-.\s]+/).filter(Boolean);
  let base: string | undefined;
  let quote: string | undefined;
  if (parts.length >= 2) {
    [base, quote] = parts;
  } else {
    const letters = cleanSymbol(symbol).replace(/[^A-Z]/g, "");
    if (letters.length === 6) {
      base = letters.slice(0, 3);
      quote = letters.slice(3, 6);
    }
  }
  if (!base || !quote) return null;
  const bc = CURRENCY_COUNTRY[base];
  const qc = CURRENCY_COUNTRY[quote];
  if (!bc || !qc) return null;
  return [bc, qc];
}

/** Base coin ticker for a crypto pair, e.g. BTCUSDT -> btc. */
function cryptoBase(symbol: string) {
  const cleaned = cleanSymbol(symbol);
  const first = cleaned.split(/[/\-.\s]+/).filter(Boolean)[0] ?? cleaned;
  let base = first;
  for (const q of CRYPTO_QUOTES) {
    if (base.length > q.length && base.endsWith(q)) {
      base = base.slice(0, -q.length);
      break;
    }
  }
  return base.toLowerCase();
}

/** Candidate logo URLs for equities (US direct, then Indian NSE/BSE). */
function equityLogoSrcs(symbol: string) {
  const ticker = cleanSymbol(symbol).split(/[\s/]+/)[0].replace(/[^A-Z0-9.]/g, "");
  if (!ticker) return [];
  const base = "https://assets.parqet.com/logos/symbol/";
  const withSuffix = /\.(NS|BO)$/.test(ticker);
  if (withSuffix) return [`${base}${ticker}`];
  return [`${base}${ticker}`, `${base}${ticker}.NS`, `${base}${ticker}.BO`];
}

/* ------------------------------------------------------------------ */
/* Cascading image (advances through candidate URLs on error)          */
/* ------------------------------------------------------------------ */

function CascadingImg({
  srcs,
  alt,
  imgClassName,
  onExhausted,
}: {
  srcs: string[];
  alt: string;
  imgClassName?: string;
  onExhausted: () => void;
}) {
  const [i, setI] = useState(0);
  const src = srcs[i];
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external logo CDNs; next/image adds no value for tiny best-effort icons
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={imgClassName}
      onError={() => {
        if (i + 1 < srcs.length) setI(i + 1);
        else onExhausted();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SymbolIcon                                                           */
/* ------------------------------------------------------------------ */

export function SymbolIcon({
  symbol,
  market,
  size = "md",
  className,
}: {
  symbol: string;
  market?: Market | string | null;
  size?: SizeKey;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];

  const label = symbol || "?";
  const mono = (
    <Monogram symbol={label} size={size} className={className} />
  );

  if (failed || !symbol) return mono;

  // Forex — dual country flags split across the tile.
  if (market === "forex") {
    const flags = forexFlags(symbol);
    if (flags) {
      return (
        <span
          aria-hidden
          className={cn(
            "inline-flex shrink-0 overflow-hidden ring-1 ring-black/10",
            s.box,
            className,
          )}
        >
          {flags.map((cc, idx) => (
            // eslint-disable-next-line @next/next/no-img-element -- flag CDN
            <img
              key={idx}
              src={`https://flagcdn.com/${cc}.svg`}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-1/2 object-cover"
            />
          ))}
        </span>
      );
    }
    return mono;
  }

  // Crypto — colored coin glyph.
  if (market === "crypto") {
    const base = cryptoBase(symbol);
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-white ring-1 ring-black/5",
          s.box,
          className,
        )}
      >
        <CascadingImg
          srcs={[
            `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${base}.svg`,
          ]}
          alt={label}
          imgClassName="size-full p-0.5"
          onExhausted={() => setFailed(true)}
        />
      </span>
    );
  }

  // Stocks / futures / options — company logos with graceful fallback.
  const srcs = equityLogoSrcs(symbol);
  if (srcs.length === 0) return mono;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/5",
        s.box,
        className,
      )}
    >
      <CascadingImg
        srcs={srcs}
        alt={label}
        imgClassName="size-full object-contain p-1"
        onExhausted={() => setFailed(true)}
      />
    </span>
  );
}
