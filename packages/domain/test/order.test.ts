import { describe, expect, test } from "bun:test";
import { allowedActions, nextStatus } from "../src/order";

describe("order state machine", () => {
  test("scheduled can start or cancel", () => {
    expect(allowedActions("scheduled").sort()).toEqual(["cancel", "start"]);
    expect(nextStatus("scheduled", "start")).toEqual({ ok: true, value: "en_route" });
  });

  test("invalid transition", () => {
    const r = nextStatus("completed", "start");
    expect(r.ok).toBe(false);
  });

  test("en_route arrive/on_site complete flow", () => {
    expect(nextStatus("en_route", "arrive")).toEqual({ ok: true, value: "on_site" });
    expect(nextStatus("on_site", "complete")).toEqual({ ok: true, value: "completed" });
  });

  test("unable needs path from en_route/on_site", () => {
    expect(nextStatus("en_route", "unable").ok).toBe(true);
    expect(nextStatus("on_site", "unable").ok).toBe(true);
    expect(nextStatus("scheduled", "unable").ok).toBe(false);
  });
});
