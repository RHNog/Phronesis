"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import CardImagePlaceholder from "@/components/cards/CardImagePlaceholder";
import {
  resolveCardImage,
  shouldBypassCardImageOptimization,
  type CardImageCandidate,
  type CardImageSize,
  type CardImageSource,
} from "@/components/cards/CardImageCache";

type CardImageProps = {
  actions?: ReactNode;
  alt: string;
  assetKey: string;
  candidates: CardImageCandidate[];
  className?: string;
  developerMode?: boolean;
  loading?: "eager" | "lazy";
  overlay?: ReactNode;
  selected?: boolean;
  size?: CardImageSize;
};

const dimensions: Record<CardImageSize, { height: number; width: number }> = {
  thumbnail: { height: 112, width: 80 },
  card: { height: 336, width: 240 },
  preview: { height: 672, width: 480 },
};

export default function CardImage({
  actions,
  alt,
  assetKey,
  candidates,
  className = "",
  developerMode = false,
  loading = "lazy",
  overlay,
  selected = false,
  size = "card",
}: CardImageProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const resolution = useMemo(
    () => resolveCardImage(assetKey, size, candidates),
    [assetKey, candidates, size],
  );
  const showPlaceholder = !resolution.url || failedUrl === resolution.url;
  const displayedSource: CardImageSource = showPlaceholder ? "Placeholder" : resolution.source;

  return (
    <figure
      className={`group/card-image relative aspect-[5/7] shrink-0 overflow-hidden rounded-lg border bg-zinc-950 shadow-sm transition duration-150 ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/40"
          : "border-zinc-700/80 hover:border-cyan-400/60 hover:shadow-md hover:shadow-cyan-950/40"
      } ${className}`}
    >
      {showPlaceholder ? (
        <CardImagePlaceholder alt={alt} compact={size === "thumbnail"} />
      ) : (
        <Image
          alt={alt}
          className="h-full w-full object-cover"
          height={dimensions[size].height}
          loading={loading}
          onError={() => setFailedUrl(resolution.url)}
          sizes={size === "thumbnail" ? "80px" : size === "card" ? "240px" : "480px"}
          src={resolution.url!}
          unoptimized={shouldBypassCardImageOptimization(resolution.url)}
          width={dimensions[size].width}
        />
      )}

      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
      {actions ? (
        <div className="absolute inset-x-1.5 top-1.5 flex justify-end opacity-0 transition group-hover/card-image:opacity-100 group-focus-within/card-image:opacity-100">
          {actions}
        </div>
      ) : null}
      {developerMode ? (
        <figcaption className="absolute inset-x-1 bottom-1 rounded bg-black/85 px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-cyan-100">
          {displayedSource === "Cached" && resolution.sourceDetail
            ? `Cached · ${resolution.sourceDetail}`
            : displayedSource}
        </figcaption>
      ) : null}
    </figure>
  );
}
