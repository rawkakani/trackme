import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";
import schema from "./schema.sql" with { type: "text" };

export function openDb(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.exec(schema);
  return db;
}
