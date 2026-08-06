import Image from "next/image";

export default function PhronesisBrand({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className={`relative shrink-0 overflow-hidden rounded-full border border-amber-300/50 bg-white shadow-sm shadow-black/50 ${compact ? "h-8 w-8" : "h-10 w-10"}`}
      >
        <Image
          src="/brand/phronesis-logo.png"
          alt=""
          fill
          priority
          sizes={compact ? "32px" : "40px"}
          className="object-cover"
        />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-lg font-semibold tracking-tight text-white">
            Phronesis
          </span>
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200/70">
            Practical wisdom
          </span>
        </span>
      ) : null}
    </span>
  );
}
