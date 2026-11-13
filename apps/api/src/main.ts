import { Database } from "bun:sqlite";
import { createHash } from "crypto";
import {
  DayQueue,
  allowedActions,
  directionsUrl,
  estimateLive,
  estimateQueue,
  estimateSchedule,
  firstName,
  hashToken,
  haversineMeters,
  isActive,
  isFinished,
  newApiKey,
  newApiKeyId,
  newCustomerId,
  newEventId,
  newOrderId,
  newTechnicianId,
  newToken,
  nextStatus,
  normalizeEmail,
  normalizePhone,
  type DomainEvent,
} from "@sd/domain";
import {
  CreateOrderRequest,
  LocationPing,
  TaskAction,
  UpdateOrderRequest,
} from "@sd/contracts";
import { loadConfig } from "./config";
import { openDb } from "./db/migrate";
import { EventBus } from "./realtime/event-bus";
import { domainToProblem, problem } from "./http/problem";

const cfg = loadConfig();
const db = openDb(cfg.SD_DB);
const bus = new EventBus();

type SSEClient = { controller: ReadableStreamDefaultController; topic: string };
const sseClients = new Map<string, Set<SSEClient>>();

function nowIso() {
  return new Date().toISOString();
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers });
}

function sendSse(topic: string, event: string, data: unknown) {
  const set = sseClients.get(topic);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of set) {
    try {
      c.controller.enqueue(payload);
    } catch {}
  }
}

function sseResponse(topic: string, initialEvent: string, initialData: unknown): Response {
  let client: SSEClient;
  const stream = new ReadableStream({
    start(controller) {
      client = { controller, topic };
      if (!sseClients.has(topic)) sseClients.set(topic, new Set());
      sseClients.get(topic)!.add(client);
      controller.enqueue(`event: ${initialEvent}\ndata: ${JSON.stringify(initialData)}\n\n`);
      const hb = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {}
      }, 25000);
      (client as any)._hb = hb;
    },
    cancel() {
      const set = sseClients.get(topic);
      if (set) {
        set.delete(client);
        if (set.size === 0) sseClients.delete(topic);
      }
      clearInterval((client as any)._hb);
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function getApiKey(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const key = auth.slice(7).trim();
  const hash = sha256(key);
  return db.query("SELECT * FROM api_keys WHERE key_hash=? AND revoked_at IS NULL").get(hash) as any;
}

function logEvent(orderId: string, type: DomainEvent["type"], actor: DomainEvent["actor"], data: Record<string, unknown>) {
  const e: DomainEvent = { id: newEventId(), orderId, type, actor, data, at: nowIso() };
  db.query("INSERT INTO order_events (id,order_id,type,actor,data_json,at) VALUES (?,?,?,?,?,?)").run(
    e.id,
    e.orderId,
    e.type,
    e.actor,
    JSON.stringify(e.data),
    e.at,
  );
  return e;
}

function upsertCustomer(input: { name?: string; email?: string; phone?: string }) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone, cfg.SD_DEFAULT_COUNTRY);
  let row: any = null;
  if (email) row = db.query("SELECT * FROM customers WHERE email=?").get(email);
  if (!row && phone) row = db.query("SELECT * FROM customers WHERE phone=?").get(phone);
  if (row) {
    // fill missing only
    const name = row.name || input.name || null;
    const nemail = row.email || email;
    const nphone = row.phone || phone;
    db.query("UPDATE customers SET name=?, email=?, phone=? WHERE id=?").run(name, nemail, nphone, row.id);
    return db.query("SELECT * FROM customers WHERE id=?").get(row.id) as any;
  }
  const id = newCustomerId();
  db.query("INSERT INTO customers (id,email,phone,name,created_at) VALUES (?,?,?,?,?)").run(
    id,
    email,
    phone,
    input.name ?? null,
    nowIso(),
  );
  return db.query("SELECT * FROM customers WHERE id=?").get(id) as any;
}

