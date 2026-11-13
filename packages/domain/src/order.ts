import { err, ok, type Result } from "./errors";

export type OrderStatus =
  | "scheduled"
  | "en_route"
  | "on_site"
  | "completed"
  | "unable"
  | "cancelled";

export type TaskAction = "start" | "arrive" | "complete" | "unable" | "cancel";

export const transitions: Record<OrderStatus, Partial<Record<TaskAction, OrderStatus>>> = {
  scheduled: { start: "en_route", cancel: "cancelled" },
  en_route: { arrive: "on_site", unable: "unable" },
  on_site: { complete: "completed", unable: "unable" },
  completed: {},
  unable: {},
  cancelled: {},
};

export function allowedActions(status: OrderStatus): TaskAction[] {
  return Object.keys(transitions[status]) as TaskAction[];
}

export function canTransition(status: OrderStatus, action: TaskAction): boolean {
  return transitions[status][action] !== undefined;
}

export function nextStatus(status: OrderStatus, action: TaskAction): Result<OrderStatus> {
  const next = transitions[status][action];
  if (!next) return err("invalid_transition", `Cannot ${action} from ${status}`);
  return ok(next);
}

export function isActive(status: OrderStatus): boolean {
  return status === "en_route" || status === "on_site";
}

export function isFinished(status: OrderStatus): boolean {
  return status === "completed" || status === "unable" || status === "cancelled";
}
