import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWorkOrder } from "@/lib/normalize";
import { generateWorkOrderEmail, sendWorkOrderEmail } from "@/lib/work-order-email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        items: { include: { item: { include: { unit: true } } } },
        contractor: true,
        project: { select: { id: true, name: true } },
        access: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    if (workOrder.status !== "Draft") {
      return NextResponse.json(
        { error: "Only draft work orders can be issued" },
        { status: 400 }
      );
    }

    // Generate access token if none exists
    let accessToken = workOrder.access.find((a) => a.isActive)?.token;
    if (!accessToken) {
      accessToken = crypto.randomUUID();
      await prisma.workOrderAccess.create({
        data: {
          id: crypto.randomUUID(),
          workOrderId: id,
          token: accessToken,
        },
      });
    }

    // Update work order status
    const now = new Date();
    await prisma.workOrder.update({
      where: { id },
      data: {
        status: "Issued",
        issuedAt: now,
      },
    });

    // Set all items to Assigned and log activity
    const itemIds = workOrder.items.map((wi) => wi.itemId);
    await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: { status: "Assigned" },
    });

    await prisma.itemActivity.createMany({
      data: itemIds.map((itemId) => ({
        id: crypto.randomUUID(),
        itemId,
        message: `Work Order ${workOrder.reference} issued`,
      })),
    });

    // Build access URL
    const baseUrl = req.nextUrl.origin;
    const accessUrl = `${baseUrl}/work-orders/access/${accessToken}`;

    // Prepare and send email
    const emailData = generateWorkOrderEmail({
      workOrder: { ...workOrder, status: "Issued", issuedAt: now.toISOString() } as any,
      contractor: workOrder.contractor,
      project: workOrder.project,
      items: workOrder.items as any,
      accessUrl,
    });
    await sendWorkOrderEmail(emailData);

    // Refetch updated work order
    const updated = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        contractor: true,
        items: { include: { item: { include: { unit: true } } } },
        access: true,
      },
    });

    return NextResponse.json({
      workOrder: normalizeWorkOrder(updated!),
      accessUrl,
    });
  } catch (error) {
    console.error("Failed to issue work order:", error);
    return NextResponse.json({ error: "Failed to issue work order" }, { status: 500 });
  }
}
