import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";

const STATUS_TO_PRISMA: Record<string, string> = {
  "New": "New",
  "Assigned": "Assigned",
  "In Progress": "InProgress",
  "Completed": "Completed",
  "Closed": "Closed",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { items } = await request.json();

  const prismaItems = items.map((item: Record<string, unknown>) => ({
    ...item,
    status: STATUS_TO_PRISMA[item.status as string] ?? item.status,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  }));

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRequest.update({
      where: { id },
      data: { status: "processed" },
    });

    if (prismaItems.length > 0) {
      await tx.item.createMany({ data: prismaItems });
    }
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
