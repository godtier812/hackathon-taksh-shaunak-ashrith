import { API_BASE } from "@/lib/backend/api"
import { createMindTraceClient } from "@/lib/backend/apiClient"

/**
 * The MindTrace desktop app's local API. It only listens on 127.0.0.1, so the
 * website must run on the same computer. Set NEXT_PUBLIC_MINDTRACE_API to point
 * somewhere else.
 */
export const mindtrace = createMindTraceClient(process.env.NEXT_PUBLIC_MINDTRACE_API ?? API_BASE)

export const OFFLINE_MESSAGE =
  "Open the MindTrace desktop app on this computer to analyze a conversation."
