import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWorkOrder, normalizeItems } from "@/lib/normalize";

export async function GET(
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
            project: { select: { id: true, name: true } },
            contractor: true,
            items: {
              include: {
                item: {
                  include: { unit: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Invalid access link" }, { status: 404 });
    }

    const workOrder = normalizeWorkOrder(access.workOrder);
    if (workOrder.items) {
      workOrder.items = workOrder.items.map((woItem: typeof workOrder.items[number]) => {
        if (woItem.item) {
          woItem.item = normalizeItems([woItem.item])[0];
        }
        return woItem;
      });
    }

    return NextResponse.json({
      workOrder,
      isActive: access.isActive,
    });
  } catch (error) {
    console.error("Failed to fetch work order by token:", error);
    return NextResponse.json({ error: "Failed to fetch work order" }, { status: 500 });
  }
}
