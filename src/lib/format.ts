// Fixed locale and timezone so server and client output always match.
const fullDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
})
const shortDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
})
const monthShort = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" })
const monthYear = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
})

/** "Jun 2, 2026" */
export const formatDate = (t: number) => fullDate.format(t)
/** "Jun 2" */
export const formatShortDate = (t: number) => shortDate.format(t)
/** "Jun" */
export const formatMonth = (t: number) => monthShort.format(t)
/** "June 2026" */
export const formatMonthYear = (t: number) => monthYear.format(t)

const MINUS = "−"

/** Signed number with a true minus sign: "+18", "−6.2", "0". */
export function formatSigned(value: number, digits = 0) {
  const fixed = Math.abs(value).toFixed(digits)
  if (Number(fixed) === 0) return fixed
  return value > 0 ? `+${fixed}` : `${MINUS}${fixed}`
}

/** "0:07" */
export function formatClock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}
