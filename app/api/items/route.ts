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

  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { project: true, unit: true, request: true },
  });
  return NextResponse.json(normalizeItems(items));
}
