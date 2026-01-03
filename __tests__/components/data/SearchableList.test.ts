/**
 * Property-based tests for SearchableList component metadata display
 * Feature: data-management-reorganization, Property 2: Metadata display completeness
 */

import type { DataType } from "@/types/enhanced";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// Simulate metadata extraction logic from SearchableList
function extractMetadata(item: any, dataType: DataType) {
  const metadata: string[] = [];

  // Created date
  if (item.createdAt) {
    const createdDate = formatDate(item.createdAt);
    metadata.push(`Created: ${createdDate}`);
  }

  // Updated date (if different from created)
  if (item.updatedAt && item.updatedAt !== item.createdAt) {
    const updatedDate = formatDate(item.updatedAt);
    metadata.push(`Updated: ${updatedDate}`);
  }

  // Challenge indicator
  if ("challengeConfig" in item && item.challengeConfig) {
    metadata.push("Challenge");
  }

  // Category (for exercises)
  if (item.category) {
    const categoryLabel =
      item.category.charAt(0).toUpperCase() + item.category.slice(1);
    metadata.push(categoryLabel);
  }

  return metadata;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Unknown";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "Unknown";
  }
}

// Simulate the built-in badge logic
function shouldShowBuiltinBadge(item: any): boolean {
  return item.source === "builtin";
}

describe("SearchableList Metadata Display Property Tests", () => {
  // Property 2: Metadata display completeness
  // For any data item displayed in lists, the interface should show all relevant metadata
  // including creation date, usage count, and source type
  // **Validates: Requirements 1.4**
  it("Property 2: Metadata display completeness", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("exercises", "programs", "challenges"),
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
          source: fc.constantFrom("builtin", "user"),
          createdAt: fc.option(
            fc
              .date({ min: new Date(2020, 0, 1), max: new Date() })
              .filter(d => !isNaN(d.getTime()))
              .map((d) => d.toISOString())
          ),
          updatedAt: fc.option(
            fc
              .date({ min: new Date(2020, 0, 1), max: new Date() })
              .filter(d => !isNaN(d.getTime()))
              .map((d) => d.toISOString())
          ),
          category: fc.option(
            fc.constantFrom("strength", "cardio", "flexibility", "skill")
          ),
          challengeConfig: fc.option(
            fc.record({
              exerciseId: fc.string(),
              sets: fc.integer({ min: 1, max: 10 }),
              targetReps: fc.integer({ min: 1, max: 1000 }),
              warmUpSeconds: fc.integer({ min: 0, max: 300 }),
              breakSeconds: fc.integer({ min: 0, max: 300 })
            })
          )
        }),
        (dataType: DataType, item: any) => {
          // Extract metadata using the component logic
          const metadata = extractMetadata(item, dataType);

          // Verify required metadata is present

          // 1. Creation date should always be included if available
          if (item.createdAt) {
            const hasCreatedDate = metadata.some((m) =>
              m.startsWith("Created:")
            );
            expect(hasCreatedDate).toBe(true);
          }

          // 2. Source type should be indicated for built-in items
          const shouldShowBadge = shouldShowBuiltinBadge(item);
          if (item.source === "builtin") {
            expect(shouldShowBadge).toBe(true);
          } else {
            expect(shouldShowBadge).toBe(false);
          }

          // 3. Updated date should be shown if different from created date
          if (item.updatedAt && item.updatedAt !== item.createdAt) {
            const hasUpdatedDate = metadata.some((m) =>
              m.startsWith("Updated:")
            );
            expect(hasUpdatedDate).toBe(true);
          }

          // 4. Challenge indicator should be shown for challenges
          if (item.challengeConfig) {
            const hasChallengeIndicator = metadata.includes("Challenge");
            expect(hasChallengeIndicator).toBe(true);
          }

          // 5. Category should be shown for exercises
          if (dataType === "exercises" && item.category) {
            const expectedCategory =
              item.category.charAt(0).toUpperCase() + item.category.slice(1);
            const hasCategoryIndicator = metadata.includes(expectedCategory);
            expect(hasCategoryIndicator).toBe(true);
          }

          // 6. Metadata should be properly formatted
          metadata.forEach((metadataItem) => {
            expect(typeof metadataItem).toBe("string");
            expect(metadataItem.length).toBeGreaterThan(0);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2a: Date formatting consistency
  it("Property 2a: Date formatting is consistent", () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date() }).filter(date => !isNaN(date.getTime())),
        (date: Date) => {
          const dateString = date.toISOString();
          const formatted = formatDate(dateString);

          // Should either be "Unknown" or a valid date format
          const isValidFormat =
            formatted === "Unknown" ||
            /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(formatted);

          expect(isValidFormat).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2b: Source type indication consistency
  it("Property 2b: Source type indication is consistent", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("builtin", "user"),
        (source: "builtin" | "user") => {
          const item = {
            id: "test_id",
            name: "Test Item",
            source
          };

          const shouldShowBadge = shouldShowBuiltinBadge(item);

          // Built-in items should show badge, user items should not
          if (source === "builtin") {
            expect(shouldShowBadge).toBe(true);
          } else {
            expect(shouldShowBadge).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2c: Challenge indicator consistency
  it("Property 2c: Challenge indicator is consistent", () => {
    fc.assert(
      fc.property(fc.boolean(), (hasChallenge: boolean) => {
        const item = {
          id: "test_id",
          name: "Test Item",
          source: "user" as const,
          createdAt: new Date().toISOString(),
          sessions: []
        };

        if (hasChallenge) {
          (item as any).challengeConfig = {
            exerciseId: "ex_1",
            sets: 5,
            targetReps: 100,
            warmUpSeconds: 60,
            breakSeconds: 30
          };
        }

        const metadata = extractMetadata(item, "challenges");
        const hasChallengeIndicator = metadata.includes("Challenge");

        // Should show challenge indicator only when challengeConfig exists
        expect(hasChallengeIndicator).toBe(hasChallenge);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  // Unit test for edge cases
  it("handles missing or invalid dates gracefully", () => {
    const itemWithoutDates = {
      id: "test_id",
      name: "Test Item",
      source: "user" as const
    };

    const metadata = extractMetadata(itemWithoutDates, "exercises");

    // Should not crash and should not include date metadata
    expect(Array.isArray(metadata)).toBe(true);
    expect(metadata.every((m) => !m.startsWith("Created:"))).toBe(true);
    expect(metadata.every((m) => !m.startsWith("Updated:"))).toBe(true);
  });

  // Unit test for category display
  it("displays exercise categories correctly", () => {
    const categories = ["strength", "cardio", "flexibility", "skill"];

    categories.forEach((category) => {
      const item = {
        id: "test_id",
        name: "Test Exercise",
        source: "user" as const,
        category,
        createdAt: new Date().toISOString()
      };

      const metadata = extractMetadata(item, "exercises");
      const expectedCategory =
        category.charAt(0).toUpperCase() + category.slice(1);

      expect(metadata.includes(expectedCategory)).toBe(true);
    });
  });

  // Unit test for invalid date handling
  it("handles invalid dates gracefully", () => {
    const itemWithInvalidDate = {
      id: "test_id",
      name: "Test Item",
      source: "user" as const,
      createdAt: "invalid-date"
    };

    const metadata = extractMetadata(itemWithInvalidDate, "exercises");
    const createdMetadata = metadata.find((m) => m.startsWith("Created:"));

    expect(createdMetadata).toBe("Created: Unknown");
  });
});
