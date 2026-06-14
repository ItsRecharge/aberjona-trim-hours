/** Formats a UTC-midnight event date as a readable label (date-only). */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
