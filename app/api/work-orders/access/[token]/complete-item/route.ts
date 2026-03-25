import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyItemCompleted } from "@/lib/work-order-notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const access = await prisma.workOrderAccess.findUnique({
      where: { token },
      include: { workOrder: true },
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

    const { workOrderItemId } = await req.json();
    if (!workOrderItemId) {
      return NextResponse.json(
        { error: "workOrderItemId is required" },
        { status: 400 }
      );
    }

    const woItem = await prisma.workOrderItem.findUnique({
      where: { id: workOrderItemId },
      include: { item: true },
    });

    if (!woItem || woItem.workOrderId !== access.workOrderId) {
      return NextResponse.json({ error: "Item not found on this work order" }, { status: 404 });
    }

    if (woItem.isCompletedByContractor) {
      return NextResponse.json({ error: "Item is already marked complete" }, { status: 400 });
    }

    const now = new Date();

    // Mark the WorkOrderItem complete
    await prisma.workOrderItem.update({
      where: { id: workOrderItemId },
      data: {
        isCompletedByContractor: true,
        completedAt: now,
      },
    });

    // Update the Item status
    await prisma.item.update({
      where: { id: woItem.itemId },
      data: { status: "MarkedCompleteNeedsReview" },
    });

    // Log activity
    await prisma.itemActivity.create({
      data: {
        id: crypto.randomUUID(),
        itemId: woItem.itemId,
        message: `Marked complete by contractor on ${now.toISOString().split("T")[0]}`,
      },
    });

    // If work order was Issued, transition to InProgress
    if (access.workOrder.status === "Issued") {
      await prisma.workOrder.update({
        where: { id: access.workOrderId },
        data: { status: "InProgress" },
      });
    }

    // Fire notification placeholder
    const contractor = await prisma.contractor.findUnique({
      where: { id: access.workOrder.contractorId },
    });
    if (contractor) {
      await notifyItemCompleted(
        access.workOrder.reference,
        woItem.item.title,
        contractor.name
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark item complete:", error);
    return NextResponse.json({ error: "Failed to mark item complete" }, { status: 500 });
  }
}
