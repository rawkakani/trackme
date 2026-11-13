PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  support_phone TEXT,
  support_email TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  token_hash TEXT UNIQUE,
  token_plain TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL,
  external_ref TEXT,
  customer_id TEXT NOT NULL,
  technician_id TEXT NOT NULL,
  address_json TEXT NOT NULL,
  lat REAL,
  lng REAL,
  appt_date TEXT NOT NULL,
  appt_kind TEXT NOT NULL,
  appt_start TEXT,
  appt_end TEXT,
  duration_min INTEGER NOT NULL,
  service TEXT,
  notes TEXT,
  manager_json TEXT,
  provider_json TEXT,
  status TEXT NOT NULL,
  rank INTEGER NOT NULL,
  tracking_token TEXT NOT NULL,
  tracking_token_hash TEXT UNIQUE NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  finished_at TEXT,
  UNIQUE(api_key_id, external_ref)
);

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  data_json TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS technician_pos (
  technician_id TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  accuracy_m REAL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency (
  api_key_id TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(api_key_id, key)
);

CREATE INDEX IF NOT EXISTS idx_orders_tech_day ON orders(technician_id, appt_date, rank);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, at);
