import { haversineMeters, type LatLng } from "./geo";

export type EtaBasis = "schedule" | "queue" | "live";
export type Eta = {
  at: string;
  earliest: string | null;
  latest: string | null;
  basis: EtaBasis;
  updatedAt: string;
};

export type EtaConfig = {
  dayStart: string; // HH:mm
  avgSpeedKmh: number;
  roadFactor: number;
  defaultTravelMin: number;
};

export type QueueStop = {
  status: string;
  durationMin: number;
  apptStart?: string | null;
  apptEnd?: string | null;
  apptKind: "exact" | "window";
  location?: LatLng | null;
};

function round5(min: number): number {
  return Math.round(min / 5) * 5;
}

function addMinutes(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60000).toISOString();
}

function clampToWindow(atIso: string, start?: string | null, end?: string | null): string {
  let t = new Date(atIso).getTime();
  if (start) t = Math.max(t, new Date(start).getTime());
  if (end) t = Math.min(t, new Date(end).getTime());
  return new Date(t).toISOString();
}

function travelMinutes(a?: LatLng | null, b?: LatLng | null, cfg?: EtaConfig): number {
  const c = cfg ?? { dayStart: "08:00", avgSpeedKmh: 30, roadFactor: 1.4, defaultTravelMin: 25 };
  if (!a || !b) return c.defaultTravelMin;
  const meters = haversineMeters(a, b) * c.roadFactor;
  const hours = meters / 1000 / c.avgSpeedKmh;
  return Math.max(5, Math.round(hours * 60));
}

export function estimateSchedule(
  ahead: QueueStop[],
  target: QueueStop,
  nowIso: string,
  cfg: EtaConfig,
): Eta {
  const base = target.apptKind === "exact" && target.apptStart ? target.apptStart : target.apptStart ?? nowIso;
  let cursor = base;
  for (const s of ahead) {
    cursor = addMinutes(cursor, s.durationMin + travelMinutes(s.location, undefined, cfg));
  }
  let at = cursor;
  if (target.apptKind === "window") at = clampToWindow(at, target.apptStart, target.apptEnd);
  const rem = Math.max(10, (new Date(at).getTime() - new Date(nowIso).getTime()) / 60000);
  const spread = round5(rem * 0.2);
  return {
    at,
    earliest: addMinutes(at, -spread),
    latest: addMinutes(at, spread),
    basis: "schedule",
    updatedAt: nowIso,
  };
}

export function estimateLive(
  distanceMeters: number,
  nowIso: string,
  cfg: EtaConfig,
): Eta {
  const minutes = (distanceMeters / 1000 / cfg.avgSpeedKmh) * cfg.roadFactor * 60;
  const at = addMinutes(nowIso, Math.max(2, Math.round(minutes)));
  const spread = Math.max(5, round5(minutes * 0.2));
  return {
    at,
    earliest: addMinutes(at, -spread),
    latest: addMinutes(at, spread),
    basis: "live",
    updatedAt: nowIso,
  };
}

export function estimateQueue(
  ahead: QueueStop[],
  nowIso: string,
  cfg: EtaConfig,
  activeFinishIso?: string | null,
): Eta {
  let cursor = activeFinishIso ?? nowIso;
  for (const s of ahead) {
    cursor = addMinutes(cursor, s.durationMin + cfg.defaultTravelMin);
  }
  const rem = Math.max(10, (new Date(cursor).getTime() - new Date(nowIso).getTime()) / 60000);
  const spread = round5(rem * 0.2);
  return {
    at: cursor,
    earliest: addMinutes(cursor, -spread),
    latest: addMinutes(cursor, spread),
    basis: "queue",
    updatedAt: nowIso,
  };
}
