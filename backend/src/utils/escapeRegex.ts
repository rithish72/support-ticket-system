/** Escapes user input before using it inside a RegExp (prevents regex injection / ReDoS). */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
