import AdmZip from "adm-zip"
import path from "path"
import { parseFile } from "./index"
import type { ParsedEmail } from "./types"

const MAX_DEPTH = 3

export async function parseZip(
  buffer: Buffer,
  depth = 0,
): Promise<ParsedEmail[]> {
  if (depth >= MAX_DEPTH) return []

  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()
  const results: ParsedEmail[] = []

  for (const entry of entries) {
    if (entry.isDirectory) continue

    const entryName = entry.entryName
    const normalized = path.normalize(entryName)
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) continue

    const content = entry.getData()
    if (!content || content.length === 0) continue

    try {
      const parsed = await parseFile(content, path.basename(entryName), depth + 1)
      results.push(...parsed)
    } catch {
      // skip unparseable entries
    }
  }

  return results
}
