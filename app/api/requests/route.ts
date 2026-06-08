import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import type { Prisma } from "@/lib/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const unassigned = searchParams.get("unassigned");
    const search = searchParams.get("search");

    const where: Prisma.MaintenanceRequestWhereInput = {
      project: { userId: user.id },
    };

    if (unassigned === "true") {
      where.projectId = null;
    } else if (projectId) {
      where.projectId = projectId;
    }

    if (status === "needs_review" || status === "processed" || status === "error" || status === "archived") {
      where.status = status as Prisma.MaintenanceRequestWhereInput["status"];
    } else {
      where.status = { not: "archived" } as Prisma.MaintenanceRequestWhereInput["status"];
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { fromName: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      include: { attachments: true },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, subject, bodyRaw, fromName, fromEmail } = body;

  if (!subject || !bodyRaw) {
    return NextResponse.json(
      { error: "subject and bodyRaw are required" },
      { status: 400 },
    );
  }

  const created = await prisma.maintenanceRequest.create({
    data: {
      id: crypto.randomUUID(),
      projectId: projectId || null,
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
