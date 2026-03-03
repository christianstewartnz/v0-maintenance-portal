import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const draftSchema = z.object({
  detectedUnitId: z
    .string()
    .nullable()
    .describe("The id of the unit this request is about, or null if unclear"),
  items: z
    .array(
      z.object({
        title: z.string().describe("Short actionable title for the work item"),
        description: z
          .string()
          .describe("Detailed description of the issue and what needs to be done"),
        trade: z.enum([
          "Plumbing",
          "Electrical",
          "Carpentry",
          "Painting",
          "Appliance",
          "General",
          "Other",
        ]),
        priority: z.enum(["Low", "Normal", "Urgent"]),
      })
    )
    .describe("One or more maintenance work items extracted from the request"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!maintenanceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const units = await prisma.unit.findMany({
    where: { projectId: maintenanceRequest.projectId },
    orderBy: { unitNumber: "asc" },
  });

  const unitList = units
    .map((u) => `- id: "${u.id}", unitNumber: "${u.unitNumber}", address: "${u.address}"`)
    .join("\n");

  const { object: draft } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: draftSchema,
    system: `You are a maintenance request analyzer for a property management system.
Given a maintenance request email, extract actionable work items and detect which unit the request is about.

Rules:
- Extract one or more distinct maintenance items from the request.
- Each item should have a clear, concise title and a detailed description.
- Assign the most appropriate trade and priority for each item.
- Use "Urgent" priority only for safety hazards, flooding, no heat/AC, or similar emergencies.
- If the email mentions a unit number or address that matches one from the provided list, set detectedUnitId to that unit's id.
- If no unit can be confidently matched, set detectedUnitId to null.
- Only use unit IDs from the provided list. Never fabricate a unit ID.`,
    prompt: `Maintenance request:
From: ${maintenanceRequest.fromName} <${maintenanceRequest.fromEmail}>
Subject: ${maintenanceRequest.subject}

Body:
${maintenanceRequest.bodyRaw}

Available units:
${unitList}`,
  });

  if (draft.detectedUnitId) {
    const validUnit = units.find((u) => u.id === draft.detectedUnitId);
    if (validUnit) {
      await prisma.maintenanceRequest.update({
        where: { id },
        data: { detectedUnitId: draft.detectedUnitId },
      });
    } else {
      draft.detectedUnitId = null;
    }
  }

  return NextResponse.json(draft);
}
