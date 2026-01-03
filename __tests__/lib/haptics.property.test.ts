/**
 * Property-based tests for Haptic Feedback Consistency
 * Feature: data-management-reorganization, Property 31: Haptic feedback consistency
 * **Validates: Requirements 10.6**
 */

import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock expo-haptics at the module level
const mockImpactAsync = vi.fn();
const mockNotificationAsync = vi.fn();
const mockSelectionAsync = vi.fn();

vi.mock("expo-haptics", () => ({
  impactAsync: mockImpactAsync,
  notificationAsync: mockNotificationAsync,
  selectionAsync: mockSelectionAsync,
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy"
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error"
  }
}));

// Mock Platform to simulate iOS (where haptics are available)
vi.mock("react-native", () => ({
  Platform: {
    OS: "ios"
  }
}));

describe("Haptic Feedback Consistency Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImpactAsync.mockResolvedValue(undefined);
    mockNotificationAsync.mockResolvedValue(undefined);
    mockSelectionAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("Property 31: Haptic feedback consistency - For any important action on supported devices, appropriate haptic feedback should be triggered", async () => {
    // Feature: data-management-reorganization, Property 31: Haptic feedback consistency

    // Import haptics after mocks are set up
    const { haptics } = await import("@/lib/haptics");

    // Generator for CRUD operation types
    const crudOperationArb = fc.constantFrom(
      "createItem",
      "updateItem",
      "deleteItem",
      "bulkDelete",
      "duplicateItem"
    );

    // Generator for navigation operation types
    const navigationOperationArb = fc.constantFrom(
      "dataTabSwitch",
      "tabSwitch",
      "buttonTap"
    );

    // Generator for selection operation types
    const selectionOperationArb = fc.constantFrom(
      "itemSelection",
      "bulkSelection",
      "clearSelection"
    );

    // Generator for form operation types
    const formOperationArb = fc.constantFrom(
      "formSave",
      "formCancel",
      "formValidationError"
    );

    // Generator for search/filter operation types
    const searchOperationArb = fc.constantFrom("searchFilter", "sortChange");

    // Property 1: CRUD operations should trigger appropriate haptic feedback
    await fc.assert(
      fc.asyncProperty(crudOperationArb, async (operation) => {
        vi.clearAllMocks();
        await haptics[operation]();

        switch (operation) {
          case "createItem":
            expect(mockNotificationAsync).toHaveBeenCalledWith("success");
            break;
          case "updateItem":
          case "duplicateItem":
            expect(mockImpactAsync).toHaveBeenCalledWith("medium");
            break;
          case "deleteItem":
          case "bulkDelete":
            expect(mockImpactAsync).toHaveBeenCalledWith("heavy");
            break;
        }
      }),
      { numRuns: 50 }
    );

    // Property 2: Navigation operations should trigger consistent feedback
    await fc.assert(
      fc.asyncProperty(navigationOperationArb, async (operation) => {
        vi.clearAllMocks();
        await haptics[operation]();

        switch (operation) {
          case "dataTabSwitch":
          case "tabSwitch":
            expect(mockSelectionAsync).toHaveBeenCalled();
            break;
          case "buttonTap":
            expect(mockImpactAsync).toHaveBeenCalledWith("light");
            break;
        }
      }),
      { numRuns: 50 }
    );

    // Property 3: Selection operations should trigger appropriate feedback
    await fc.assert(
      fc.asyncProperty(selectionOperationArb, async (operation) => {
        vi.clearAllMocks();
        await haptics[operation]();

        switch (operation) {
          case "itemSelection":
          case "clearSelection":
            expect(mockImpactAsync).toHaveBeenCalledWith("light");
            break;
          case "bulkSelection":
            expect(mockImpactAsync).toHaveBeenCalledWith("medium");
            break;
        }
      }),
      { numRuns: 50 }
    );

    // Property 4: Form operations should trigger appropriate feedback
    await fc.assert(
      fc.asyncProperty(formOperationArb, async (operation) => {
        vi.clearAllMocks();
        await haptics[operation]();

        switch (operation) {
          case "formSave":
            expect(mockNotificationAsync).toHaveBeenCalledWith("success");
            break;
          case "formCancel":
            expect(mockImpactAsync).toHaveBeenCalledWith("light");
            break;
          case "formValidationError":
            expect(mockNotificationAsync).toHaveBeenCalledWith("error");
            break;
        }
      }),
      { numRuns: 50 }
    );

    // Property 5: Search and filter operations should trigger light feedback
    await fc.assert(
      fc.asyncProperty(searchOperationArb, async (operation) => {
        vi.clearAllMocks();
        await haptics[operation]();

        expect(mockImpactAsync).toHaveBeenCalledWith("light");
      }),
      { numRuns: 50 }
    );
  });

  it("Property 31 Intensity Consistency: Haptic feedback intensity should be consistent across similar action types", async () => {
    // Feature: data-management-reorganization, Property 31: Haptic feedback consistency

    // Import haptics after mocks are set up
    const { haptics } = await import("@/lib/haptics");

    // Generator for action intensity levels
    const lightActionsArb = fc.constantFrom(
      "buttonTap",
      "itemSelection",
      "clearSelection",
      "formCancel",
      "searchFilter",
      "sortChange"
    );

    const mediumActionsArb = fc.constantFrom(
      "updateItem",
      "duplicateItem",
      "bulkSelection",
      "swipeAction"
    );

    const heavyActionsArb = fc.constantFrom("deleteItem", "bulkDelete");

    const successActionsArb = fc.constantFrom("createItem", "formSave");

    const errorActionsArb = fc.constantFrom("formValidationError");

    const selectionActionsArb = fc.constantFrom("dataTabSwitch", "tabSwitch");

    // Property 1: Light actions should always use light impact
    await fc.assert(
      fc.asyncProperty(lightActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockImpactAsync).toHaveBeenCalledWith("light");
      }),
      { numRuns: 50 }
    );

    // Property 2: Medium actions should always use medium impact
    await fc.assert(
      fc.asyncProperty(mediumActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockImpactAsync).toHaveBeenCalledWith("medium");
      }),
      { numRuns: 50 }
    );

    // Property 3: Heavy actions should always use heavy impact
    await fc.assert(
      fc.asyncProperty(heavyActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockImpactAsync).toHaveBeenCalledWith("heavy");
      }),
      { numRuns: 50 }
    );

    // Property 4: Success actions should always use success notification
    await fc.assert(
      fc.asyncProperty(successActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockNotificationAsync).toHaveBeenCalledWith("success");
      }),
      { numRuns: 50 }
    );

    // Property 5: Error actions should always use error notification
    await fc.assert(
      fc.asyncProperty(errorActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockNotificationAsync).toHaveBeenCalledWith("error");
      }),
      { numRuns: 50 }
    );

    // Property 6: Selection actions should always use selection feedback
    await fc.assert(
      fc.asyncProperty(selectionActionsArb, async (action) => {
        vi.clearAllMocks();
        await haptics[action]();

        expect(mockSelectionAsync).toHaveBeenCalled();
      }),
      { numRuns: 50 }
    );
  });

  it("Property 31 Platform Consistency: Haptic feedback should be consistent across platform availability", async () => {
    // Feature: data-management-reorganization, Property 31: Haptic feedback consistency

    // Import haptics after mocks are set up
    const { haptics } = await import("@/lib/haptics");

    // Generator for all haptic actions
    const allHapticActionsArb = fc.constantFrom(
      "buttonTap",
      "tabSwitch",
      "createItem",
      "updateItem",
      "deleteItem",
      "bulkDelete",
      "duplicateItem",
      "dataTabSwitch",
      "itemSelection",
      "bulkSelection",
      "clearSelection",
      "searchFilter",
      "sortChange",
      "formSave",
      "formCancel",
      "formValidationError"
    );

    // Property 1: All haptic actions should be callable without errors
    await fc.assert(
      fc.asyncProperty(allHapticActionsArb, async (action) => {
        // Should not throw any errors when called
        await expect(haptics[action]()).resolves.not.toThrow();
      }),
      { numRuns: 50 }
    );

    // Property 2: Haptic actions should be idempotent (calling multiple times should be safe)
    await fc.assert(
      fc.asyncProperty(
        allHapticActionsArb,
        fc.integer({ min: 1, max: 3 }),
        async (action, callCount) => {
          // Should be safe to call multiple times in succession
          for (let i = 0; i < callCount; i++) {
            await expect(haptics[action]()).resolves.not.toThrow();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("Property 31 Edge Cases: Haptic feedback should handle edge cases gracefully", async () => {
    // Feature: data-management-reorganization, Property 31: Haptic feedback consistency

    // Import haptics after mocks are set up
    const { haptics } = await import("@/lib/haptics");

    // Property 1: Rapid successive calls should not cause issues
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("buttonTap", "itemSelection", "searchFilter"),
        fc.integer({ min: 3, max: 10 }),
        async (action, rapidCallCount) => {
          // Simulate rapid user interactions
          const promises = Array.from({ length: rapidCallCount }, () =>
            haptics[action]()
          );

          // All calls should complete without errors
          await expect(Promise.all(promises)).resolves.not.toThrow();
        }
      ),
      { numRuns: 30 }
    );

    // Property 2: Concurrent calls to different haptic actions should work
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom(
            "buttonTap",
            "itemSelection",
            "formSave",
            "deleteItem",
            "dataTabSwitch"
          ),
          { minLength: 2, maxLength: 4 }
        ),
        async (actions) => {
          // Simulate concurrent haptic feedback calls
          const promises = actions.map((action) => haptics[action]());

          // All concurrent calls should complete without errors
          await expect(Promise.all(promises)).resolves.not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });
});
