import { describe, expect, it } from "vitest";
import { shouldSendReminder } from "@/lib/push/scheduler";

describe("shouldSendReminder", () => {
  it("sends once in the local 10:00 hour", () => {
    // 15:00 UTC is 10:00 in America/Chicago during standard time-ish fixed offset
    // Use an explicit zoned check via a known Instant: 2024-01-15T16:05:00Z = 10:05 Chicago
    const now = new Date("2024-01-15T16:05:00.000Z");
    expect(
      shouldSendReminder({
        now,
        timeZone: "America/Chicago",
        reminderEnabled: true,
        lastSentLocalDate: null,
      }),
    ).toBe(true);
  });

  it("is idempotent for the same local date", () => {
    const now = new Date("2024-01-15T16:05:00.000Z");
    expect(
      shouldSendReminder({
        now,
        timeZone: "America/Chicago",
        reminderEnabled: true,
        lastSentLocalDate: "2024-01-15",
      }),
    ).toBe(false);
  });

  it("does not send when disabled or outside the hour", () => {
    const now = new Date("2024-01-15T18:05:00.000Z"); // noon Chicago
    expect(
      shouldSendReminder({
        now,
        timeZone: "America/Chicago",
        reminderEnabled: true,
        lastSentLocalDate: null,
      }),
    ).toBe(false);
    expect(
      shouldSendReminder({
        now: new Date("2024-01-15T16:05:00.000Z"),
        timeZone: "America/Chicago",
        reminderEnabled: false,
        lastSentLocalDate: null,
      }),
    ).toBe(false);
  });
});
