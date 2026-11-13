import type { DomainError } from "@sd/domain";

export function problem(status: number, title: string, detail?: string, errors?: any[]) {
  return Response.json(
    { type: `https://sd.dev/problems/${title.toLowerCase().replace(/\s+/g, "-")}`, title, status, detail, errors },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}

export function domainToProblem(e: DomainError): Response {
  if (e.kind === "not_found") return problem(404, "Not found", e.detail);
  if (e.kind === "invalid_transition") return problem(409, "Invalid transition", e.detail);
  if (e.kind === "conflict") return problem(409, "Conflict", e.detail);
  return problem(422, e.message || "Validation failed", e.detail, e.errors);
}
