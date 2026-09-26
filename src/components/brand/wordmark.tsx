import { cn } from "@/lib/utils"

/** A short speech trace that settles into a point: one conversation, one data point. */
export function WordmarkGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-[22px] shrink-0 text-brand", className)}
    >
      <path
        d="M2 12h2.2l1.9-4.6 2.3 9.4 2.4-12.2 2.3 11 1.9-5.4 1.6 1.8h1.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20.6" cy="12" r="2.1" fill="currentColor" />
    </svg>
  )
}

export function Wordmark({ className, size = "md" }: { className?: string; size?: "md" | "sm" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-brand", className)}>
      <WordmarkGlyph className={size === "sm" ? "size-[18px]" : undefined} />
      <span
        className={cn(
          "font-semibold tracking-[-0.03em]",
          size === "sm" ? "text-[15px]" : "text-[17px]"
        )}
      >
        MindTrace
      </span>
    </span>
  )
}
