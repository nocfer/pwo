import { daysBetween, formatDate, normalizeStreak } from "@/lib/utils/date";
import { describe, expect, it } from "vitest";

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    const date = new Date("2024-01-15");
    expect(daysBetween(date, date)).toBe(0);
  });

  it("returns correct days for future date", () => {
    const a = new Date("2024-01-15");
    const b = new Date("2024-01-18");
    expect(daysBetween(a, b)).toBe(3);
  });

  it("returns negative for past date", () => {
    const a = new Date("2024-01-18");
    const b = new Date("2024-01-15");
    expect(daysBetween(a, b)).toBe(-3);
  });

  it("handles month boundaries", () => {
    const a = new Date("2024-01-30");
    const b = new Date("2024-02-02");
    expect(daysBetween(a, b)).toBe(3);
  });

  it("handles year boundaries", () => {
    const a = new Date("2023-12-30");
    const b = new Date("2024-01-02");
    expect(daysBetween(a, b)).toBe(3);
  });

  it("ignores time portion", () => {
    const a = new Date("2024-01-15T08:00:00");
    const b = new Date("2024-01-15T22:00:00");
    expect(daysBetween(a, b)).toBe(0);
  });
});

describe("normalizeStreak", () => {
  it("returns last 7 entries when no days passed", () => {
    const streak = [1, 0, 1, 1, 0, 1, 1];
    const result = normalizeStreak(streak, 0);
    expect(result).toEqual([1, 0, 1, 1, 0, 1, 1]);
  });

  it("pads with zeros when days passed", () => {
    const streak = [1, 0, 1, 1, 0, 1, 1];
    const result = normalizeStreak(streak, 2);
    expect(result).toEqual([1, 1, 0, 1, 1, 0, 0]);
  });

  it("handles streak shorter than 7", () => {
    const streak = [1, 0, 1];
    const result = normalizeStreak(streak, 0);
    expect(result).toEqual([1, 0, 1]);
  });

  it("handles streak longer than 7 by slicing last 7 entries", () => {
    const streak = [1, 0, 1, 1, 0, 1, 1, 0, 1];
    const result = normalizeStreak(streak, 0);
    // slice(-7) gets last 7: [1, 1, 0, 1, 1, 0, 1]
    expect(result).toEqual([1, 1, 0, 1, 1, 0, 1]);
  });

  it("shifts out all old data when many days pass", () => {
    const streak = [1, 1, 1, 1, 1, 1, 1];
    const result = normalizeStreak(streak, 7);
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("formatDate", () => {
  it("formats Date object to YYYY-MM-DD", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    expect(formatDate(date)).toBe("2024-03-15");
  });

  it("formats string date to YYYY-MM-DD", () => {
    expect(formatDate("2024-03-15T12:00:00Z")).toBe("2024-03-15");
  });

  it("handles ISO string input", () => {
    expect(formatDate("2024-06-20T00:00:00.000Z")).toBe("2024-06-20");
  });
});
