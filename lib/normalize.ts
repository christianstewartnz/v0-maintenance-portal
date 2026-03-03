const ITEM_STATUS_MAP: Record<string, string> = {
  InProgress: "In Progress",
};

export function normalizeItems<T extends { status: string }>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    status: ITEM_STATUS_MAP[item.status] ?? item.status,
  }));
}
