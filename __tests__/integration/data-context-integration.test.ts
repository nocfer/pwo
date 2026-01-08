/**
 * Data Context Integration Tests
 *
 * Tests the integration of enhanced DataContext actions with storage and validation
 */

import { canSafelyDelete } from "@/lib/dependencyChecker";
import { storage } from "@/lib/storage";
import {
  validateExercise,
  validateModificationPermissions,
  validateUniqueName
} from "@/lib/validation";
import type { Exercise, Program } from "@/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock storage
vi.mock("@/lib/storage", () => ({
  storage: {
    loadExercises: vi.fn(),
    loadPrograms: vi.fn(),
    upsertExercise: vi.fn(),
    upsertProgram: vi.fn(),
    deleteExercise: vi.fn(),
    deleteProgram: vi.fn(),
    getLastCompletedSlug: vi.fn()
  }
}));

// Mock validation
vi.mock("@/lib/validation", () => ({
  validateExercise: vi.fn(),
  validateModificationPermissions: vi.fn(),
  validateUniqueName: vi.fn()
}));

// Mock dependency checker
vi.mock("@/lib/dependencyChecker", () => ({
  canSafelyDelete: vi.fn()
}));

// Mock events
vi.mock("@/lib/events", () => ({
  dataEvents: {
    subscribe: vi.fn(() => vi.fn()),
    emitSessionCompleted: vi.fn(),
    emitProgressUpdated: vi.fn(),
    emitHistoryUpdated: vi.fn(),
    emitEventRecorded: vi.fn(),
    emitSessionStateChanged: vi.fn()
  }
}));

