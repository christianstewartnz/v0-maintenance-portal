import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }
    return NextResponse.json(contractor);
  } catch (error) {
    console.error("Failed to fetch contractor:", error);
    return NextResponse.json({ error: "Failed to fetch contractor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, contactName, email, phone, trade } = body;

    if (!name || !contactName || !email) {
      return NextResponse.json(
        { error: "name, contactName, and email are required" },
        { status: 400 },
      );
    }

    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        name,
        contactName,
        email,
        phone: phone || null,
        trade: trade || null,
      },
    });

    return NextResponse.json(contractor);
  } catch (error) {
    console.error("Failed to update contractor:", error);
    return NextResponse.json({ error: "Failed to update contractor" }, { status: 500 });
  }
}
