import Link from "next/link";

import { CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  "Log every trade with screenshots, tags & emotions",
  "Analytics: equity curve, R-multiples, win rate & more",
  "Spot mistakes and patterns before they cost you",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Marketing panel — intentionally dark in both themes */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-neutral-50 lg:flex">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-balance">
            The trading journal that turns your data into an edge.
          </h1>
          <ul className="space-y-3">
            {highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-3 text-sm text-neutral-300"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-neutral-500">
          Built for serious traders.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
