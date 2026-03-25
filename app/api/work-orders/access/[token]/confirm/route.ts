import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyWorkOrderCompleted } from "@/lib/work-order-notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const access = await prisma.workOrderAccess.findUnique({
      where: { token },
      include: {
        workOrder: {
          include: {
            items: true,
            contractor: true,
          },
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Invalid access link" }, { status: 404 });
    }

    if (access.workOrder.status === "Completed" || access.workOrder.status === "Closed") {
      return NextResponse.json(
        { error: "This work order has already been completed" },
        { status: 400 }
      );
    }

    // Verify all items are marked complete
    const incompleteCount = access.workOrder.items.filter(
      (wi) => !wi.isCompletedByContractor
    ).length;

    if (incompleteCount > 0) {
      return NextResponse.json(
        { error: `${incompleteCount} item(s) are not yet marked complete` },
        { status: 400 }
      );
    }

    const now = new Date();

    // Set work order to Completed
    await prisma.workOrder.update({
      where: { id: access.workOrderId },
      data: {
        status: "Completed",
        completedAt: now,
      },
    });

    // Log activity for each item
    const itemIds = access.workOrder.items.map((wi) => wi.itemId);
    await prisma.itemActivity.createMany({
      data: itemIds.map((itemId) => ({
        id: crypto.randomUUID(),
        itemId,
        message: `Work Order ${access.workOrder.reference} completed by contractor`,
      })),
    });

    // Fire notification placeholder
    await notifyWorkOrderCompleted(
      access.workOrder,
      access.workOrder.contractor
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to confirm work order complete:", error);
    return NextResponse.json({ error: "Failed to confirm work order complete" }, { status: 500 });
  }
}
