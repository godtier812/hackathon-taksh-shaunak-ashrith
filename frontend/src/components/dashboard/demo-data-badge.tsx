"use client"

import { Popover } from "@base-ui/react/popover"

/** "Demo data" disclosure: opens on hover, focus or tap. */
export function DemoDataBadge() {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        className="relative inline-flex h-8 items-center gap-2 rounded-full border border-line-strong bg-surface px-3 type-label text-ink-secondary transition-colors duration-150 after:absolute after:-inset-1.5 after:content-[''] hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none data-popup-open:text-ink"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-neutral-trend" />
        Demo data
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup className="max-w-[260px] origin-(--transform-origin) rounded-inner bg-ink px-3.5 py-2.5 text-[12px] leading-snug text-canvas shadow-raised outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            Margaret Reynolds is a fictional person. All values are synthetic.
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
