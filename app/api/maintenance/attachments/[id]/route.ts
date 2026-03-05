import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { prisma } from "@/lib/prisma"

const ATTACHMENTS_DIR = path.join(process.cwd(), "data", "attachments")

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const attachment = await prisma.maintenanceAttachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const filePath = path.join(ATTACHMENTS_DIR, attachment.storagePath)
  const normalized = path.resolve(filePath)
  if (!normalized.startsWith(path.resolve(ATTACHMENTS_DIR))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const fileBuffer = await fs.readFile(normalized)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
