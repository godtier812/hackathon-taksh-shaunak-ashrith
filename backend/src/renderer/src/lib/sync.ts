// Short delay before the "available on the caregiver website" badge turns green. The data is already
// available through the local API; the delay just makes the hand-off visible in the demo.
export const SYNC_DELAY_MS = 1200

export function waitForShareAnimation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS))
}