async function upsertTechnician(input: { name?: string; email?: string; phone?: string }) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone, cfg.SD_DEFAULT_COUNTRY);
  let row: any = null;
  if (email) row = db.query("SELECT * FROM technicians WHERE email=?").get(email);
  if (!row && phone) row = db.query("SELECT * FROM technicians WHERE phone=?").get(phone);
  if (row) {
    const name = row.name || input.name || null;
    const nemail = row.email || email;
    const nphone = row.phone || phone;
    db.query("UPDATE technicians SET name=?, email=?, phone=? WHERE id=?").run(name, nemail, nphone, row.id);
    return { tech: db.query("SELECT * FROM technicians WHERE id=?").get(row.id) as any, token: null as string | null };
  }
  const id = newTechnicianId();
  const token = newToken();
  const tokenHash = await hashToken(token);
  db.query("INSERT INTO technicians (id,email,phone,name,token_hash,token_plain,created_at) VALUES (?,?,?,?,?,?,?)").run(
    id,
    email,
    phone,
    input.name ?? null,
    tokenHash,
    token,
    nowIso(),
  );
  return { tech: db.query("SELECT * FROM technicians WHERE id=?").get(id) as any, token };
}

function ordersForDay(technicianId: string, apptDate: string) {
  return db
    .query("SELECT * FROM orders WHERE technician_id=? AND appt_date=?")
    .all(technicianId, apptDate) as any[];
}

function queueForDay(technicianId: string, apptDate: string) {
  const rows = ordersForDay(technicianId, apptDate).map((r) => ({
    id: r.id,
    status: r.status,
    rank: r.rank,
    apptStart: r.appt_start,
    createdAt: r.created_at,
    finishedAt: r.finished_at,
  }));
  return DayQueue.from(rows as any);
}

function placeFor(order: any) {
  const q = queueForDay(order.technician_id, order.appt_date);
  return q.place(order.id) ?? { position: 1, total: 1, ahead: 0 };
}

function getTechPos(technicianId: string) {
  return db.query("SELECT * FROM technician_pos WHERE technician_id=?").get(technicianId) as any;
}

function computeEta(order: any): any | null {
  const techPos = getTechPos(order.technician_id);
  const q = queueForDay(order.technician_id, order.appt_date);
  const list = q.list();
  const place = q.place(order.id);
  if (!place) return null;
  const ahead = list.slice(0, place.position - 1).filter((i) => i.status === "scheduled") as any[];
  const aheadStops = ahead.map((i) => {
    const r = db.query("SELECT * FROM orders WHERE id=?").get(i.id) as any;
    return {
      status: r.status,
      durationMin: r.duration_min,
      apptStart: r.appt_start,
      apptEnd: r.appt_end,
      apptKind: r.appt_kind,
      location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null,
    };
  });
  const etaCfg = {
    dayStart: cfg.SD_DAY_START,
    avgSpeedKmh: cfg.SD_AVG_SPEED_KMH,
    roadFactor: cfg.SD_ROAD_FACTOR,
    defaultTravelMin: cfg.SD_DEFAULT_TRAVEL_MIN,
  };
  const now = nowIso();
  const target = {
    status: order.status,
    durationMin: order.duration_min,
    apptStart: order.appt_start,
    apptEnd: order.appt_end,
    apptKind: order.appt_kind,
    location: order.lat != null && order.lng != null ? { lat: order.lat, lng: order.lng } : null,
  };
  if (order.status === "en_route" && techPos && order.lat != null && order.lng != null) {
    const ts = new Date(techPos.at).getTime();
    if (Date.now() - ts < 5 * 60 * 1000) {
      const dist = haversineMeters({ lat: techPos.lat, lng: techPos.lng }, { lat: order.lat, lng: order.lng });
      return estimateLive(dist, now, etaCfg);
    }
  }
  const dayStarted = list.some((i) => isActive(i.status as any) || i.status === "completed" || i.status === "unable");
  if (!dayStarted) return estimateSchedule(aheadStops, target, now, etaCfg);
  const active = list.find((i) => isActive(i.status as any)) as any;
  let activeFinish: string | null = null;
  if (active) activeFinish = addMins(now, (db.query("SELECT duration_min FROM orders WHERE id=?").get(active.id) as any).duration_min);
  return estimateQueue(aheadStops, now, etaCfg, activeFinish);
}

function addMins(iso: string, m: number) {
  return new Date(new Date(iso).getTime() + m * 60000).toISOString();
}

