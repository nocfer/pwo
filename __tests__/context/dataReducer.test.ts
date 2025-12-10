import { describe, it, expect } from "vitest";
import { dataReducer, initialState } from "@/context/DataContext";

describe("dataReducer", () => {
  it("SET_ROUTINES updates routines and sets loading to false", () => {
    const routines = [{ name: "Push-ups", slug: "push-ups" }];
    const result = dataReducer(initialState, {
      type: "SET_ROUTINES",
      routines,
    });
    expect(result.routines).toEqual(routines);
    expect(result.routinesLoading).toBe(false);
  });

  it("SET_ROUTINES_LOADING updates loading state", () => {
    const result = dataReducer(initialState, {
      type: "SET_ROUTINES_LOADING",
      loading: false,
    });
    expect(result.routinesLoading).toBe(false);
  });

  it("SET_LAST_COMPLETED_SLUG updates slug", () => {
    const result = dataReducer(initialState, {
      type: "SET_LAST_COMPLETED_SLUG",
      slug: "test-slug",
    });
    expect(result.lastCompletedSlug).toBe("test-slug");
  });

  it("SET_LAST_COMPLETED_SLUG can set to null", () => {
    const stateWithSlug = { ...initialState, lastCompletedSlug: "test-slug" };
    const result = dataReducer(stateWithSlug, {
      type: "SET_LAST_COMPLETED_SLUG",
      slug: null,
    });
    expect(result.lastCompletedSlug).toBeNull();
  });

  it("INCREMENT_PROGRESS_VERSION increments version", () => {
    expect(initialState.progressVersion).toBe(0);
    const result = dataReducer(initialState, {
      type: "INCREMENT_PROGRESS_VERSION",
    });
    expect(result.progressVersion).toBe(1);
  });

  it("INCREMENT_HISTORY_VERSION increments version", () => {
    expect(initialState.historyVersion).toBe(0);
    const result = dataReducer(initialState, {
      type: "INCREMENT_HISTORY_VERSION",
    });
    expect(result.historyVersion).toBe(1);
  });

  it("INCREMENT_COMPLETED_VERSION increments version", () => {
    expect(initialState.completedVersion).toBe(0);
    const result = dataReducer(initialState, {
      type: "INCREMENT_COMPLETED_VERSION",
    });
    expect(result.completedVersion).toBe(1);
  });

  it("REFRESH_ALL increments all versions", () => {
    const state = {
      ...initialState,
      progressVersion: 5,
      historyVersion: 3,
      completedVersion: 2,
    };
    const result = dataReducer(state, { type: "REFRESH_ALL" });
    expect(result.progressVersion).toBe(6);
    expect(result.historyVersion).toBe(4);
    expect(result.completedVersion).toBe(3);
  });

  it("returns unchanged state for unknown action", () => {
    const result = dataReducer(initialState, { type: "UNKNOWN_ACTION" } as any);
    expect(result).toBe(initialState);
  });

  it("preserves other state properties on partial updates", () => {
    const stateWithData = {
      ...initialState,
      routines: [{ name: "Test", slug: "test" }],
      lastCompletedSlug: "test",
      progressVersion: 5,
    };

    const result = dataReducer(stateWithData, {
      type: "INCREMENT_HISTORY_VERSION",
    });

    expect(result.routines).toEqual(stateWithData.routines);
    expect(result.lastCompletedSlug).toBe("test");
    expect(result.progressVersion).toBe(5);
    expect(result.historyVersion).toBe(1);
  });
});

describe("initialState", () => {
  it("has correct default values", () => {
    expect(initialState.routines).toEqual([]);
    expect(initialState.routinesLoading).toBe(true);
    expect(initialState.lastCompletedSlug).toBeNull();
    expect(initialState.progressVersion).toBe(0);
    expect(initialState.historyVersion).toBe(0);
    expect(initialState.completedVersion).toBe(0);
  });
});
