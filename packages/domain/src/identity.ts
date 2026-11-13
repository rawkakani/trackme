export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const v = email.trim().toLowerCase();
  return v.length ? v : null;
}

export function normalizePhone(
  phone: string | null | undefined,
  defaultCountry = "ZA",
): string | null {
  if (!phone) return null;
  let v = phone.trim().replace(/[\s()-]/g, "");
  if (!v) return null;
  if (v.startsWith("+")) return v;
  if (defaultCountry === "ZA") {
    if (v.startsWith("0") && v.length === 10) return `+27${v.slice(1)}`;
    if (v.startsWith("27") && v.length === 11) return `+${v}`;
  }
  return v.startsWith("+") ? v : `+${v}`;
}

export function firstName(name: string | null | undefined): string | null {
  if (!name) return null;
  const t = name.trim();
  if (!t) return null;
  return t.split(/\s+/)[0] ?? null;
}
