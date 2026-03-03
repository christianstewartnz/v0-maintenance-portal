import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeItems } from "@/lib/normalize";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(normalizeItems(items));
}