function toOrderView(row: any) {
  const customer = db.query("SELECT * FROM customers WHERE id=?").get(row.customer_id) as any;
  const tech = db.query("SELECT * FROM technicians WHERE id=?").get(row.technician_id) as any;
  const address = JSON.parse(row.address_json);
  const queue = placeFor(row);
  return {
    id: row.id,
    externalRef: row.external_ref ?? null,
    status: row.status,
    customer: { id: customer.id, name: customer.name ?? null, email: customer.email ?? null, phone: customer.phone ?? null },
    address,
    technician: { id: tech.id, name: tech.name ?? null, email: tech.email ?? null, phone: tech.phone ?? null },
    manager: row.manager_json ? JSON.parse(row.manager_json) : null,
    provider: row.provider_json ? JSON.parse(row.provider_json) : null,
    appointment: { date: row.appt_date, kind: row.appt_kind, start: row.appt_start, end: row.appt_end },
    durationMinutes: row.duration_min,
    service: row.service ?? null,
    notes: row.notes ?? null,
    queue,
    eta: computeEta(row),
    trackingUrl: `${cfg.SD_PUBLIC_URL}/t/${row.tracking_token}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrackingView(row: any) {
  const tech = db.query("SELECT * FROM technicians WHERE id=?").get(row.technician_id) as any;
  const queue = placeFor(row);
  const eta = computeEta(row);
  const techPos = getTechPos(row.technician_id);
  let distanceMeters: number | null = null;
  let locationUpdatedAt: string | null = null;
  if (row.status === "en_route" && techPos && row.lat != null && row.lng != null) {
    distanceMeters = Math.round(haversineMeters({ lat: techPos.lat, lng: techPos.lng }, { lat: row.lat, lng: row.lng }));
    locationUpdatedAt = techPos.at;
  }
  const state =
    row.status === "scheduled" ? "waiting" :
    row.status === "en_route" ? "your_turn" :
    row.status === "on_site" ? "on_site" :
    row.status === "completed" ? "done" :
    row.status === "unable" ? "unable" : "cancelled";
  const apiKey = db.query("SELECT * FROM api_keys WHERE id=?").get(row.api_key_id) as any;
  const contact =
    state === "your_turn" || state === "on_site"
      ? { phone: tech.phone ?? null, email: tech.email ?? null }
      : { phone: apiKey?.support_phone ?? null, email: apiKey?.support_email ?? null };
  return {
    orderId: row.id,
    status: row.status,
    state,
    service: row.service ?? null,
    appointment: { date: row.appt_date, kind: row.appt_kind, start: row.appt_start, end: row.appt_end },
    queue,
    eta,
    technician: { name: firstName(tech.name), distanceMeters, locationUpdatedAt },
    message: row.message ?? null,
    contact,
    updatedAt: row.updated_at,
  };
}

function toTaskSummary(row: any) {
  const customer = db.query("SELECT * FROM customers WHERE id=?").get(row.customer_id) as any;
  const address = JSON.parse(row.address_json);
  const q = placeFor(row);
  return {
    orderId: row.id,
    position: q.position,
    status: row.status,
    customerName: customer.name ?? null,
    addressLine: [address.line1, address.city].filter(Boolean).join(", "),
    service: row.service ?? null,
    appointment: { date: row.appt_date, kind: row.appt_kind, start: row.appt_start, end: row.appt_end },
    durationMinutes: row.duration_min,
    eta: computeEta(row),
  };
}

function toTask(row: any) {
  const customer = db.query("SELECT * FROM customers WHERE id=?").get(row.customer_id) as any;
  const address = JSON.parse(row.address_json);
  const base = toTaskSummary(row);
  const loc = row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : null;
  return {
    ...base,
    customer: { id: customer.id, name: customer.name ?? null, email: customer.email ?? null, phone: customer.phone ?? null },
    address,
    notes: row.notes ?? null,
    directionsUrl: directionsUrl(base.addressLine, loc),
    allowedActions: allowedActions(row.status).filter((a) => a !== "cancel"),
  };
}

function publishOrder(orderId: string) {
  const row = db.query("SELECT * FROM orders WHERE id=?").get(orderId) as any;
  if (!row) return;
  sendSse(`order:${orderId}`, "tracking", toTrackingView(row));
  sendSse(`tech:${row.technician_id}:${row.appt_date}`, "day", getTechnicianDayView(row.technician_id, row.appt_date));
}

function rewriteRanks(technicianId: string, apptDate: string) {
  const q = queueForDay(technicianId, apptDate);
  const list = q.list();
  const tx = db.transaction(() => {
    list.forEach((it, i) => db.query("UPDATE orders SET rank=? WHERE id=?").run(i + 1, it.id));
  });
  tx();
  // emit queue moved for affected
  for (const it of list) {
    const ev = logEvent(it.id, "order.queue_moved", "system", { position: list.findIndex(x=>x.id===it.id)+1 });
  }
}

function getTechnicianDayView(technicianId: string, date: string) {
  const tech = db.query("SELECT * FROM technicians WHERE id=?").get(technicianId) as any;
  const q = queueForDay(technicianId, date);
  const list = q.list();
  const tasks = list.map((it) => toTaskSummary(db.query("SELECT * FROM orders WHERE id=?").get(it.id)));
  const done = list.filter((i) => i.status === "completed" || i.status === "unable").length;
  const active = list.find((i) => i.status === "en_route" || i.status === "on_site") as any;
  return {
    technician: { id: tech.id, name: tech.name ?? null, email: tech.email ?? null, phone: tech.phone ?? null },
    date,
    activeOrderId: active?.id ?? null,
    counts: { total: list.length, done, remaining: list.length - done },
    tasks,
  };
}

async function handleCreateOrder(req: Request): Promise<Response> {
  const apiKey = getApiKey(req);
  if (!apiKey) return problem(401, "Unauthorized");
  const idem = req.headers.get("idempotency-key");
  const bodyText = await req.text();
  let bodyJson: any;
  try { bodyJson = JSON.parse(bodyText); } catch { return problem(400, "Bad request", "Invalid JSON"); }
  const parsed = CreateOrderRequest.safeParse(bodyJson);
  if (!parsed.success) {
    return problem(422, "Unprocessable Entity", undefined, parsed.error.issues.map(i=>({path:i.path.join("."), message:i.message})));
  }
  const input = parsed.data;
  const reqHash = sha256(JSON.stringify(input));
  if (idem) {
    const existing = db.query("SELECT * FROM idempotency WHERE api_key_id=? AND key=?").get(apiKey.id, idem) as any;
    if (existing) {
      if (existing.request_hash !== reqHash) return problem(409, "Conflict", "Idempotency-Key reused with a different body");
      return new Response(existing.response_json, { status: existing.status_code, headers: { "content-type": "application/json" } });
    }
  }

  const customer = upsertCustomer(input.customer);
  const { tech, token: techToken } = await upsertTechnician(input.handledBy);
  const trackingToken = newToken();
  const trackingHash = await hashToken(trackingToken);
  const orderId = newOrderId();
  const appt = input.appointment;
  const address = input.address;
  const loc = address.location ?? null;
  const createdAt = nowIso();

  // compute rank for insertion by appointment among scheduled
  const dayOrders = ordersForDay(tech.id, appt.date).filter((o) => o.status !== "cancelled");
  const q = queueForDay(tech.id, appt.date);
  const tempItem = {
    id: orderId,
    status: "scheduled" as const,
    rank: 9999,
    apptStart: appt.start ?? null,
    createdAt,
    finishedAt: null,
  };
  const newRanks = q.insert(tempItem as any);
  const rank = newRanks.get(orderId) ?? dayOrders.length + 1;

  const tx = db.transaction(() => {
    db.query(
      `INSERT INTO orders (id,api_key_id,external_ref,customer_id,technician_id,address_json,lat,lng,appt_date,appt_kind,appt_start,appt_end,duration_min,service,notes,manager_json,provider_json,status,rank,tracking_token,tracking_token_hash,message,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      orderId,
      apiKey.id,
      input.externalRef ?? null,
      customer.id,
      tech.id,
      JSON.stringify(address),
      loc?.lat ?? null,
      loc?.lng ?? null,
      appt.date,
      appt.kind,
      appt.start ?? null,
      appt.end ?? null,
      input.durationMinutes ?? 60,
      input.service ?? null,
      input.notes ?? null,
      input.manager ? JSON.stringify(input.manager) : null,
      input.provider ? JSON.stringify(input.provider) : null,
      "scheduled",
      rank,
      trackingToken,
      trackingHash,
      null,
      createdAt,
      createdAt,
    );
    // rewrite ranks for scheduled
    for (const [id, r] of newRanks) db.query("UPDATE orders SET rank=? WHERE id=?").run(r, id);
    logEvent(orderId, "order.created", "integrator", { technicianId: tech.id, date: appt.date });
  });
  tx();

  rewriteRanks(tech.id, appt.date);
  const row = db.query("SELECT * FROM orders WHERE id=?").get(orderId) as any;
  const place = placeFor(row);
  const resp: any = {
    orderId,
    externalRef: input.externalRef ?? null,
    status: "scheduled",
    queue: place,
    trackingUrl: `${cfg.SD_PUBLIC_URL}/t/${trackingToken}`,
  };
  if (techToken) resp.technicianUrl = `${cfg.SD_PUBLIC_URL}/tech/${techToken}`;
  const respJson = JSON.stringify(resp);
  if (idem) {
    db.query("INSERT INTO idempotency (api_key_id,key,request_hash,response_json,status_code,created_at) VALUES (?,?,?,?,?,?)").run(
      apiKey.id, idem, reqHash, respJson, 201, createdAt,
    );
  }
  publishOrder(orderId);
  sendSse(`tech:${tech.id}:${appt.date}`, "day", getTechnicianDayView(tech.id, appt.date));
  return new Response(respJson, { status: 201, headers: { "content-type": "application/json", Location: `/v1/orders/${orderId}` } });
}

