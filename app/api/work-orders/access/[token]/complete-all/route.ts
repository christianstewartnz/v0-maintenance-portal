import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
            items: { include: { item: true } },
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

    const now = new Date();
    const incompleteItems = access.workOrder.items.filter((wi) => !wi.isCompletedByContractor);

    if (incompleteItems.length === 0) {
      return NextResponse.json({ success: true, message: "All items were already complete" });
    }

    // Mark all incomplete WorkOrderItems as complete
    await prisma.workOrderItem.updateMany({
      where: {
        workOrderId: access.workOrderId,
        isCompletedByContractor: false,
      },
      data: {
        isCompletedByContractor: true,
        completedAt: now,
      },
    });

    // Update all related Item statuses
    const itemIds = incompleteItems.map((wi) => wi.itemId);
    await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: { status: "MarkedCompleteNeedsReview" },
    });

    // Log activity for each item
    await prisma.itemActivity.createMany({
      data: itemIds.map((itemId) => ({
        id: crypto.randomUUID(),
        itemId,
        message: `Marked complete by contractor on ${now.toISOString().split("T")[0]}`,
      })),
    });

    // Transition work order to InProgress if it was Issued
    if (access.workOrder.status === "Issued") {
      await prisma.workOrder.update({
        where: { id: access.workOrderId },
        data: { status: "InProgress" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all items complete:", error);
    return NextResponse.json({ error: "Failed to mark all items complete" }, { status: 500 });
  }
}
