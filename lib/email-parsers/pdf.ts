import { PDFParse } from "pdf-parse"
import type { ParsedEmail } from "./types"

export async function parsePdf(
  buffer: Buffer,
  filename: string,
): Promise<ParsedEmail> {
  const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 })
  const result = await parser.getText()

  return {
    fromName: "",
    fromEmail: "",
    subject: filename.replace(/\.pdf$/i, ""),
    body: result.text || "",
    receivedDate: null,
    attachments: [],
  }
}
