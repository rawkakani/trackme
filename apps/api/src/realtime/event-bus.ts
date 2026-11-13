import type { DomainEvent } from "@sd/domain";

type Handler = (e: DomainEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Handler[] = [];
  subscribe(h: Handler) {
    this.handlers.push(h);
  }
  async publish(events: DomainEvent[]) {
    for (const e of events) {
      for (const h of this.handlers) await h(e);
    }
  }
}
