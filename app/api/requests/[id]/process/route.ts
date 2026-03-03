import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";

const VALID_TRADES = new Set([
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Appliance",
  "General",
  "Other",
]);

const VALID_PRIORITIES = new Set(["Low", "Normal", "Urgent"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { unitId, items } = body;

  if (!unitId || typeof unitId !== "string") {
    return NextResponse.json(
      { error: "unitId is required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "At least one item is required" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.title?.trim()) {
      return NextResponse.json(
        { error: "Each item must have a non-empty title" },
        { status: 400 }
      );
    }
    if (!VALID_TRADES.has(item.trade)) {
      return NextResponse.json(
        { error: `Invalid trade: ${item.trade}` },
        { status: 400 }
      );
    }
    if (!VALID_PRIORITIES.has(item.priority)) {
      return NextResponse.json(
        { error: `Invalid priority: ${item.priority}` },
        { status: 400 }
      );
    }
  }

  const [maintenanceRequest, unit] = await Promise.all([
    prisma.maintenanceRequest.findUnique({ where: { id } }),
    prisma.unit.findUnique({ where: { id: unitId } }),
  ]);

  if (!maintenanceRequest) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  if (maintenanceRequest.status !== "needs_review") {
    return NextResponse.json(
      { error: "Request has already been processed" },
      { status: 409 }
    );
  }

  if (!unit) {
    return NextResponse.json(
      { error: "Unit not found" },
      { status: 400 }
    );
  }

  const prismaItems = items.map(
    (item: { title: string; description?: string; trade: string; priority: string }) => ({
      id: crypto.randomUUID(),
      projectId: unit.projectId,
      requestId: id,
      unitId: unit.id,
      title: item.title.trim(),
      description: item.description?.trim() ?? "",
      trade: item.trade,
      priority: item.priority,
    })
  );

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRequest.update({
      where: { id },
      data: { status: "processed" },
    });

    await tx.item.createMany({ data: prismaItems });
  });

  const [updatedRequest, allItems] = await Promise.all([
    prisma.maintenanceRequest.findUnique({ where: { id } }),
    prisma.item.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    request: updatedRequest,
    items: normalizeItems(allItems),
  });
}
