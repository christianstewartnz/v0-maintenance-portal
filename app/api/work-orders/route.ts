import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWorkOrders } from "@/lib/normalize";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const contractorId = searchParams.get("contractorId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (contractorId) where.contractorId = contractorId;
  if (status) where.status = status;

  try {
    const workOrders = await prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        contractor: true,
        items: { include: { item: true } },
      },
    });
    return NextResponse.json(normalizeWorkOrders(workOrders));
  } catch (error) {
    console.error("Failed to fetch work orders:", error);
    return NextResponse.json({ error: "Failed to fetch work orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractorId, itemIds, accessNotes, messageBody } = body;

    if (!contractorId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "contractorId and a non-empty itemIds array are required" },
        { status: 400 }
      );
    }

    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, projectId: true },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: "One or more item IDs are invalid" },
        { status: 400 }
      );
    }

    const projectIds = [...new Set(items.map((i) => i.projectId))];
    if (projectIds.length !== 1) {
      return NextResponse.json(
        { error: "All items must belong to the same project" },
        { status: 400 }
      );
    }

    const projectId = projectIds[0];

    // Generate reference WO-NNNN
    const lastWo = await prisma.workOrder.findFirst({
      orderBy: { reference: "desc" },
      select: { reference: true },
    });
    let nextNum = 1001;
    if (lastWo) {
      const match = lastWo.reference.match(/WO-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const reference = `WO-${nextNum}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        id: crypto.randomUUID(),
        reference,
        projectId,
        contractorId,
        accessNotes: accessNotes || null,
        messageBody: messageBody || null,
        items: {
          create: itemIds.map((itemId: string) => ({
            id: crypto.randomUUID(),
            itemId,
          })),
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        contractor: true,
        items: { include: { item: { include: { unit: true } } } },
      },
    });

    // Log activity for each item
    await prisma.itemActivity.createMany({
      data: itemIds.map((itemId: string) => ({
        id: crypto.randomUUID(),
        itemId,
        message: `Assigned to Work Order ${reference}`,
      })),
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create work order:", error);
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}
