import { ImageResponse } from "next/og";

// Image metadata
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — matches the brand mark in src/app/icon.svg
export default function AppleIcon() {
  const candle = {
    position: "absolute" as const,
    background: "#FFFFFF",
    borderRadius: 10,
  };
  const wick = { ...candle, borderRadius: 5, opacity: 0.85 };

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          borderRadius: 40,
        }}
      >
        {/* left candle (lower) */}
        <div style={{ ...wick, left: 58, top: 34, width: 9, height: 112 }} />
        <div style={{ ...candle, left: 45, top: 68, width: 36, height: 56 }} />
        {/* right candle (higher = uptrend) */}
        <div style={{ ...wick, left: 112, top: 22, width: 9, height: 107 }} />
        <div style={{ ...candle, left: 99, top: 45, width: 36, height: 56 }} />
      </div>
    ),
    { ...size },
  );
}
