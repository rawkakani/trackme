export type QueueOrderStatus =
  | "scheduled"
  | "en_route"
  | "on_site"
  | "completed"
  | "unable"
  | "cancelled";

export interface QueueItem {
  id: string;
  status: QueueOrderStatus;
  rank: number;
  apptStart?: string | null;
  createdAt: string;
  finishedAt?: string | null;
}

export type QueueOrdering = "ByAppointment";

function compareScheduled(a: QueueItem, b: QueueItem): number {
  const as = a.apptStart ?? "";
  const bs = b.apptStart ?? "";
  if (as !== bs) return as < bs ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export class DayQueue {
  constructor(private items: QueueItem[]) {}

  static from(items: QueueItem[]): DayQueue {
    return new DayQueue([...items]);
  }

  list(): QueueItem[] {
    const active = this.items.filter((i) => !["cancelled"].includes(i.status));
    const finished = active
      .filter((i) => i.status === "completed" || i.status === "unable")
      .sort((a, b) => {
        const fa = a.finishedAt ?? a.createdAt;
        const fb = b.finishedAt ?? b.createdAt;
        return fa < fb ? -1 : fa > fb ? 1 : a.id.localeCompare(b.id);
      });
    const inProgress = active.filter((i) => i.status === "en_route" || i.status === "on_site");
    const scheduled = active
      .filter((i) => i.status === "scheduled")
      .sort((a, b) => a.rank - b.rank || compareScheduled(a, b));
    return [...finished, ...inProgress, ...scheduled];
  }

  place(id: string): { position: number; total: number; ahead: number } | null {
    const list = this.list();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const ahead = list
      .slice(0, idx)
      .filter((i) => i.status === "scheduled" || i.status === "en_route" || i.status === "on_site").length;
    return { position: idx + 1, total: list.length, ahead };
  }

  insert(item: QueueItem): Map<string, number> {
    const list = this.list().filter((i) => i.status === "scheduled");
    const scheduled = [...list, { ...item, status: "scheduled" as const }].sort(compareScheduled);
    const ranks = new Map<string, number>();
    scheduled.forEach((it, i) => ranks.set(it.id, i + 1));
    // keep existing ranks for non-scheduled in this map? callers handle full day rewrite for scheduled set; easier return scheduled ranks
    return ranks;
  }

  ranks(): Map<string, number> {
    const list = this.list();
    const ranks = new Map<string, number>();
    list.forEach((it, i) => ranks.set(it.id, i + 1));
    return ranks;
  }

  moveToFront(id: string): Map<string, number> {
    const list = this.list();
    const item = list.find((i) => i.id === id);
    if (!item) return this.ranks();
    const others = list.filter((i) => i.id !== id);
    const inProgressIdx = others.findIndex((i) => i.status === "en_route" || i.status === "on_site");
    // if another is active, place after it; else place before scheduled
    const finishedCount = others.filter((i) => i.status === "completed" || i.status === "unable").length;
    let insertAt = finishedCount;
    if (inProgressIdx !== -1) insertAt = inProgressIdx + 1;
    others.splice(insertAt, 0, item);
    const ranks = new Map<string, number>();
    others.forEach((it, i) => ranks.set(it.id, i + 1));
    return ranks;
  }
}
