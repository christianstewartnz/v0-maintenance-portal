import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const requests = await prisma.maintenanceRequest.findMany({
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json(requests);
}
