import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabaseServer";
import type { DashboardData, DashboardNeedsReviewRow } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id, archivedAt: null },
      select: { id: true, name: true },
    });
    const projectIds = projects.map((p) => p.id);
    const projectNameById = Object.fromEntries(
      projects.map((p) => [p.id, p.name] as const),
    );

    const requestsWhere = {
      status: "needs_review" as const,
      project: { userId: user.id },
    };

    const [
      requestsNeedingReview,
      needsReviewRaw,
      activeWorkOrders,
      openItems,
      openItemRows,
    ] = await Promise.all([
      prisma.maintenanceRequest.count({ where: requestsWhere }),
      prisma.maintenanceRequest.findMany({
        where: requestsWhere,
        orderBy: { receivedAt: "asc" },
        take: 5,
        select: {
          id: true,
          fromName: true,
          fromEmail: true,
          subject: true,
          receivedAt: true,
          project: { select: { name: true } },
        },
      }),
      projectIds.length === 0
        ? Promise.resolve(0)
        : prisma.workOrder.count({
            where: {
              status: { notIn: ["Draft", "Closed"] },
              projectId: { in: projectIds },
            },
          }),
      projectIds.length === 0
        ? Promise.resolve(0)
        : prisma.item.count({
            where: {
              status: { notIn: ["Completed", "Closed"] },
              projectId: { in: projectIds },
            },
          }),
      projectIds.length === 0
        ? Promise.resolve([])
        : prisma.item.findMany({
            where: {
              status: { notIn: ["Completed", "Closed"] },
              projectId: { in: projectIds },
            },
            select: { projectId: true, status: true },
          }),
    ]);

    const needsReviewRows: DashboardNeedsReviewRow[] = needsReviewRaw.map(
      (r) => ({
        id: r.id,
        projectName: r.project?.name ?? null,
        fromName: r.fromName,
        fromEmail: r.fromEmail,
        subject: r.subject,
        receivedAt: r.receivedAt.toISOString(),
      }),
    );

    const byProject = new Map<
      string,
      { openTotal: number; newCount: number; inProgressCount: number }
    >();
    for (const row of openItemRows) {
      const cur = byProject.get(row.projectId) ?? {
        openTotal: 0,
        newCount: 0,
        inProgressCount: 0,
      };
      cur.openTotal += 1;
      if (row.status === "New") cur.newCount += 1;
      if (row.status === "InProgress") cur.inProgressCount += 1;
      byProject.set(row.projectId, cur);
    }

    const openItemsByProject = [...byProject.entries()]
      .map(([projectId, counts]) => ({
        projectId,
        projectName: projectNameById[projectId] ?? "Unknown",
        openTotal: counts.openTotal,
        newCount: counts.newCount,
        inProgressCount: counts.inProgressCount,
      }))
      .sort((a, b) => b.openTotal - a.openTotal);

    const payload: DashboardData = {
      stats: {
        requestsNeedingReview,
        activeWorkOrders,
        openItems,
      },
      needsReview: {
        total: requestsNeedingReview,
        rows: needsReviewRows,
      },
      openItemsByProject,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
