import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWorkOrder } from "@/lib/normalize";
import { normalizeItems } from "@/lib/normalize";
import { createClient } from "@/lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        contractor: true,
        items: {
          include: {
            item: {
              include: {
                unit: true,
                activities: { orderBy: { createdAt: "desc" } },
              },
            },
          },
        },
        access: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    const normalized = normalizeWorkOrder(workOrder);
    if (normalized.items) {
      normalized.items = normalized.items.map((woItem: typeof normalized.items[number]) => {
        if (woItem.item) {
          woItem.item = normalizeItems([woItem.item])[0];
        }
        return woItem;
      });
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch work order:", error);
    return NextResponse.json({ error: "Failed to fetch work order" }, { status: 500 });
  }
}
