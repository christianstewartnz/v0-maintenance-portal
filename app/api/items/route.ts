import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";
import { createClient } from "@/lib/supabaseServer";
import type { Prisma } from "@/lib/generated/prisma";

const VALID_TRADES = ["Plumbing", "Electrical", "Carpentry", "Painting", "Appliance", "General", "Other"] as const;
const VALID_PRIORITIES = ["Low", "Normal", "Urgent"] as const;

const DISPLAY_STATUS_TO_ENUM: Record<string, string> = {
  "In Progress": "InProgress",
  "Marked Complete - Needs Review": "MarkedCompleteNeedsReview",
  "Completed": "Completed",
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { unitId, title, trade, priority, description = "", otherNotes } = body;

    if (!unitId || typeof unitId !== "string") {
      return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!VALID_TRADES.includes(trade)) {
      return NextResponse.json({ error: "trade is required and must be a valid Trade" }, { status: 400 });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "priority must be Low, Normal, or Urgent" }, { status: 400 });
    }

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const item = await prisma.item.create({
      data: {
        id: crypto.randomUUID(),
        projectId: unit.projectId,
        unitId,
        title: title.trim(),
        description: typeof description === "string" ? description : "",
        trade,
        priority,
        otherNotes: otherNotes && typeof otherNotes === "string" ? otherNotes : null,
      },
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

    await prisma.itemActivity.create({
      data: {
        itemId: item.id,
        message: "Item created manually",
      },
    });

    return NextResponse.json(normalizeItems([item])[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
