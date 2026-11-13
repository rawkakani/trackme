export type DomainEventType =
  | "order.created"
  | "order.rescheduled"
  | "order.reassigned"
  | "order.updated"
  | "order.cancelled"
  | "order.queue_moved"
  | "order.status_changed";

export type DomainEvent = {
  id: string;
  orderId: string;
  type: DomainEventType;
  actor: "integrator" | "technician" | "system";
  data: Record<string, unknown>;
  at: string;
};