async function handleGetTracking(token: string) {
  const hash = await hashToken(token);
  const row = db.query("SELECT * FROM orders WHERE tracking_token_hash=?").get(hash) as any;
  if (!row) return problem(404, "Not found");
  return json(toTrackingView(row));
}

async function handleTrackingStream(token: string) {
  const hash = await hashToken(token);
  const row = db.query("SELECT * FROM orders WHERE tracking_token_hash=?").get(hash) as any;
  if (!row) return problem(404, "Not found");
  return sseResponse(`order:${row.id}`, "tracking", toTrackingView(row));
}

async function getTechByToken(token: string) {
  const hash = await hashToken(token);
  return db.query("SELECT * FROM technicians WHERE token_hash=?").get(hash) as any;
}

async function handleTechDay(token: string, date?: string | null) {
  const tech = await getTechByToken(token);
  if (!tech) return problem(404, "Not found");
  const d = date || new Date().toISOString().slice(0, 10);
  return json(getTechnicianDayView(tech.id, d));
}

async function handleTechStream(token: string) {
  const tech = await getTechByToken(token);
  if (!tech) return problem(404, "Not found");
  const d = new Date().toISOString().slice(0, 10);
  return sseResponse(`tech:${tech.id}:${d}`, "day", getTechnicianDayView(tech.id, d));
}

