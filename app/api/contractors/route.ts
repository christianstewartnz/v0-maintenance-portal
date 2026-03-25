import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("activeOnly") !== "false";

    const contractors = await prisma.contractor.findMany({
      where: activeOnly ? { isActive: true } : undefined,
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
