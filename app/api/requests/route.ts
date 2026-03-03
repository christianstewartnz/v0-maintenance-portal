import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const where: Prisma.MaintenanceRequestWhereInput = { projectId };
  if (status === "needs_review" || status === "processed") {
    where.status = status;
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, subject, bodyRaw, fromName, fromEmail } = body;

  if (!projectId || !subject || !bodyRaw) {
    return NextResponse.json(
      { error: "projectId, subject, and bodyRaw are required" },
      { status: 400 },
    );
  }

  const created = await prisma.maintenanceRequest.create({
    data: {
      id: crypto.randomUUID(),
      projectId,
      subject,
      bodyRaw,
      fromName: fromName || "",
      fromEmail: fromEmail || "",
      receivedAt: new Date(),
      status: "needs_review",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
