import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { ownerName, ownerEmail, ownerPhone } = await req.json();

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      ownerName: ownerName || null,
      ownerEmail: ownerEmail || null,
      ownerPhone: ownerPhone || null,
    },
  });

  return NextResponse.json(unit);
}
