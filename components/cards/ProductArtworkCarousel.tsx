"use client";

import { useState } from "react";
import CardThumbnailPreview from "@/components/cards/CardThumbnailPreview";
import type { CardImageCandidate, CardImageUrls } from "@/components/cards/CardImageCache";

export default function ProductArtworkCarousel({
  alt,
  assetKey,
  fallbackCandidates,
  images = [],
}: {
  alt: string;
  assetKey: string;
  fallbackCandidates: CardImageCandidate[];
  images?: CardImageUrls[];
}) {
  const [index, setIndex] = useState(0);
  const safeIndex = images.length ? index % images.length : 0;
  const active = images[safeIndex];
  const candidates = active ? [{ source: "Provider" as const, urls: active }] : fallbackCandidates;
  const multiple = images.length > 1;

  return (
    <div className="w-24 shrink-0 text-center">
      <CardThumbnailPreview
        alt={`${alt}${multiple ? `, packaging ${safeIndex + 1} of ${images.length}` : ""}`}
        assetKey={`${assetKey}:gallery:${safeIndex}`}
        candidates={candidates}
        className="w-20"
        focusable
        selected
      />
      {multiple ? (
        <div className="mt-2" aria-label={`${images.length} packaging images`} role="group">
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              aria-label="Previous packaging image"
              onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
              className="min-h-11 min-w-11 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next packaging image"
              onClick={() => setIndex((current) => (current + 1) % images.length)}
              className="min-h-11 min-w-11 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              →
            </button>
          </div>
          <p aria-live="polite" className="mt-1 text-[11px] tabular-nums text-zinc-500">
            {safeIndex + 1} of {images.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
