import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

    const projects = await prisma.project.findMany({
      where: includeArchived ? {} : { archivedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, description } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 },
    );
  }

  const created = await prisma.project.create({
    data: {
      id: crypto.randomUUID(),
      name: name.trim(),
      address: typeof address === "string" ? address.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
