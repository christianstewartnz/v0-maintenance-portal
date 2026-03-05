import MsgReader from "msgreader"
import type { ParsedEmail } from "./types"

export async function parseMsg(buffer: Buffer): Promise<ParsedEmail> {
  const reader = new MsgReader(buffer)
  const fileData = reader.getFileData() as Record<string, unknown>

  const fromName = (fileData.senderName as string) || ""
  const fromEmail = (fileData.senderEmail as string) || ""
  const subject = (fileData.subject as string) || ""
  const body = (fileData.body as string) || ""

  const headers = fileData.headers as string | undefined
  let receivedDate: Date | null = null
  if (headers) {
    const dateMatch = headers.match(/^Date:\s*(.+)$/im)
    if (dateMatch) {
      const d = new Date(dateMatch[1])
      if (!isNaN(d.getTime())) receivedDate = d
    }
  }

  const rawAttachments = (fileData.attachments as Array<Record<string, unknown>>) || []
  const attachments = rawAttachments.map((att, i) => {
    const attData = reader.getAttachment(i)
    return {
      filename: (att.fileName as string) || (att.name as string) || "attachment",
      mimeType: (att.mimeType as string) || "application/octet-stream",
      content: Buffer.from(attData?.content || []),
    }
  })

  return { fromName, fromEmail, subject, body, receivedDate, attachments }
}
