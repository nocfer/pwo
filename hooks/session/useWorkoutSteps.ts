import { useChallengeSessions } from "@/hooks/data";
import type { Program, ProgramExerciseBlock } from "@/types";
import { useMemo } from "react";

/**
 * Default values for sets and rest configuration
 */
const DEFAULT_SETS = 1;
const DEFAULT_REST_BETWEEN_SETS = 60; // seconds
const DEFAULT_REST_BETWEEN_EXERCISES = 60; // seconds

export type WorkoutStep =
  | { key: string; type: "warmup"; seconds: number }
  | {
      key: string;
      type: "exercise";
      exerciseId: string;
      targetReps?: number;
      durationSeconds?: number;
      note?: string;
      /** 1-based set number for this exercise step */
      setNumber?: number;
      /** Total number of sets for this exercise */
      totalSets?: number;
    }
  | {
      key: string;
      type: "rest";
      seconds: number;
      label?: string;
      /** Context for the rest block: between sets of same exercise or between different exercises */
      restContext?: "between-sets" | "between-exercises";
    };

/**
 * Expands exercise blocks into multiple steps based on sets configuration.
 * Inserts rest blocks between consecutive sets and between different exercises.
 *
 * @param exerciseBlock - The exercise block to expand
 * @param blockIndex - Index of the block in the session (for unique keys)
 * @param isLastExercise - Whether this is the last exercise block in the session
 * @param defaultRestBetweenExercises - Default rest duration between exercises
 * @param currentStepCount - Current count of steps (for unique key generation)
 * @param hasExplicitRestAfter - Whether there's an explicit rest block following this exercise
 * @returns Array of expanded workout steps
 */
function expandExerciseBlock(
  exerciseBlock: ProgramExerciseBlock,
  blockIndex: number,
  isLastExercise: boolean,
  defaultRestBetweenExercises: number,
  currentStepCount: number,
  hasExplicitRestAfter: boolean
): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  const sets = exerciseBlock.sets ?? DEFAULT_SETS;
  const restBetweenSets =
    exerciseBlock.restBetweenSets ?? DEFAULT_REST_BETWEEN_SETS;

  for (let setNum = 1; setNum <= sets; setNum++) {
    // Add exercise step for this set
    // Always include setNumber and totalSets for consistent display
    steps.push({
      key: `ex-${exerciseBlock.exerciseId}-${blockIndex}-set${setNum}-${currentStepCount + steps.length}`,
      type: "exercise",
      exerciseId: exerciseBlock.exerciseId,
      targetReps: exerciseBlock.targetReps,
      durationSeconds: exerciseBlock.durationSeconds,
      note: exerciseBlock.note,
      setNumber: setNum,
      totalSets: sets
    });

    // Add rest between sets (not after the last set)
    if (setNum < sets && restBetweenSets > 0) {
      steps.push({
        key: `rest-between-sets-${blockIndex}-${setNum}-${currentStepCount + steps.length}`,
        type: "rest",
        seconds: restBetweenSets,
        label: "Rest between sets",
        restContext: "between-sets"
      });
    }
  }

  // Add rest between exercises (not after the last exercise, and not if there's an explicit rest block following)
  if (
    !isLastExercise &&
    !hasExplicitRestAfter &&
    defaultRestBetweenExercises > 0
  ) {
    steps.push({
      key: `rest-between-exercises-${blockIndex}-${currentStepCount + steps.length}`,
      type: "rest",
      seconds: defaultRestBetweenExercises,
      label: "Rest between exercises",
      restContext: "between-exercises"
    });
  }

  return steps;
}

export function useWorkoutSteps(
  program: Program | null | undefined,
  sessionIndex: number | undefined
) {
  // Generate sessions dynamically if this is a challenge program
  const sessions = useChallengeSessions(program);

  const session = useMemo(() => {
    if (!program || !sessionIndex) return null;
    return sessions.find((s) => s.index === sessionIndex) ?? null;
  }, [program, sessionIndex, sessions]);

  const steps = useMemo<WorkoutStep[]>(() => {
    if (!program || !session) return [];
    const list: WorkoutStep[] = [];

    // Get default rest between exercises from program config
    const defaultRestBetweenExercises =
      program.defaultRestBetweenExercises ?? DEFAULT_REST_BETWEEN_EXERCISES;

    // Add initial warmup from program config if present
    if (program.initialWarmup && program.initialWarmup.seconds > 0) {
      list.push({
        key: `initial-warmup-${list.length}`,
        type: "warmup",
        seconds: program.initialWarmup.seconds
      });
    }

    // Find all exercise blocks to determine which is the last one
    const exerciseBlockIndices: number[] = [];
    session.blocks.forEach((block, idx) => {
      if (block.type === "exercise") {
        exerciseBlockIndices.push(idx);
      }
    });
    const lastExerciseBlockIndex =
      exerciseBlockIndices[exerciseBlockIndices.length - 1];

    for (let blockIdx = 0; blockIdx < session.blocks.length; blockIdx++) {
      const block = session.blocks[blockIdx];

      if (block.type === "warmup") {
        if (block.seconds > 0) {
          list.push({
            key: `warmup-${list.length}`,
            type: "warmup",
            seconds: block.seconds
          });
        }
        continue;
      }

      if (block.type === "rest") {
        if (block.seconds > 0) {
          list.push({
            key: `rest-${list.length}`,
            type: "rest",
            seconds: block.seconds,
            label: block.label,
            // Explicit rest blocks in session are typically between exercises
            restContext: "between-exercises"
          });
        }
        continue;
      }

      // Exercise block → expand into multiple steps based on sets
      const isLastExercise = blockIdx === lastExerciseBlockIndex;
      // Check if the next block is an explicit rest block to avoid duplication
      const nextBlock = session.blocks[blockIdx + 1];
      const hasExplicitRestAfter = nextBlock?.type === "rest";
      const expandedSteps = expandExerciseBlock(
        block,
        blockIdx,
        isLastExercise,
        defaultRestBetweenExercises,
        list.length,
        hasExplicitRestAfter
      );
      list.push(...expandedSteps);
    }

    return list;
  }, [program, session]);

  return { session, steps } as const;
}
