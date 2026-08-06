"use client";

import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import CardImage from "@/components/cards/CardImage";
import CardThumbnail from "@/components/cards/CardThumbnail";
import type { CardImageCandidate } from "@/components/cards/CardImageCache";

type PreviewPosition = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type CardThumbnailPreviewProps = {
  alt: string;
  assetKey: string;
  candidates: CardImageCandidate[];
  className?: string;
  focusable?: boolean;
  selected?: boolean;
};

const previewGap = 12;
const previewMaximumWidth = 240;

function previewPosition(target: HTMLElement): PreviewPosition {
  const rect = target.getBoundingClientRect();
  const maximumViewportWidth = Math.max(
    120,
    window.innerWidth - previewGap * 2,
  );
  const maximumViewportHeight = Math.max(
    168,
    window.innerHeight - previewGap * 2,
  );
  const width = Math.min(
    previewMaximumWidth,
    maximumViewportWidth,
    maximumViewportHeight * (5 / 7),
  );
  const height = width * (7 / 5);
  const right = rect.right + previewGap;
  const left = rect.left - previewGap - width;
  const unclampedLeft =
    right + width <= window.innerWidth
      ? right
      : left >= 0
        ? left
        : (window.innerWidth - width) / 2;
  return {
    height,
    left: Math.max(
      previewGap,
      Math.min(unclampedLeft, window.innerWidth - width - previewGap),
    ),
    top: Math.max(
      previewGap,
      Math.min(
        rect.top + rect.height / 2 - height / 2,
        window.innerHeight - height - previewGap,
      ),
    ),
    width,
  };
}

export default function CardThumbnailPreview({
  alt,
  assetKey,
  candidates,
  className = "",
  focusable = false,
  selected = false,
}: CardThumbnailPreviewProps) {
  const [position, setPosition] = useState<PreviewPosition | null>(null);
  const dismiss = useCallback(() => setPosition(null), []);
  const show = useCallback((target: HTMLElement) => {
    setPosition(previewPosition(target));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [dismiss]);

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
    } else if (focusable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      show(event.currentTarget);
    }
  }

  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    if (focusable) show(event.currentTarget);
  }

  return (
    <span
      aria-label={focusable ? `Show larger image for ${alt}` : undefined}
      className={`relative inline-block shrink-0 rounded-lg ${focusable ? "cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-zinc-900" : ""}`}
      onBlur={focusable ? dismiss : undefined}
      onClick={handleClick}
      onFocus={focusable ? (event) => show(event.currentTarget) : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={dismiss}
      role={focusable ? "button" : undefined}
      tabIndex={focusable ? 0 : undefined}
    >
      <CardThumbnail
        alt={alt}
        assetKey={assetKey}
        candidates={candidates}
        className={className}
        selected={selected}
      />
      {position && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-label={`Larger card preview: ${alt}`}
              className="pointer-events-none fixed z-[80] rounded-xl border border-cyan-400/70 bg-zinc-950 p-1.5 shadow-2xl shadow-black/80"
              role="img"
              style={{
                height: position.height + 12,
                left: position.left,
                top: position.top,
                width: position.width + 12,
              }}
            >
              <CardImage
                alt={`Larger preview of ${alt}`}
                assetKey={assetKey}
                candidates={candidates}
                className="h-full w-full"
                loading="eager"
                selected
                size="card"
              />
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
