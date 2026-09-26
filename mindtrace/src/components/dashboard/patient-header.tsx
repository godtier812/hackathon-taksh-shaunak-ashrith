import { AudioLines } from "lucide-react"

import { Phase2Button } from "@/components/shared/phase2-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { patient } from "@/lib/demo/margaret"

export function PatientHeader({ asHeading }: { asHeading: boolean }) {
  const Name = asHeading ? "h1" : "p"

  return (
    <header className="flex flex-col gap-6 @2xl:flex-row @2xl:items-center @2xl:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="size-12 after:border-line">
          <AvatarFallback className="bg-surface-muted text-[15px] font-medium tracking-[-0.01em] text-ink-secondary">
            {patient.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Name className="type-page text-ink">{patient.name}</Name>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="type-body text-ink-secondary">
              Age {patient.age} · Monitoring since {patient.monitoringSince}
            </p>
            <p className="inline-flex items-center gap-2 type-label text-ink">
              <span aria-hidden="true" className="relative inline-flex size-2">
                <span className="absolute inset-0 rounded-full bg-accent motion-ok:animate-[status-halo_2.8s_var(--ease-out-expo)_infinite]" />
                <span className="relative size-2 rounded-full bg-accent" />
              </span>
              Active monitoring
            </p>
          </div>
        </div>
      </div>

      <Phase2Button className="w-full shrink-0 @2xl:w-auto">
        <AudioLines data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
        Analyze new conversation
      </Phase2Button>
    </header>
  )
}
