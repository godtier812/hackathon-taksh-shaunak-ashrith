/** Shared facts for the legal pages. Update these in one place. */
export const LEGAL_UPDATED = "September 26, 2026"

/**
 * Where people can reach the team about privacy or legal questions.
 * Replace with a dedicated email address before launching publicly.
 */
export const LEGAL_CONTACT = {
  label: "the MindTrace project repository",
  href: "https://github.com/godtier812/hackathon-taksh-shaunak-ashrith",
}

export const LEGAL_PAGES = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/medical-disclaimer", label: "Medical disclaimer" },
] as const
