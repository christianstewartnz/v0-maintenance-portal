import { prisma } from "@/lib/prisma"

/**
 * Attempts to detect a unit number from the subject and body text.
 * Returns the unit ID if a matching unit is found, otherwise null.
 */
export async function detectUnit(
  subject: string,
  body: string,
): Promise<string | null> {
  const combined = `${subject}\n${body}`

  // Try explicit "Unit 101" / "Unit-101" patterns first
  const explicitPattern = /\bUnit[\s\-]?(\d+)\b/gi
  const explicitMatches = [...combined.matchAll(explicitPattern)]

  if (explicitMatches.length > 0) {
    const unitNumber = explicitMatches[0][1]
    const unit = await prisma.unit.findFirst({
      where: { unitNumber },
      select: { id: true },
    })
    if (unit) return unit.id
  }

  // Fallback: look for a standalone 2-4 digit number, only if exactly one match
  const standalonePattern = /\b(\d{2,4})\b/g
  const standaloneMatches = [...combined.matchAll(standalonePattern)]

  if (standaloneMatches.length === 1) {
    const unitNumber = standaloneMatches[0][1]
    const unit = await prisma.unit.findFirst({
      where: { unitNumber },
      select: { id: true },
    })
    if (unit) return unit.id
  }

  return null
}
