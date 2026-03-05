import type { ParsedEmail } from "./types"

export async function parseTxt(
  buffer: Buffer,
  filename: string,
): Promise<ParsedEmail> {
  return {
    fromName: "",
    fromEmail: "",
    subject: filename.replace(/\.txt$/i, ""),
    body: buffer.toString("utf-8"),
    receivedDate: null,
    attachments: [],
  }
}
