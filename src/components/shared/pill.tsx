import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PillVariant = "primary" | "secondary"
type PillSize = "md" | "sm"

const pillBase =
  "gap-2 rounded-full font-medium tracking-[-0.005em] transition-[background-color,border-color,color,transform] duration-150 ease-out-expo active:translate-y-0 active:scale-[0.98] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas [&_svg]:size-4 [&_svg[data-icon=inline-end]]:transition-transform [&_svg[data-icon=inline-end]]:duration-150 hover:[&_svg[data-icon=inline-end]]:translate-x-0.5"

const pillSizes: Record<PillSize, string> = {
  md: "h-11 px-5 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
  sm: "h-10 px-4 text-[14px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
}

const pillVariants: Record<PillVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border-line-strong bg-transparent text-ink hover:border-[#b8bec8] hover:bg-surface-muted/70",
}

export function pillClassName(variant: PillVariant = "primary", size: PillSize = "md", className?: string) {
  return cn(pillBase, pillSizes[size], pillVariants[variant], className)
}

type PillLinkProps = {
  href: string
  variant?: PillVariant
  size?: PillSize
  className?: string
  children: ReactNode
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">

/** A link styled as a pill button (Base UI `render` composition). */
export function PillLink({ href, variant, size, className, children, ...linkProps }: PillLinkProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={href} {...linkProps} />}
      className={pillClassName(variant, size, className)}
    >
      {children}
    </Button>
  )
}
