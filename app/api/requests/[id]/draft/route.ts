import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const draftSchema = z.object({
  detectedProjectId: z
    .string()
    .nullable()
    .describe(
      "The id of the project this request belongs to, or null if unclear"
    ),
  detectedUnitId: z
    .string()
    .nullable()
    .describe(
      "The id of the unit this request is about, or null if unclear"
    ),
  items: z
    .array(
      z.object({
        title: z.string().describe("Short actionable title for the work item"),
        description: z
          .string()
          .describe(
            "Detailed description of the issue and what needs to be done"
          ),
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

  const [projects, units] = await Promise.all([
    prisma.project.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: { archivedAt: null },
      include: { project: { select: { name: true } } },
      orderBy: { unitNumber: "asc" },
    }),
  ]);

  const projectList = projects
    .map((p) => `- id: "${p.id}", name: "${p.name}", description: "${p.description}"`)
    .join("\n");

  const unitList = units
    .map(
      (u) =>
        `- id: "${u.id}", projectId: "${u.projectId}", projectName: "${u.project.name}", unitNumber: "${u.unitNumber}", address: "${u.address}"`
    )
    .join("\n");

  const { object: draft } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: draftSchema,
    system: `You are a maintenance request analyzer for a property management system.
Given a maintenance request email, extract actionable work items and detect which project and unit the request is about.

Rules:
- Extract one or more distinct maintenance items from the request.
- Each item should have a clear, concise title and a detailed description.
- Assign the most appropriate trade and priority for each item.
- Use "Urgent" priority only for safety hazards, flooding, no heat/AC, or similar emergencies.
- If the email mentions a project name, building name, or property name that matches one from the provided list, set detectedProjectId to that project's id.
- If the email mentions a unit number or address that matches one from the provided list, set detectedUnitId to that unit's id. When a unit is detected, also set detectedProjectId to the unit's projectId.
- If no project can be confidently matched, set detectedProjectId to null.
- If no unit can be confidently matched, set detectedUnitId to null.
- Only use IDs from the provided lists. Never fabricate an ID.`,
    prompt: `Maintenance request:
From: ${maintenanceRequest.fromName} <${maintenanceRequest.fromEmail}>
Subject: ${maintenanceRequest.subject}

Body:
${maintenanceRequest.bodyRaw}

Available projects:
${projectList}

Available units:
${unitList}`,
  });

  const updateData: { detectedUnitId?: string; projectId?: string } = {};

  if (draft.detectedUnitId) {
    const validUnit = units.find((u) => u.id === draft.detectedUnitId);
    if (validUnit) {
      updateData.detectedUnitId = draft.detectedUnitId;
      updateData.projectId = validUnit.projectId;
      draft.detectedProjectId = validUnit.projectId;
    } else {
      draft.detectedUnitId = null;
    }
  }

  if (draft.detectedProjectId && !updateData.projectId) {
    const validProject = projects.find((p) => p.id === draft.detectedProjectId);
    if (validProject) {
      updateData.projectId = draft.detectedProjectId;
    } else {
      draft.detectedProjectId = null;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
    });
  }

  return NextResponse.json(draft);
}
