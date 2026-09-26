import { Wordmark } from "@/components/brand/wordmark"

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-4 py-10 text-[13px] leading-5 text-ink-tertiary md:flex-row md:items-center md:justify-between">
        <Wordmark size="sm" />
        <p>A caregiver tool, not a diagnostic device. All data shown is synthetic.</p>
        <p>© 2026 MindTrace</p>
      </div>
    </footer>
  )
}
