import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { archive } = await req.json();

  try {
    const contractor = await prisma.contractor.update({
      where: { id },
      data: { isActive: !archive },
    });

    return NextResponse.json(contractor);
  } catch (error) {
    console.error("Failed to archive contractor:", error);
    return NextResponse.json({ error: "Failed to archive contractor" }, { status: 500 });
  }
}