async function handleGetTask(token: string, orderId: string) {
  const tech = await getTechByToken(token);
  if (!tech) return problem(404, "Not found");
  const row = db.query("SELECT * FROM orders WHERE id=? AND technician_id=?").get(orderId, tech.id) as any;
  if (!row) return problem(404, "Not found");
  return json(toTask(row));
}

async function handleTaskAction(token: string, orderId: string, req: Request) {
  const tech = await getTechByToken(token);
  if (!tech) return problem(404, "Not found");
  const row = db.query("SELECT * FROM orders WHERE id=? AND technician_id=?").get(orderId, tech.id) as any;
  if (!row) return problem(404, "Not found");
  let body: any;
  try { body = await req.json(); } catch { return problem(400, "Bad request"); }
  const parsed = TaskAction.safeParse(body);
  if (!parsed.success) return problem(400, "Bad request", undefined, parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message})));
  const action = parsed.data;
  if (action.type === "unable" && !action.note) return problem(400, "Bad request", "note required for unable");
  if (action.type === "start") {
    const active = db.query("SELECT id FROM orders WHERE technician_id=? AND appt_date=? AND status IN ('en_route','on_site')").get(tech.id, row.appt_date) as any;
    if (active) return problem(409, "Conflict", "Another order is active");
  }
  const ns = nextStatus(row.status, action.type as any);
  if (!ns.ok) return json({ type: "https://sd.dev/problems/invalid-transition", title: "Invalid transition", status: 409, detail: ns.message }, 409, { "content-type": "application/problem+json" });
  const now = nowIso();
  const tx = db.transaction(() => {
    let msg = row.message;
    let finishedAt = row.finished_at;
    if (action.type === "unable") { msg = action.note ?? null; finishedAt = now; }
    if (action.type === "complete") { finishedAt = now; }
    db.query("UPDATE orders SET status=?, updated_at=?, message=?, finished_at=? WHERE id=?").run(ns.value, now, msg, finishedAt, row.id);
    logEvent(row.id, "order.status_changed", "technician", { from: row.status, to: ns.value, note: action.note ?? null });
  });
  tx();
  if (action.type === "start") {
    // out-of-turn start moves to front of remaining queue
    const q = queueForDay(tech.id, row.appt_date);
    const ranks = q.moveToFront(row.id);
    const tx2 = db.transaction(() => {
      for (const [id, r] of ranks) db.query("UPDATE orders SET rank=? WHERE id=?").run(r, id);
    });
    tx2();
  }
  rewriteRanks(tech.id, row.appt_date);
  // publish all orders in day
  for (const o of ordersForDay(tech.id, row.appt_date)) publishOrder(o.id);
  const updated = db.query("SELECT * FROM orders WHERE id=?").get(row.id) as any;
  return json(toTask(updated));
}

