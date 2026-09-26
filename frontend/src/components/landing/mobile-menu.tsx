"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Menu } from "lucide-react"
import Link from "next/link"

import { useScrollToSection } from "@/components/providers/smooth-scroll"
import { SwitchTrack } from "@/components/shared/motion-toggle"
import { setMotionEnabled, usePrefersReducedMotion } from "@/lib/hooks"

const itemClass =
  "flex h-11 cursor-pointer items-center justify-between gap-6 rounded-[8px] px-3 text-[15px] text-ink outline-none select-none data-highlighted:bg-surface-muted"

/** Small-screen navigation: section links, the demo, and the Motion switch. */
export function MobileMenu() {
  const scrollToSection = useScrollToSection()
  const motionOn = !usePrefersReducedMotion()

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        aria-label="Menu"
        className="inline-flex size-11 items-center justify-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none data-popup-open:bg-surface-muted data-popup-open:text-ink md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <MenuPrimitive.Popup className="min-w-[232px] origin-(--transform-origin) rounded-inner border border-line bg-surface p-1.5 shadow-raised outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <MenuPrimitive.Item className={itemClass} onClick={() => scrollToSection("#how-it-works")}>
              How it works
            </MenuPrimitive.Item>
            <MenuPrimitive.Item className={itemClass} onClick={() => scrollToSection("#the-science")}>
              The science
            </MenuPrimitive.Item>
            <MenuPrimitive.LinkItem className={itemClass} render={<Link href="/dashboard" />}>
              View demo
            </MenuPrimitive.LinkItem>
            <MenuPrimitive.Separator className="mx-2 my-1 h-px bg-line" />
            <MenuPrimitive.CheckboxItem
              className={itemClass}
              checked={motionOn}
              onCheckedChange={(checked) => setMotionEnabled(checked)}
              closeOnClick={false}
            >
              Motion
              <SwitchTrack on={motionOn} />
            </MenuPrimitive.CheckboxItem>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}
