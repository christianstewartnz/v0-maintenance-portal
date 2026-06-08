import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";

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

  const { archive } = await req.json();

  const existing = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (archive) {
    if (existing.status !== "needs_review" && existing.status !== "error") {
      return NextResponse.json(
        { error: "Only needs_review or error requests can be archived" },
        { status: 409 },
      );
    }
  } else {
    if (existing.status !== "archived") {
      return NextResponse.json(
        { error: "Request is not archived" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: archive ? "archived" : "needs_review" },
    include: { attachments: true },
  });

  return NextResponse.json(updated);
}
