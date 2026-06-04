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

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        userId: user.id,
        name: name.trim(),
        address: typeof address === "string" ? address.trim() : "",
        description: typeof description === "string" ? description.trim() : "",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
