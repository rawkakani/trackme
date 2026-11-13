import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(4100),
  SD_PUBLIC_URL: z.string().default("http://localhost:4100"),
  SD_DB: z.string().default("./data/sd.db"),
  SD_TIMEZONE: z.string().default("Africa/Johannesburg"),
  SD_DEFAULT_COUNTRY: z.string().default("ZA"),
  SD_DAY_START: z.string().default("08:00"),
  SD_AVG_SPEED_KMH: z.coerce.number().default(30),
  SD_ROAD_FACTOR: z.coerce.number().default(1.4),
  SD_DEFAULT_TRAVEL_MIN: z.coerce.number().default(25),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    console.error("Invalid config", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
