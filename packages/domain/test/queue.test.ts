import { describe, expect, test } from "bun:test";
import { DayQueue } from "../src/queue";

describe("DayQueue", () => {
  test("computes place and ahead", () => {
    const q = DayQueue.from([
      { id: "a", status: "scheduled", rank: 1, apptStart: "2026-01-01T08:00:00Z", createdAt: "1" },
      { id: "b", status: "scheduled", rank: 2, apptStart: "2026-01-01T09:00:00Z", createdAt: "2" },
      { id: "c", status: "scheduled", rank: 3, apptStart: "2026-01-01T10:00:00Z", createdAt: "3" },
    ]);
    expect(q.place("c")).toEqual({ position: 3, total: 3, ahead: 2 });
    expect(q.place("a")).toEqual({ position: 1, total: 3, ahead: 0 });
  });

  test("moveToFront puts started order at front of remaining", () => {
    const q = DayQueue.from([
      { id: "a", status: "scheduled", rank: 1, apptStart: "08:00", createdAt: "1" },
      { id: "b", status: "en_route", rank: 2, apptStart: "09:00", createdAt: "2" },
      { id: "c", status: "scheduled", rank: 3, apptStart: "10:00", createdAt: "3" },
    ]);
    const ranks = q.moveToFront("b");
    expect(ranks.get("b")).toBeLessThan(ranks.get("c")!);
  });
});
