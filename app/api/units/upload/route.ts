import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CsvRow {
  project: string;
  unitNumber: string;
  address: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

function parseCsv(
  text: string,
  fallbackProjectName?: string,
): { rows: CsvRow[]; errors: { row: number; message: string }[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 0, message: "CSV must have a header row and at least one data row" }],
    };
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const projectIdx = header.indexOf("project");
  const unitNumberIdx = header.indexOf("unitnumber");
  const addressIdx = header.indexOf("address");
  const ownerNameIdx = header.indexOf("ownername");
  const ownerEmailIdx = header.indexOf("owneremail");
  const ownerPhoneIdx = header.indexOf("ownerphone");

  const hasProjectColumn = projectIdx !== -1;

  if (unitNumberIdx === -1 || addressIdx === -1) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'CSV header must include "unitNumber" and "address" columns' }],
    };
  }

  if (!hasProjectColumn && !fallbackProjectName) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message:
            'CSV header must include a "project" column, or upload must be scoped to a project',
        },
      ],
    };
  }

  const rows: CsvRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const project = hasProjectColumn ? (cols[projectIdx] ?? "") : fallbackProjectName!;
    const unitNumber = cols[unitNumberIdx] ?? "";
    const address = cols[addressIdx] ?? "";

    if (!unitNumber) {
      errors.push({ row: i + 1, message: "Unit Number is required" });
      continue;
    }

    if (!address) {
      errors.push({ row: i + 1, message: "Address is required" });
      continue;
    }

    if (hasProjectColumn && !project) {
      errors.push({ row: i + 1, message: "Project is required" });
      continue;
    }

    const ownerName = ownerNameIdx !== -1 ? (cols[ownerNameIdx] ?? "").trim() : undefined;
    const ownerEmail = ownerEmailIdx !== -1 ? (cols[ownerEmailIdx] ?? "").trim() : undefined;
    const ownerPhone = ownerPhoneIdx !== -1 ? (cols[ownerPhoneIdx] ?? "").trim() : undefined;

    rows.push({
      project,
      unitNumber,
      address,
      ownerName: ownerName || undefined,
      ownerEmail: ownerEmail || undefined,
      ownerPhone: ownerPhone || undefined,
    });
  }

  return { rows, errors };
}

export async function POST(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  let fallbackProjectName: string | undefined;

  if (projectId) {
    const scopedProject = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!scopedProject || scopedProject.archivedAt) {
      return NextResponse.json(
        { error: "The specified project does not exist or is archived" },
        { status: 400 },
      );
    }
    fallbackProjectName = scopedProject.name;
  }

  const text = await file.text();
  const { rows, errors } = parseCsv(text, fallbackProjectName);

  if (rows.length === 0 && errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV validation failed. No units were imported.",
        rows: errors,
      },
      { status: 400 },
    );
  }

  const uniqueProjectNames = [...new Set(rows.map((r) => r.project))];
  const projects = await prisma.project.findMany({
    where: {
      name: { in: uniqueProjectNames, mode: "insensitive" },
      archivedAt: null,
    },
  });
  const projectMap = new Map(projects.map((p) => [p.name.toLowerCase(), p.id]));

  const csvDupTracker = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const csvRow = i + 2;

    const resolvedProjectId = projectMap.get(row.project.toLowerCase());
    if (!resolvedProjectId) {
      errors.push({
        row: csvRow,
        message: `Project "${row.project}" does not match an existing project`,
      });
      continue;
    }

    const dupKey = `${resolvedProjectId}::${row.unitNumber.toLowerCase()}`;
    const previousRow = csvDupTracker.get(dupKey);
    if (previousRow !== undefined) {
      errors.push({
        row: csvRow,
        message: `Unit Number "${row.unitNumber}" is duplicated in CSV (first seen at row ${previousRow})`,
      });
      continue;
    }
    csvDupTracker.set(dupKey, csvRow);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV validation failed. No units were imported.",
        rows: errors,
      },
      { status: 400 },
    );
  }

  const resolvedRows = rows.map((row) => ({
    projectId: projectMap.get(row.project.toLowerCase())!,
    unitNumber: row.unitNumber.trim(),
    address: row.address.trim(),
    ownerName: row.ownerName ?? null,
    ownerEmail: row.ownerEmail ?? null,
    ownerPhone: row.ownerPhone ?? null,
  }));

  const existingUnits = await prisma.unit.findMany({
    where: {
      projectId: { in: [...new Set(resolvedRows.map((r) => r.projectId))] },
    },
    select: { projectId: true, unitNumber: true },
  });

  const existingSet = new Set(
    existingUnits.map((u) => `${u.projectId}::${u.unitNumber.toLowerCase()}`),
  );

  for (let i = 0; i < resolvedRows.length; i++) {
    const row = resolvedRows[i];
    const key = `${row.projectId}::${row.unitNumber.toLowerCase()}`;
    if (existingSet.has(key)) {
      errors.push({
        row: i + 2,
        message: `Unit Number "${row.unitNumber}" already exists for this project`,
      });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV validation failed. No units were imported.",
        rows: errors,
      },
      { status: 400 },
    );
  }

  const created = await prisma.unit.createMany({
    data: resolvedRows.map((row) => ({
      id: crypto.randomUUID(),
      projectId: row.projectId,
      unitNumber: row.unitNumber,
      address: row.address,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      ownerPhone: row.ownerPhone,
    })),
  });

  return NextResponse.json({ created: created.count }, { status: 201 });
}