async function handleLocation(token: string, req: Request) {
  const tech = await getTechByToken(token);
  if (!tech) return problem(404, "Not found");
  let body: any;
  try { body = await req.json(); } catch { return problem(400, "Bad request"); }
  const parsed = LocationPing.safeParse(body);
  if (!parsed.success) return problem(400, "Bad request");
  const at = parsed.data.at ?? nowIso();
  db.query(
    `INSERT INTO technician_pos (technician_id,lat,lng,accuracy_m,at) VALUES (?,?,?,?,?)
     ON CONFLICT(technician_id) DO UPDATE SET lat=excluded.lat,lng=excluded.lng,accuracy_m=excluded.accuracy_m,at=excluded.at`,
  ).run(tech.id, parsed.data.lat, parsed.data.lng, parsed.data.accuracyMeters ?? null, at);
  // update your-turn customer live
  const active = db.query("SELECT * FROM orders WHERE technician_id=? AND status='en_route'").get(tech.id) as any;
  if (active) publishOrder(active.id);
  return new Response(null, { status: 204 });
}

async function handleCancelOrder(orderId: string, req: Request) {
  const apiKey = getApiKey(req);
  if (!apiKey) return problem(401, "Unauthorized");
  const row = db.query("SELECT * FROM orders WHERE id=? AND api_key_id=?").get(orderId, apiKey.id) as any;
  if (!row) return problem(404, "Not found");
  let body: any = {};
  try { body = await req.json(); } catch {}
  const reason = body.reason ?? null;
  const ns = nextStatus(row.status, "cancel");
  if (!ns.ok) return domainToProblem(ns);
  const now = nowIso();
  db.query("UPDATE orders SET status=?, message=?, updated_at=?, finished_at=? WHERE id=?").run("cancelled", reason, now, now, row.id);
  logEvent(row.id, "order.cancelled", "integrator", { reason });
  rewriteRanks(row.technician_id, row.appt_date);
  for (const o of ordersForDay(row.technician_id, row.appt_date)) publishOrder(o.id);
  return new Response(null, { status: 204 });
}

async function handleGetOrder(orderId: string, req: Request) {
  const apiKey = getApiKey(req);
  if (!apiKey) return problem(401, "Unauthorized");
  const row = db.query("SELECT * FROM orders WHERE id=? AND api_key_id=?").get(orderId, apiKey.id) as any;
  if (!row) return problem(404, "Not found");
  return json(toOrderView(row));
}

