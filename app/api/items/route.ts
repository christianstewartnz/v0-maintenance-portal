import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";
import type { Prisma } from "@/lib/generated/prisma";

const DISPLAY_STATUS_TO_ENUM: Record<string, string> = {
  "In Progress": "InProgress",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const trade = searchParams.get("trade");
  const unitId = searchParams.get("unitId");
  const requestId = searchParams.get("requestId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const where: Prisma.ItemWhereInput = { projectId };
  if (status) {
    where.status = (DISPLAY_STATUS_TO_ENUM[status] ?? status) as Prisma.ItemWhereInput["status"];
  }
  if (trade) {
    where.trade = trade as Prisma.ItemWhereInput["trade"];
  }
  if (unitId) {
    where.unitId = unitId;
  }
  if (requestId) {
    where.requestId = requestId;
  }

  try {
    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: true,
        unit: true,
        request: true,
        workOrderItems: {
          include: { workOrder: { select: { id: true, reference: true, status: true } } },
        },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    return NextResponse.json(normalizeItems(items));
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}
