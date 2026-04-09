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

    const { workOrderItemId, completionNotes } = await req.json();
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

    const wasCompleted = woItem.isCompletedByContractor;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      if (wasCompleted) {
        // Toggle back to incomplete before final confirmation.
        await tx.workOrderItem.update({
          where: { id: workOrderItemId },
          data: {
            isCompletedByContractor: false,
            completedAt: null,
          },
        });

        // Revert status only when it is currently in contractor-complete review state.
        await tx.item.updateMany({
          where: { id: woItem.itemId, status: "MarkedCompleteNeedsReview" },
          data: { status: "Assigned" },
        });

        await tx.itemActivity.create({
          data: {
            id: crypto.randomUUID(),
            itemId: woItem.itemId,
            message: `Marked incomplete by contractor on ${now.toISOString().split("T")[0]}`,
          },
        });
      } else {
        await tx.workOrderItem.update({
          where: { id: workOrderItemId },
          data: {
            isCompletedByContractor: true,
            completedAt: now,
            completionNotes: typeof completionNotes === "string" && completionNotes.trim()
              ? completionNotes.trim()
              : null,
          },
        });

        await tx.item.update({
          where: { id: woItem.itemId },
          data: { status: "MarkedCompleteNeedsReview" },
        });

        await tx.itemActivity.create({
          data: {
            id: crypto.randomUUID(),
            itemId: woItem.itemId,
            message: `Marked complete by contractor on ${now.toISOString().split("T")[0]}`,
          },
        });
      }

      // Keep Work Order status aligned with checklist progress before final confirmation.
      const completion = await tx.workOrderItem.aggregate({
        where: {
          workOrderId: access.workOrderId,
          isCompletedByContractor: true,
        },
        _count: { _all: true },
      });
      const completedCount = completion._count._all;

      if (completedCount === 0 && access.workOrder.status === "InProgress") {
        await tx.workOrder.update({
          where: { id: access.workOrderId },
          data: { status: "Issued" },
        });
      } else if (completedCount > 0 && access.workOrder.status === "Issued") {
        await tx.workOrder.update({
          where: { id: access.workOrderId },
          data: { status: "InProgress" },
        });
      }
    });

    if (!wasCompleted) {
      // Notify only when moving into completed state.
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
    }

    return NextResponse.json({ success: true, isCompletedByContractor: !wasCompleted });
  } catch (error) {
    console.error("Failed to toggle item completion:", error);
    return NextResponse.json({ error: "Failed to toggle item completion" }, { status: 500 });
  }
}