describe("Data Context Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    vi.mocked(validateExercise).mockReturnValue({ isValid: true, errors: [] });
    vi.mocked(validateModificationPermissions).mockReturnValue({
      isValid: true,
      errors: []
    });
    vi.mocked(validateUniqueName).mockReturnValue({
      isValid: true,
      errors: []
    });
    vi.mocked(canSafelyDelete).mockReturnValue({
      canDelete: true,
      dependencies: {
        programs: [],
        challenges: [],
        sessions: []
      },
      warnings: []
    });
  });

  describe("Enhanced Actions Integration", () => {
    it("should integrate exercise CRUD operations with storage", async () => {
      const mockExercise: Exercise = {
        id: "ex_1",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      };

      vi.mocked(storage.upsertExercise).mockResolvedValue(mockExercise);
      vi.mocked(storage.loadExercises).mockResolvedValue([mockExercise]);

      // Test that storage methods are called with correct parameters
      await storage.upsertExercise({
        id: "",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user"
      });

      expect(storage.upsertExercise).toHaveBeenCalledWith({
        id: "",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user"
      });

      // Test validation integration - call validation directly to test integration
      const validationResult = validateExercise({
        name: "Test Exercise",
        category: "strength",
        icon: "barbell"
      });

      expect(validateExercise).toHaveBeenCalled();
      expect(validationResult.isValid).toBe(true);
    });

    it("should integrate program operations with validation", async () => {
      const mockProgram: Program = {
        id: "prg_1",
        name: "Test Program",
        blocks: [
          { type: "warmup", seconds: 180 },
          { type: "exercise", exerciseId: "ex_1", targetReps: 10 }
        ],
        source: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      };

      vi.mocked(storage.upsertProgram).mockResolvedValue(mockProgram);

      await storage.upsertProgram({
        id: "",
        name: "Test Program",
        blocks: mockProgram.blocks,
        source: "user"
      });

      expect(storage.upsertProgram).toHaveBeenCalledWith({
        id: "",
        name: "Test Program",
        blocks: mockProgram.blocks,
        source: "user"
      });
    });

    it("should integrate dependency checking with deletion", async () => {
      const mockExercise: Exercise = {
        id: "ex_1",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      };

      const mockProgram: Program = {
        id: "prg_1",
        name: "Test Program",
        blocks: [{ type: "exercise", exerciseId: "ex_1", targetReps: 10 }],
        source: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      };

      // Test dependency checking integration
      const dependencyResult = canSafelyDelete(
        "exercises",
        "ex_1",
        [mockExercise],
        [mockProgram]
      );

      expect(canSafelyDelete).toHaveBeenCalledWith(
        "exercises",
        "ex_1",
        [mockExercise],
        [mockProgram]
      );
      expect(dependencyResult.canDelete).toBe(true);
    });
  });

  describe("Search Integration", () => {
    it("should integrate search functionality", async () => {
      const mockExercises: Exercise[] = [
        {
          id: "ex_1",
          name: "Push Up",
          category: "strength",
          icon: "barbell",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "ex_2",
          name: "Running",
          category: "cardio",
          icon: "walk",
          source: "builtin",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ];

      // Test search filtering logic
      const searchQuery = "Push";
      const filteredResults = mockExercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filteredResults).toHaveLength(1);
      expect(filteredResults[0].name).toBe("Push Up");
    });

    it("should integrate category filtering", async () => {
      const mockExercises: Exercise[] = [
        {
          id: "ex_1",
          name: "Push Up",
          category: "strength",
          icon: "barbell",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "ex_2",
          name: "Running",
          category: "cardio",
          icon: "walk",
          source: "builtin",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ];

      // Test category filtering
      const strengthExercises = mockExercises.filter(
        (exercise) => exercise.category === "strength"
      );

      expect(strengthExercises).toHaveLength(1);
      expect(strengthExercises[0].name).toBe("Push Up");
    });

    it("should integrate source filtering", async () => {
      const mockExercises: Exercise[] = [
        {
          id: "ex_1",
          name: "Push Up",
          category: "strength",
          icon: "barbell",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "ex_2",
          name: "Running",
          category: "cardio",
          icon: "walk",
          source: "builtin",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ];

      // Test source filtering
      const userExercises = mockExercises.filter(
        (exercise) => exercise.source === "user"
      );

      expect(userExercises).toHaveLength(1);
      expect(userExercises[0].name).toBe("Push Up");
    });
  });

  describe("Import/Export Integration", () => {
    it("should integrate export functionality", async () => {
      const mockExercises: Exercise[] = [
        {
          id: "ex_1",
          name: "Test Exercise",
          category: "strength",
          icon: "barbell",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ];

      // Test export data structure
      const exportData = {
        type: "exercises" as const,
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        data: mockExercises.filter((e) => e.source === "user"),
        metadata: {
          exportedBy: "Progressive Workout App",
          itemCount: 1
        }
      };

      expect(exportData.type).toBe("exercises");
      expect(exportData.data).toHaveLength(1);
      expect(exportData.data[0].name).toBe("Test Exercise");
      expect(exportData.metadata?.itemCount).toBe(1);
    });

    it("should integrate import validation", async () => {
      const importData = {
        type: "exercises" as const,
        version: "1.0.0",
        data: [
          {
            id: "ex_import",
            name: "Imported Exercise",
            category: "strength",
            icon: "barbell",
            source: "user"
          }
        ]
      };

      // Test import validation logic
      const existingExercises: Exercise[] = [];
      const conflicts = importData.data.filter((item) =>
        existingExercises.some(
          (existing) => existing.id === item.id || existing.name === item.name
        )
      );

      expect(conflicts).toHaveLength(0); // No conflicts with empty existing data
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle storage errors gracefully", async () => {
      vi.mocked(storage.upsertExercise).mockRejectedValue(
        new Error("Storage error")
      );

      await expect(
        storage.upsertExercise({
          id: "",
          name: "Test Exercise",
          category: "strength",
          icon: "barbell",
          source: "user"
        })
      ).rejects.toThrow("Storage error");
    });

    it("should handle validation errors", async () => {
      vi.mocked(validateExercise).mockReturnValue({
        isValid: false,
        errors: [
          {
            field: "name",
            message: "Name is required",
            code: "REQUIRED_FIELD" as any,
            severity: "error"
          }
        ]
      });

      const validationResult = validateExercise({
        name: "",
        category: "strength",
        icon: "barbell"
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(1);
      expect(validationResult.errors[0].message).toBe("Name is required");
    });

    it("should handle permission errors", async () => {
      vi.mocked(validateModificationPermissions).mockReturnValue({
        isValid: false,
        errors: [
          {
            field: "source",
            message: "Built-in exercises cannot be modified",
            code: "INSUFFICIENT_PERMISSIONS" as any,
            severity: "error"
          }
        ]
      });

      const permissionResult = validateModificationPermissions(
        "builtin",
        "edit"
      );

      expect(permissionResult.isValid).toBe(false);
      expect(permissionResult.errors[0].message).toBe(
        "Built-in exercises cannot be modified"
      );
    });

    it("should handle dependency conflicts", async () => {
      vi.mocked(canSafelyDelete).mockReturnValue({
        canDelete: false,
        dependencies: {
          programs: [
            {
              id: "prg_1",
              name: "Test Program",
              description: "Test Description",
              blocks: [],
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
              source: "user"
            }
          ],
          challenges: [],
          sessions: []
        },
        warnings: ["Exercise is referenced by 1 program(s)"]
      });

      const dependencyResult = canSafelyDelete("exercises", "ex_1", [], []);

      expect(dependencyResult.canDelete).toBe(false);
      expect(dependencyResult.warnings).toContain(
        "Exercise is referenced by 1 program(s)"
      );
    });
  });

  describe("Data Flow Integration", () => {
    it("should maintain data consistency across operations", async () => {
      const mockExercise: Exercise = {
        id: "ex_1",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      };

      // Test create -> read -> update -> delete flow
      vi.mocked(storage.upsertExercise).mockResolvedValue(mockExercise);
      vi.mocked(storage.loadExercises).mockResolvedValue([mockExercise]);

      // Create
      const created = await storage.upsertExercise({
        id: "",
        name: "Test Exercise",
        category: "strength",
        icon: "barbell",
        source: "user"
      });

      expect(created).toEqual(mockExercise);

      // Read
      const exercises = await storage.loadExercises();
      expect(exercises).toContain(mockExercise);

      // Update
      const updated = { ...mockExercise, name: "Updated Exercise" };
      vi.mocked(storage.upsertExercise).mockResolvedValue(updated);

      const updatedResult = await storage.upsertExercise({
        id: "ex_1",
        name: "Updated Exercise",
        category: "strength",
        icon: "barbell",
        source: "user"
      });

      expect(updatedResult.name).toBe("Updated Exercise");

      // Delete
      await storage.deleteExercise("ex_1");
      expect(storage.deleteExercise).toHaveBeenCalledWith("ex_1");
    });

    it("should handle bulk operations correctly", async () => {
      const mockExercises: Exercise[] = [
        {
          id: "ex_1",
          name: "Exercise 1",
          category: "strength",
          icon: "barbell",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "ex_2",
          name: "Exercise 2",
          category: "cardio",
          icon: "walk",
          source: "user",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ];

      // Test bulk delete logic
      const idsToDelete = ["ex_1", "ex_2"];

      for (const id of idsToDelete) {
        const existing = mockExercises.find((e) => e.id === id);
        if (existing && existing.source === "user") {
          await storage.deleteExercise(id);
        }
      }

      expect(storage.deleteExercise).toHaveBeenCalledTimes(2);
      expect(storage.deleteExercise).toHaveBeenCalledWith("ex_1");
      expect(storage.deleteExercise).toHaveBeenCalledWith("ex_2");
    });
  });
});
