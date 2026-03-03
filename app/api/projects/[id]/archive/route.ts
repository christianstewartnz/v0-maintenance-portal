import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { archive } = await req.json();

  const project = await prisma.project.update({
    where: { id },
    data: { archivedAt: archive ? new Date() : null },
  });

  return NextResponse.json(project);
}