async function handleListOrders(req: Request, url: URL) {
  const apiKey = getApiKey(req);
  if (!apiKey) return problem(401, "Unauthorized");
  const techQ = url.searchParams.get("technician");
  const date = url.searchParams.get("date");
  let rows: any[] = [];
  if (techQ && date) {
    const em = normalizeEmail(techQ); const ph = normalizePhone(techQ, cfg.SD_DEFAULT_COUNTRY);
    let tech: any = null;
    if (em) tech = db.query("SELECT * FROM technicians WHERE email=?").get(em);
    if (!tech && ph) tech = db.query("SELECT * FROM technicians WHERE phone=?").get(ph);
    if (tech) rows = ordersForDay(tech.id, date);
  } else {
    rows = db.query("SELECT * FROM orders WHERE api_key_id=? ORDER BY created_at DESC LIMIT 50").all(apiKey.id) as any[];
  }
  return json({ items: rows.map(toOrderView) });
}

async function handleEvents(orderId: string, req: Request) {
  const apiKey = getApiKey(req);
  if (!apiKey) return problem(401, "Unauthorized");
  const row = db.query("SELECT * FROM orders WHERE id=? AND api_key_id=?").get(orderId, apiKey.id) as any;
  if (!row) return problem(404, "Not found");
  const evs = db.query("SELECT * FROM order_events WHERE order_id=? ORDER BY at ASC").all(orderId) as any[];
  return json({ items: evs.map(e=>({ id:e.id, orderId:e.order_id, type:e.type, actor:e.actor, data: JSON.parse(e.data_json), at:e.at })) });
}

function serveStatic(pathname: string): Response | null {
  const filePath = `./apps/web/dist${pathname === "/" ? "/index.html" : pathname}`;
  const file = Bun.file(filePath);
  return null; // handled below
}

const server = Bun.serve({
  port: cfg.PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    try {
      if (method === "POST" && pathname === "/v1/orders") return await handleCreateOrder(req);
      if (method === "GET" && pathname === "/v1/orders") return await handleListOrders(req, url);
      let m = pathname.match(/^\/v1\/orders\/(ord_[A-Za-z0-9]+)$/);
      if (m) {
        if (method === "GET") return await handleGetOrder(m[1]!, req);
        if (method === "DELETE") return await handleCancelOrder(m[1]!, req);
      }
      m = pathname.match(/^\/v1\/orders\/(ord_[A-Za-z0-9]+)\/events$/);
      if (m && method === "GET") return await handleEvents(m[1]!, req);

      m = pathname.match(/^\/v1\/track\/([^/]+)$/);
      if (m && method === "GET") return await handleGetTracking(m[1]!);
      m = pathname.match(/^\/v1\/track\/([^/]+)\/stream$/);
      if (m && method === "GET") return await handleTrackingStream(m[1]!);

      m = pathname.match(/^\/v1\/tech\/([^/]+)\/day$/);
      if (m && method === "GET") return await handleTechDay(m[1]!, url.searchParams.get("date"));
      m = pathname.match(/^\/v1\/tech\/([^/]+)\/stream$/);
      if (m && method === "GET") return await handleTechStream(m[1]!);
      m = pathname.match(/^\/v1\/tech\/([^/]+)\/orders\/(ord_[A-Za-z0-9]+)$/);
      if (m && method === "GET") return await handleGetTask(m[1]!, m[2]!);
      m = pathname.match(/^\/v1\/tech\/([^/]+)\/orders\/(ord_[A-Za-z0-9]+)\/actions$/);
      if (m && method === "POST") return await handleTaskAction(m[1]!, m[2]!, req);
      m = pathname.match(/^\/v1\/tech\/([^/]+)\/location$/);
      if (m && method === "POST") return await handleLocation(m[1]!, req);

      if (method === "GET" && pathname === "/v1/openapi.yaml") {
        const f = Bun.file("./openapi.yaml");
        if (await f.exists()) return new Response(f, { headers: { "content-type": "application/yaml" } });
      }

      // static web
      if (!pathname.startsWith("/v1/")) {
        const dist = "./apps/web/dist";
        let file = Bun.file(dist + pathname);
        if (!(await file.exists()) || pathname === "/") file = Bun.file(dist + "/index.html");
        if (await file.exists()) {
          return new Response(file, { headers: { "Referrer-Policy": "no-referrer" } });
        }
      }
      return problem(404, "Not found");
    } catch (e: any) {
      console.error(e);
      return problem(500, "Internal Server Error", e?.message);
    }
  },
});

console.log(`SD API listening on http://localhost:${server.port}`);
