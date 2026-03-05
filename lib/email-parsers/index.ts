import path from "path"
import { parseEml } from "./eml"
import { parseMsg } from "./msg"
import { parseMbox } from "./mbox"
import { parsePdf } from "./pdf"
import { parseTxt } from "./txt"
import { parseZip } from "./zip"
import type { ParsedEmail } from "./types"

export type { ParsedEmail, ParsedAttachment } from "./types"

const ALLOWED_EXTENSIONS = new Set([".eml", ".msg", ".mbox", ".pdf", ".txt", ".zip"])

export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext)
}

export async function parseFile(
  buffer: Buffer,
  filename: string,
  depth = 0,
): Promise<ParsedEmail[]> {
  const ext = path.extname(filename).toLowerCase()

  switch (ext) {
    case ".eml":
      return [await parseEml(buffer)]
    case ".msg":
      return [await parseMsg(buffer)]
    case ".mbox":
      return parseMbox(buffer)
    case ".pdf":
      return [await parsePdf(buffer, filename)]
    case ".txt":
      return [await parseTxt(buffer, filename)]
    case ".zip":
      return parseZip(buffer, depth)
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}
