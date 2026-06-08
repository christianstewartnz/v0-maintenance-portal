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

  const { unitNumber, address, ownerName, ownerEmail, ownerPhone } = await req.json();

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      ...(unitNumber !== undefined && { unitNumber }),
      ...(address !== undefined && { address }),
      ownerName: ownerName || null,
      ownerEmail: ownerEmail || null,
      ownerPhone: ownerPhone || null,
    },
  });

  return NextResponse.json(unit);
}
