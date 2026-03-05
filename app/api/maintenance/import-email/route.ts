import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { prisma } from "@/lib/prisma"
import { parseFile, isAllowedExtension } from "@/lib/email-parsers"
import { detectUnit } from "@/lib/email-parsers/detect-unit"
import type { ParsedEmail } from "@/lib/email-parsers/types"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ATTACHMENTS_DIR = path.join(process.cwd(), "data", "attachments")

interface ImportResult {
  filename: string
  status: "success" | "error"
  requestIds: string[]
  error?: string
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function saveAttachments(
  requestId: string,
  attachments: ParsedEmail["attachments"],
) {
  if (attachments.length === 0) return

  const dir = path.join(ATTACHMENTS_DIR, requestId)
  await ensureDir(dir)

  for (const att of attachments) {
    const safeName = att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filePath = path.join(dir, safeName)

    // Prevent path traversal
    if (!filePath.startsWith(dir)) continue

    await fs.writeFile(filePath, att.content)
    await prisma.maintenanceAttachment.create({
      data: {
        requestId,
        fileName: att.filename,
        mimeType: att.mimeType,
        storagePath: path.join(requestId, safeName),
      },
    })
  }
}

async function createRequestFromParsed(parsed: ParsedEmail): Promise<string> {
  const detectedUnitId = await detectUnit(parsed.subject, parsed.body)

  const request = await prisma.maintenanceRequest.create({
    data: {
      id: crypto.randomUUID(),
      projectId: null,
      fromName: parsed.fromName || "",
      fromEmail: parsed.fromEmail || "",
      subject: parsed.subject || "(no subject)",
      bodyRaw: parsed.body || "",
      receivedAt: parsed.receivedDate || new Date(),
      status: "needs_review",
      detectedUnitId,
    },
  })

  await saveAttachments(request.id, parsed.attachments)

  return request.id
}

async function createErrorRequest(filename: string): Promise<string> {
  const request = await prisma.maintenanceRequest.create({
    data: {
      id: crypto.randomUUID(),
      projectId: null,
      fromName: "",
      fromEmail: "",
      subject: filename,
      bodyRaw: "Unable to parse email",
      receivedAt: new Date(),
      status: "error",
      detectedUnitId: null,
    },
  })
  return request.id
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files")

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 },
      )
    }

    await ensureDir(ATTACHMENTS_DIR)

    const results: ImportResult[] = []

    for (const entry of files) {
      if (!(entry instanceof File)) continue

      const filename = entry.name

      if (!isAllowedExtension(filename)) {
        results.push({
          filename,
          status: "error",
          requestIds: [],
          error: `Unsupported file type: ${path.extname(filename)}`,
        })
        continue
      }

      if (entry.size > MAX_FILE_SIZE) {
        results.push({
          filename,
          status: "error",
          requestIds: [],
          error: `File exceeds 20MB limit`,
        })
        continue
      }

      try {
        const arrayBuffer = await entry.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const parsedEmails = await parseFile(buffer, filename)

        const requestIds: string[] = []
        for (const parsed of parsedEmails) {
          const id = await createRequestFromParsed(parsed)
          requestIds.push(id)
        }

        results.push({ filename, status: "success", requestIds })
      } catch (err) {
        const errorId = await createErrorRequest(filename)
        results.push({
          filename,
          status: "error",
          requestIds: [errorId],
          error: err instanceof Error ? err.message : "Parse failed",
        })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error("Import email error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
