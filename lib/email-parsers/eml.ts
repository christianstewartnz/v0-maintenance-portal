import { simpleParser } from "mailparser"
import type { ParsedEmail } from "./types"

export async function parseEml(buffer: Buffer): Promise<ParsedEmail> {
  const parsed = await simpleParser(buffer)

  let fromName = ""
  let fromEmail = ""
  if (parsed.from) {
    const addr = parsed.from.value[0]
    fromName = addr.name || ""
    fromEmail = addr.address || ""
  }

  const body = parsed.text || parsed.html || ""

  const attachments = (parsed.attachments || []).map((att) => ({
    filename: att.filename || "attachment",
    mimeType: att.contentType || "application/octet-stream",
    content: att.content,
  }))

  return {
    fromName,
    fromEmail,
    subject: parsed.subject || "",
    body,
    receivedDate: parsed.date || null,
    attachments,
  }
}
