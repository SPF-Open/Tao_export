import { writable } from "svelte/store";

export type NotificationVariant = "error" | "info" | "success" | "warning";

export interface Notification {
  id: number;
  title: string;
  message: string;
  variant: NotificationVariant;
}

const DEFAULT_TTL = 5000;
let nextId = 1;

export const notifications = writable<Notification[]>([]);

export function dismissNotification(id: number) {
  notifications.update((items) => items.filter((item) => item.id !== id));
}

export function pushNotification(
  notification: Omit<Notification, "id">,
  ttl = DEFAULT_TTL,
) {
  const item = { ...notification, id: nextId++ };
  notifications.update((items) => [...items, item]);

  if (ttl > 0) {
    setTimeout(() => dismissNotification(item.id), ttl);
  }

  return item.id;
}

export function pushError(title: string, message: string, ttl = DEFAULT_TTL) {
  return pushNotification({ title, message, variant: "error" }, ttl);
}
