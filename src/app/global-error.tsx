"use client";

import { useEffect } from "react";

// Last-resort boundary for errors thrown in the root layout itself (which the
// nested (app)/error.tsx cannot catch). Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Something went wrong
        </h2>
        <p style={{ maxWidth: "24rem", fontSize: "0.875rem", opacity: 0.7 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #333",
            background: "#fafafa",
            color: "#0a0a0a",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
