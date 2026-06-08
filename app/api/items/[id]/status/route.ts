import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";
import { createClient } from "@/lib/supabaseServer";

const DISPLAY_STATUS_TO_ENUM: Record<string, string> = {
  "In Progress": "InProgress",
  "Marked Complete - Needs Review": "MarkedCompleteNeedsReview",
  "Completed": "Completed",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();

  const dbStatus = DISPLAY_STATUS_TO_ENUM[status] ?? status;

  const item = await prisma.item.update({
    where: { id },
    data: { status: dbStatus as never },
    include: { project: true, unit: true, request: true },
  });

  return NextResponse.json(normalizeItems([item])[0]);
}
