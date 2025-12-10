import { describe, it, expect } from "vitest";
import { formatTime, formatReps } from "@/lib/utils/format";

describe("formatTime", () => {
  it("formats 0 seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  it("formats exactly one minute", () => {
    expect(formatTime(60)).toBe("1:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(90)).toBe("1:30");
  });

  it("pads seconds with leading zero", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  it("handles large values", () => {
    expect(formatTime(3661)).toBe("61:01");
  });

  it("formats single digit seconds correctly", () => {
    expect(formatTime(61)).toBe("1:01");
    expect(formatTime(69)).toBe("1:09");
  });
});

describe("formatReps", () => {
  it("formats singular rep", () => {
    expect(formatReps(1)).toBe("1 rep");
  });

  it("formats plural reps", () => {
    expect(formatReps(5)).toBe("5 reps");
  });

  it("formats zero reps", () => {
    expect(formatReps(0)).toBe("0 reps");
  });

  it("formats large numbers", () => {
    expect(formatReps(100)).toBe("100 reps");
  });
});
