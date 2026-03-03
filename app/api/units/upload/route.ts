import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CsvRow {
  project: string;
  unitNumber: string;
  address: string;
}

function parseCsv(text: string): { rows: CsvRow[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must have a header row and at least one data row"] };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const projectIdx = header.indexOf("project");
  const unitNumberIdx = header.indexOf("unitnumber");
  const addressIdx = header.indexOf("address");

  if (projectIdx === -1 || unitNumberIdx === -1 || addressIdx === -1) {
    return {
      rows: [],
      errors: ['CSV header must include "project", "unitNumber", and "address" columns'],
    };
  }

  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const project = cols[projectIdx] ?? "";
    const unitNumber = cols[unitNumberIdx] ?? "";
    const address = cols[addressIdx] ?? "";

    if (!project || !unitNumber || !address) {
      errors.push(`Row ${i + 1}: missing project, unitNumber, or address`);
      continue;
    }

    rows.push({ project, unitNumber, address });
  }

  return { rows, errors };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors } = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found", details: errors },
      { status: 400 },
    );
  }

  const uniqueProjectNames = [...new Set(rows.map((r) => r.project))];
  const projects = await prisma.project.findMany({
    where: { name: { in: uniqueProjectNames } },
  });
  const projectMap = new Map(projects.map((p) => [p.name.toLowerCase(), p.id]));

  const validRows: { projectId: string; unitNumber: string; address: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const projectId = projectMap.get(row.project.toLowerCase());
    if (!projectId) {
      errors.push(`Row ${i + 2}: project "${row.project}" not found`);
      continue;
    }
    validRows.push({ projectId, unitNumber: row.unitNumber, address: row.address });
  }

  if (validRows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows after resolving projects", details: errors },
      { status: 400 },
    );
  }

  const created = await prisma.unit.createMany({
    data: validRows.map((row) => ({
      id: crypto.randomUUID(),
      projectId: row.projectId,
      unitNumber: row.unitNumber,
      address: row.address,
    })),
  });

  return NextResponse.json(
    {
      created: created.count,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: 201 },
  );
}
