import { parseEml } from "./eml"
import type { ParsedEmail } from "./types"

/**
 * Split an mbox file on `From ` line boundaries and parse each message as .eml.
 */
export async function parseMbox(buffer: Buffer): Promise<ParsedEmail[]> {
  const text = buffer.toString("utf-8")
  const messages = splitMbox(text)

  const results: ParsedEmail[] = []
  for (const msg of messages) {
    try {
      const parsed = await parseEml(Buffer.from(msg, "utf-8"))
      results.push(parsed)
    } catch {
      // skip unparseable individual messages
    }
  }

  return results
}

function splitMbox(text: string): string[] {
  const parts: string[] = []
  const lines = text.split(/\r?\n/)
  let current: string[] = []

  for (const line of lines) {
    if (/^From\s/.test(line) && current.length > 0) {
      parts.push(current.join("\n"))
      current = []
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) {
    parts.push(current.join("\n"))
  }

  return parts.filter((p) => p.trim().length > 0)
}
