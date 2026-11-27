import { EventEmitter } from "node:events";
import { Types } from "mongoose";
import { Role, TICKET_EVENT_NAMES, TicketEventName } from "../constants";

export interface TicketEventPayload {
  event: TicketEventName;
  ticketId: Types.ObjectId;
  ticketTitle: string;
  ticketOwnerId: Types.ObjectId;
  assignedToId?: Types.ObjectId | null;
  actorId: Types.ObjectId;
  actorRole: Role;
  details: string;
  metadata?: Record<string, unknown>;
}

type Listener = (payload: TicketEventPayload) => Promise<void> | void;

/**
 * In-process event bus. Services publish domain events AFTER the DB write succeeds;
 * listeners (activity log, notifications, ...) react independently. A failing listener
 * never breaks the request that triggered the event.
 */
class TicketEventBus extends EventEmitter {
  publish(payload: TicketEventPayload): void {
    this.emit(payload.event, payload);
  }

  subscribe(listener: Listener, events: readonly TicketEventName[] = TICKET_EVENT_NAMES): void {
    for (const name of events) {
      this.on(name, (payload: TicketEventPayload) => {
        Promise.resolve()
          .then(() => listener(payload))
          .catch((err) => console.error(`[events] listener failed for ${name}:`, err));
      });
    }
  }
}

export const ticketEvents = new TicketEventBus();
