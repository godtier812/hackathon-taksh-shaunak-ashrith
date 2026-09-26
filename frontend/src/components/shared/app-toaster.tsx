"use client"

import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={24}
      mobileOffset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-inner border border-line bg-surface px-4 py-3.5 shadow-raised sm:w-[360px]",
          title: "text-[14px] leading-snug font-medium text-ink",
        },
      }}
    />
  )
}
