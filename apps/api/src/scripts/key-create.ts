import { newApiKey, newApiKeyId } from "@sd/domain";
import { loadConfig } from "../config";
import { openDb } from "../db/migrate";
import { createHash } from "crypto";

const name = process.argv[2] || "default";
const cfg = loadConfig();
const db = openDb(cfg.SD_DB);
const { key, prefix } = newApiKey();
const hash = createHash("sha256").update(key).digest("hex");
const id = newApiKeyId();
db.query(
  "INSERT INTO api_keys (id,name,key_hash,prefix,support_phone,support_email,created_at) VALUES (?,?,?,?,?,?,?)",
).run(id, name, hash, prefix, null, null, new Date().toISOString());
console.log(key);
