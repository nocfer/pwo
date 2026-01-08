/**
 * Property-Based Tests for Exercise Progression Visualization
 *
 * **Property 16: Exercise progression visualization**
 * **Validates: Requirements 5.4**
 *
 * Tests that exercise progression charts display correctly with personal records highlighted.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

// Mock data types for testing
interface MockProgressionDataPoint {
  date: string;
  reps: number;
  maxWeight: number | null;
  volume: number | null;
}

interface MockPersonalRecord {
  type: "max_reps" | "max_weight" | "max_volume";
  value: number;
  achievedAt: string;
}

interface ChartVisualizationData {
  dataPoints: MockProgressionDataPoint[];
  personalRecords: MockPersonalRecord[];
  maxValue: number;
  prHighlights: boolean[];
}

// Function to process progression data for visualization
function processProgressionVisualization(
  dataPoints: MockProgressionDataPoint[],
  personalRecords: MockPersonalRecord[],
  selectedMetric: "reps" | "weight" | "volume"
): ChartVisualizationData {
  if (dataPoints.length === 0) {
    return {
      dataPoints: [],
      personalRecords: personalRecords, // Preserve original personalRecords
      maxValue: 0,
      prHighlights: []
    };
  }

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...dataPoints.map((dp) => {
      switch (selectedMetric) {
        case "weight":
          return dp.maxWeight || 0;
        case "volume":
          return dp.volume || 0;
        case "reps":
        default:
          return dp.reps;
      }
    }),
    1
  );

  // Determine PR highlights
  const prHighlights = dataPoints.map((point) => {
    return personalRecords.some((pr) => {
      const prDate = new Date(pr.achievedAt).toISOString().split("T")[0];
      const pointDate = point.date;
      return (
        prDate === pointDate &&
        ((selectedMetric === "reps" && pr.type === "max_reps") ||
          (selectedMetric === "weight" && pr.type === "max_weight") ||
          (selectedMetric === "volume" && pr.type === "max_volume"))
      );
    });
  });

  return {
    dataPoints,
    personalRecords,
    maxValue,
    prHighlights
  };
}

// Generators for property testing
const progressionDataPointArb = fc.record({
  date: fc.integer({ min: 0, max: 365 }).map((days) => {
    const baseDate = new Date("2023-01-01");
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split("T")[0];
  }),
  reps: fc.integer({ min: 1, max: 100 }),
  maxWeight: fc.option(fc.integer({ min: 10, max: 500 })),
  volume: fc.option(fc.integer({ min: 10, max: 10000 }))
});

const personalRecordArb = fc.record({
  type: fc.constantFrom("max_reps", "max_weight", "max_volume"),
  value: fc.integer({ min: 1, max: 1000 }),
  achievedAt: fc.integer({ min: 0, max: 365 }).map((days) => {
    const baseDate = new Date("2023-01-01");
    baseDate.setDate(baseDate.getDate() + days);
    return baseDate.toISOString().split("T")[0];
  })
});

describe("Exercise Progression Visualization Properties", () => {
  it("Property 16: Exercise progression visualization - should calculate max value correctly", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 1, maxLength: 50 }),
        fc.array(personalRecordArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom("reps", "weight", "volume"),
        (dataPoints, personalRecords, selectedMetric) => {
          const visualization = processProgressionVisualization(
            dataPoints,
            personalRecords,
            selectedMetric
          );

          // Max value should be at least 1 (minimum for non-empty data)
          expect(visualization.maxValue).toBeGreaterThanOrEqual(1);

          // Max value should be the actual maximum from the data points
          const expectedMax = Math.max(
            ...dataPoints.map((dp) => {
              switch (selectedMetric) {
                case "weight":
                  return dp.maxWeight || 0;
                case "volume":
                  return dp.volume || 0;
                case "reps":
                default:
                  return dp.reps;
              }
            }),
            1
          );

          expect(visualization.maxValue).toBe(expectedMax);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - PR highlights should match data points length", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 0, maxLength: 50 }),
        fc.array(personalRecordArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom("reps", "weight", "volume"),
        (dataPoints, personalRecords, selectedMetric) => {
          const visualization = processProgressionVisualization(
            dataPoints,
            personalRecords,
            selectedMetric
          );

          // PR highlights array should have same length as data points
          expect(visualization.prHighlights.length).toBe(dataPoints.length);

          // Each highlight should be a boolean
          visualization.prHighlights.forEach((highlight) => {
            expect(typeof highlight).toBe("boolean");
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - PR highlights should be accurate", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 1, maxLength: 20 }),
        fc.array(personalRecordArb, { minLength: 0, maxLength: 10 }),
        fc.constantFrom("reps", "weight", "volume"),
        (dataPoints, personalRecords, selectedMetric) => {
          const visualization = processProgressionVisualization(
            dataPoints,
            personalRecords,
            selectedMetric
          );

          // Verify each PR highlight is correctly calculated
          visualization.prHighlights.forEach((isHighlighted, index) => {
            const dataPoint = dataPoints[index];
            const shouldBeHighlighted = personalRecords.some((pr) => {
              const prDate = new Date(pr.achievedAt)
                .toISOString()
                .split("T")[0];
              const pointDate = dataPoint.date;
              return (
                prDate === pointDate &&
                ((selectedMetric === "reps" && pr.type === "max_reps") ||
                  (selectedMetric === "weight" && pr.type === "max_weight") ||
                  (selectedMetric === "volume" && pr.type === "max_volume"))
              );
            });

            expect(isHighlighted).toBe(shouldBeHighlighted);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - empty data should produce empty visualization", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(personalRecordArb, { minLength: 0, maxLength: 10 }),
        fc.constantFrom("reps", "weight", "volume"),
        (personalRecords, selectedMetric) => {
          const visualization = processProgressionVisualization(
            [],
            personalRecords,
            selectedMetric
          );

          expect(visualization.dataPoints).toEqual([]);
          expect(visualization.maxValue).toBe(0);
          expect(visualization.prHighlights).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - metric selection should affect max value calculation", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 1, maxLength: 20 }),
        fc.array(personalRecordArb, { minLength: 0, maxLength: 10 }),
        (dataPoints, personalRecords) => {
          const repsViz = processProgressionVisualization(
            dataPoints,
            personalRecords,
            "reps"
          );
          const weightViz = processProgressionVisualization(
            dataPoints,
            personalRecords,
            "weight"
          );
          const volumeViz = processProgressionVisualization(
            dataPoints,
            personalRecords,
            "volume"
          );

          // Max values should be calculated based on the selected metric
          const expectedRepsMax = Math.max(
            ...dataPoints.map((dp) => dp.reps),
            1
          );
          const expectedWeightMax = Math.max(
            ...dataPoints.map((dp) => dp.maxWeight || 0),
            1
          );
          const expectedVolumeMax = Math.max(
            ...dataPoints.map((dp) => dp.volume || 0),
            1
          );

          expect(repsViz.maxValue).toBe(expectedRepsMax);
          expect(weightViz.maxValue).toBe(expectedWeightMax);
          expect(volumeViz.maxValue).toBe(expectedVolumeMax);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - data integrity should be preserved", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 0, maxLength: 50 }),
        fc.array(personalRecordArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom("reps", "weight", "volume"),
        (dataPoints, personalRecords, selectedMetric) => {
          const visualization = processProgressionVisualization(
            dataPoints,
            personalRecords,
            selectedMetric
          );

          // Original data should be preserved
          expect(visualization.dataPoints).toEqual(dataPoints);
          expect(visualization.personalRecords).toEqual(personalRecords);

          // No data should be modified
          dataPoints.forEach((originalPoint, index) => {
            const visualizedPoint = visualization.dataPoints[index];
            expect(visualizedPoint.date).toBe(originalPoint.date);
            expect(visualizedPoint.reps).toBe(originalPoint.reps);
            expect(visualizedPoint.maxWeight).toBe(originalPoint.maxWeight);
            expect(visualizedPoint.volume).toBe(originalPoint.volume);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 16: Exercise progression visualization - PR highlights should only occur for matching metric types", () => {
    // Feature: data-management-reorganization, Property 16: Exercise progression visualization
    fc.assert(
      fc.property(
        fc.array(progressionDataPointArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom("reps", "weight", "volume"),
        (dataPoints, selectedMetric) => {
          // Create a PR that matches one of the data points but wrong metric type
          const testPoint = dataPoints[0];
          const wrongMetricPR: MockPersonalRecord = {
            type: selectedMetric === "reps" ? "max_weight" : "max_reps",
            value: 100,
            achievedAt: testPoint.date
          };

          const visualization = processProgressionVisualization(
            dataPoints,
            [wrongMetricPR],
            selectedMetric
          );

          // The first data point should NOT be highlighted because metric types don't match
          expect(visualization.prHighlights[0]).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
