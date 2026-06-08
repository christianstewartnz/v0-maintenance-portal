const ITEM_STATUS_MAP: Record<string, string> = {
  InProgress: "In Progress",
  MarkedCompleteNeedsReview: "Marked Complete - Needs Review",
  Completed: "Completed",
};

export function normalizeItems<T extends { status: string }>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    status: ITEM_STATUS_MAP[item.status] ?? item.status,
  }));
}

const WORK_ORDER_STATUS_MAP: Record<string, string> = {
  InProgress: "In Progress",
};

export function normalizeWorkOrder<T extends { status: string }>(workOrder: T): T {
  return {
    ...workOrder,
    status: WORK_ORDER_STATUS_MAP[workOrder.status] ?? workOrder.status,
  };
}

export function normalizeWorkOrders<T extends { status: string }>(workOrders: T[]): T[] {
  return workOrders.map(normalizeWorkOrder);
}
