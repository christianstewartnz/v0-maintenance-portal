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

    const activeOnly = req.nextUrl.searchParams.get("activeOnly") !== "false";

    const contractors = await prisma.contractor.findMany({
      where: {
        userId: user.id,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contractors);
  } catch (error) {
    console.error("Failed to fetch contractors:", error);
    return NextResponse.json({ error: "Failed to fetch contractors" }, { status: 500 });
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
    const { name, contactName, email, phone, trade } = body;

    if (!name || !contactName || !email) {
      return NextResponse.json(
        { error: "name, contactName, and email are required" },
        { status: 400 }
      );
    }

    const contractor = await prisma.contractor.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        name,
        contactName,
        email,
        phone: phone || null,
        trade: trade || null,
      },
    });

    return NextResponse.json(contractor, { status: 201 });
  } catch (error) {
    console.error("Failed to create contractor:", error);
    return NextResponse.json({ error: "Failed to create contractor" }, { status: 500 });
  }
}
