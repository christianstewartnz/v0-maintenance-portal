import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        project: true,
        unit: true,
        request: true,
        workOrderItems: {
          include: { workOrder: { select: { id: true, reference: true, status: true } } },
        },
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [normalized] = normalizeItems([item]);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { otherNotes } = body;

  if (otherNotes !== undefined && otherNotes !== null && typeof otherNotes !== "string") {
    return NextResponse.json({ error: "otherNotes must be a string or null" }, { status: 400 });
  }

  try {
    const item = await prisma.item.update({
      where: { id },
      data: {
        otherNotes: typeof otherNotes === "string" ? otherNotes.trim() || null : null,
      },
      include: {
        project: true,
        unit: true,
        request: true,
        workOrderItems: {
          include: { workOrder: { select: { id: true, reference: true, status: true } } },
        },
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    const [normalized] = normalizeItems([item]);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to update item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
