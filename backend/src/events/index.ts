import { ticketEvents } from "./event-bus";
import { activityLogListener } from "./listeners/activity-log.listener";
import { notificationListener } from "./listeners/notification.listener";

let registered = false;

/** Wire listeners to the bus. Idempotent, called once at startup. */
export const registerEventListeners = (): void => {
  if (registered) return;
  registered = true;
  ticketEvents.subscribe(activityLogListener);
  ticketEvents.subscribe(notificationListener);
};

export { ticketEvents };
