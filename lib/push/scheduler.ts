/**
 * Timezone-aware, idempotent 10:00 AM local reminder selection.
 * Pure helpers tested without network.
 */

export function localDateAndHour(
  now: Date,
  timeZone: string,
): { localDate: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    localDate: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** True when local clock is in the 10:00 hour and we have not sent today. */
export function shouldSendReminder(opts: {
  now: Date;
  timeZone: string;
  reminderEnabled: boolean;
  lastSentLocalDate: string | null;
}): boolean {
  if (!opts.reminderEnabled) return false;
  const { localDate, hour } = localDateAndHour(opts.now, opts.timeZone);
  if (hour !== 10) return false;
  if (opts.lastSentLocalDate === localDate) return false;
  return true;
}
