import { storage } from "@/lib/storage";
import { beforeEach, describe, expect, it } from "vitest";

function createLocalStorageMock() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => {
      map.clear();
    }
  };
}

describe("storage library CRUD", () => {
  beforeEach(() => {
    (globalThis as any).window = {
      localStorage: createLocalStorageMock()
    };
  });

  it("upsert/load/delete exercise roundtrip", async () => {
    const saved = await storage.upsertExercise({
      id: "",
      name: "Bench Press",
      category: "strength" as any,
      icon: "barbell",
      source: "user"
    });

    expect(saved.id).toBeTruthy();
    const loaded = await storage.loadExercises();
    expect(loaded.find((e) => e.id === saved.id)?.name).toBe("Bench Press");

    const updated = await storage.upsertExercise({
      id: saved.id,
      name: "Bench Press (Barbell)",
      category: "strength" as any,
      icon: "barbell",
      source: "user"
    });
    expect(updated.id).toBe(saved.id);
    const loaded2 = await storage.loadExercises();
    expect(loaded2.find((e) => e.id === saved.id)?.name).toBe(
      "Bench Press (Barbell)"
    );

    await storage.deleteExercise(saved.id);
    const loaded3 = await storage.loadExercises();
    expect(loaded3.find((e) => e.id === saved.id)).toBeUndefined();
  });

  it("upsert/load/delete program roundtrip", async () => {
    const saved = await storage.upsertProgram({
      id: "",
      name: "Test Program",
      description: "desc",
      sessions: [
        {
          index: 1,
          name: "Session 1",
          blocks: [{ type: "warmup", seconds: 60 }]
        }
      ],
      source: "user"
    });

    expect(saved.id).toBeTruthy();
    const loaded = await storage.loadPrograms();
    expect(loaded.find((p) => p.id === saved.id)?.name).toBe("Test Program");

    await storage.deleteProgram(saved.id);
    const loaded2 = await storage.loadPrograms();
    expect(loaded2.find((p) => p.id === saved.id)).toBeUndefined();
  });
});
