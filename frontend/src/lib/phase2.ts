import { toast } from "sonner"

/**
 * Single placeholder for Phase 2 entry points ("Start a session",
 * "Analyze new conversation"). Replace this handler when conversation
 * analysis ships. The fixed id prevents duplicate toasts on repeated clicks.
 */
export function announcePhase2() {
  toast("Conversation analysis arrives in the next build.", { id: "phase2-placeholder" })
}
