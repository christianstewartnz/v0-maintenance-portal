import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWorkOrder } from "@/lib/normalize";
import { createClient } from "@/lib/supabaseServer";

export async function POST(
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
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    if (workOrder.status === "Closed") {
      return NextResponse.json(
        { error: "Work order is already closed" },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "Closed",
        closedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        contractor: true,
        items: { include: { item: true } },
      },
    });

    return NextResponse.json(normalizeWorkOrder(updated));
  } catch (error) {
    console.error("Failed to close work order:", error);
    return NextResponse.json({ error: "Failed to close work order" }, { status: 500 });
  }
}
