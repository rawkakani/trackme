export type DomainErrorKind =
  | "invalid_transition"
  | "not_found"
  | "conflict"
  | "validation";

export type DomainError = {
  ok: false;
  kind: DomainErrorKind;
  message: string;
  detail?: string;
  errors?: Array<{ path: string; message: string }>;
};

export const err = (
  kind: DomainErrorKind,
  message: string,
  detail?: string,
  errors?: Array<{ path: string; message: string }>,
): DomainError => ({ ok: false, kind, message, detail, errors });

export type Ok<T> = { ok: true; value: T };
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export type Result<T> = Ok<T> | DomainError;
