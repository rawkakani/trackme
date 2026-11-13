const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomString(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export const newOrderId = (): string => `ord_${randomString(16)}`;
export const newCustomerId = (): string => `cus_${randomString(16)}`;
export const newTechnicianId = (): string => `tec_${randomString(16)}`;
export const newEventId = (): string => `evt_${randomString(16)}`;
export const newApiKeyId = (): string => `key_${randomString(16)}`;

export const newToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const hashToken = async (token: string): Promise<string> => {
  const data = new TextEncoder().encode(token);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const newApiKey = (): { key: string; prefix: string } => {
  const key = `sd_live_${randomString(32)}`;
  return { key, prefix: key.slice(0, 12) };
};
