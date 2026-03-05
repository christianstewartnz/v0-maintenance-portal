export interface ParsedAttachment {
  filename: string
  mimeType: string
  content: Buffer
}

export interface ParsedEmail {
  fromName: string
  fromEmail: string
  subject: string
  body: string
  receivedDate: Date | null
  attachments: ParsedAttachment[]
}
