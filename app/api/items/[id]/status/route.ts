import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";

const DISPLAY_STATUS_TO_ENUM: Record<string, string> = {
  "In Progress": "InProgress",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = await req.json();

  const dbStatus = DISPLAY_STATUS_TO_ENUM[status] ?? status;

  const item = await prisma.item.update({
    where: { id },
    data: { status: dbStatus as never },
    include: { project: true, unit: true, request: true },
  });

  return NextResponse.json(normalizeItems([item])[0]);
}
