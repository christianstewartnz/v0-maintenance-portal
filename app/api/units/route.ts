import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";

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

    const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

    const units = await prisma.unit.findMany({
      where: {
        project: { userId: user.id },
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: { unitNumber: "asc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, unitNumber, address, ownerName, ownerEmail, ownerPhone } = body;

  if (!projectId || !unitNumber || !address) {
    return NextResponse.json(
      { error: "projectId, unitNumber, and address are required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const created = await prisma.unit.create({
    data: {
      id: crypto.randomUUID(),
      projectId,
      unitNumber: String(unitNumber).trim(),
      address: String(address).trim(),
      ownerName: ownerName ? String(ownerName).trim() : null,
      ownerEmail: ownerEmail ? String(ownerEmail).trim() : null,
      ownerPhone: ownerPhone ? String(ownerPhone).trim() : null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
