"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ScreenshotGallery({
  images,
}: {
  images: { url: string; caption: string | null }[];
}) {
  const [active, setActive] = React.useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-video overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? `Screenshot ${i + 1}`}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(o) => !o && setActive(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-4xl p-2">
          <DialogTitle className="sr-only">Screenshot</DialogTitle>
          {active !== null && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[active].url}
                alt={images[active].caption ?? "Screenshot"}
                className="max-h-[80vh] w-full rounded-md object-contain"
              />
              {images[active].caption && (
                <p className="p-2 text-center text-sm text-muted-foreground">
                  {images[active].caption}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
