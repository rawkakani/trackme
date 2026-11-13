import { loadConfig } from "../config";

const cfg = loadConfig();
const base = `http://localhost:${cfg.PORT}`;

async function main() {
  // assumes an api key exists; create one if missing
  const { openDb } = await import("../db/migrate");
  const { createHash } = await import("crypto");
  const { newApiKey, newApiKeyId } = await import("@sd/domain");
  const db = openDb(cfg.SD_DB);
  let keyRow = db.query("SELECT * FROM api_keys LIMIT 1").get() as any;
  let apiKey: string;
  if (!keyRow) {
    const { key, prefix } = newApiKey();
    const hash = createHash("sha256").update(key).digest("hex");
    db.query("INSERT INTO api_keys (id,name,key_hash,prefix,created_at) VALUES (?,?,?,?,?)").run(
      newApiKeyId(), "seed", hash, prefix, new Date().toISOString(),
    );
    apiKey = key;
  } else {
    console.log("API key exists in DB but plaintext unknown. Create new: bun run key:create seed");
    // create a new one for seed output
    const { key, prefix } = newApiKey();
    const hash = createHash("sha256").update(key).digest("hex");
    db.query("INSERT INTO api_keys (id,name,key_hash,prefix,created_at) VALUES (?,?,?,?,?)").run(
      newApiKeyId(), "seed2", hash, prefix, new Date().toISOString(),
    );
    apiKey = key;
  }

  const date = new Date().toISOString().slice(0, 10);
  const tech = { email: "sipho@example.com", name: "Sipho Dlamini", phone: "+27820000001" };
  const customers = [
    { name: "Thandi Mokoena", email: "thandi1@example.com", phone: "+27821234567", line1: "14 Jacaranda Street", city: "Pretoria" },
    { name: "Lerato Nkosi", email: "lerato2@example.com", phone: "+27821234568", line1: "22 Oak Ave", city: "Pretoria" },
    { name: "Neo Khumalo", email: "neo3@example.com", phone: "+27821234569", line1: "8 Pine Road", city: "Pretoria" },
    { name: "Ava Smith", email: "ava4@example.com", phone: "+27821234570", line1: "5 River St", city: "Pretoria" },
    { name: "Sam Jones", email: "sam5@example.com", phone: "+27821234571", line1: "9 Hill St", city: "Pretoria" },
    { name: "Kai Patel", email: "kai6@example.com", phone: "+27821234572", line1: "3 Lake Dr", city: "Pretoria" },
  ];
  let techUrl = "";
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i]!;
    const startH = 8 + i;
    const body = {
      customer: { name: c.name, email: c.email, phone: c.phone },
      address: { line1: c.line1, city: c.city, location: { lat: -25.7479 + i * 0.01, lng: 28.2293 + i * 0.01 } },
      handledBy: tech,
      appointment: { date, kind: "exact", start: `${date}T${String(startH).padStart(2,"0")}:00:00+02:00` },
      durationMinutes: 45,
      service: "Fibre installation",
    };
    const res = await fetch(`${base}/v1/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (j.technicianUrl) techUrl = j.technicianUrl;
    console.log(`Customer ${i + 1} tracking: ${j.trackingUrl}`);
  }
  if (techUrl) console.log(`Technician: ${techUrl}`);
  else {
    const t = db.query("SELECT token_plain FROM technicians WHERE email=?").get(tech.email) as any;
    if (t?.token_plain) console.log(`Technician: ${cfg.SD_PUBLIC_URL}/tech/${t.token_plain}`);
  }
}
main().catch(console.error);
