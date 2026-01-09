import type { ChallengeConfig, ProgramBlock, ProgramSession } from "@/types";
import { useMemo } from "react";

function distributeIntoSets(total: number, sets: number): number[] {
  const base = Math.floor(total / sets);
  const remainder = total - base * sets;
  const arr = Array.from(
    { length: sets },
    (_, i) => base + (i < remainder ? 1 : 0)
  );
  return arr;
}

/**
 * Generates progressive ProgramSession[] from challenge config.
 * Sessions progress from initialReps to targetReps, with configurable
 * percentage increase per week (7 sessions, default: 10%).
 */
export function generateChallengeSessions(
  config: ChallengeConfig
): ProgramSession[] {
  const {
    exerciseId,
    sets,
    initialReps = 20,
    targetReps,
    warmUpSeconds,
    breakSeconds,
    weeklyIncreasePercent
  } = config;
  const increasePercent = weeklyIncreasePercent ?? 10;
  const result: ProgramSession[] = [];
  let total = initialReps;
  let i = 1;
  let sessionInWeek = 0; // Track sessions within current week

  while (total <= targetReps) {
    const rounded = Math.max(1, Math.round(total));
    const dist = distributeIntoSets(rounded, sets);

    const blocks: ProgramSession["blocks"] = [];

    // Add warmup block
    if (warmUpSeconds > 0) {
      blocks.push({ type: "warmup", seconds: warmUpSeconds });
    }

    // Add exercise and rest blocks for each set
    for (let setIdx = 0; setIdx < sets; setIdx++) {
      blocks.push({
        type: "exercise",
        exerciseId,
        targetReps: dist[setIdx]
      });

      // Add rest block after each set except the last one
      if (setIdx < sets - 1 && breakSeconds > 0) {
        blocks.push({
          type: "rest",
          seconds: breakSeconds,
          label: "Rest"
        });
      }
    }

    // Generate descriptive name showing total reps
    const totalReps = dist.reduce((sum, r) => sum + r, 0);
    const sessionName = `${totalReps} Reps`;

    result.push({
      index: i,
      name: sessionName,
      blocks
    });

    i += 1;
    sessionInWeek += 1;

    // Increase reps every 7 sessions (weekly)
    if (sessionInWeek >= 7) {
      total += (total * increasePercent) / 100;
      sessionInWeek = 0;
    }
  }

  // Ensure last session is exactly targetReps if we overshot slightly
  const last = result[result.length - 1];
  if (last) {
    const lastTotal = last.blocks
      .filter((b) => b.type === "exercise")
      .reduce((sum, b) => sum + (b.targetReps || 0), 0);
    if (lastTotal !== targetReps) {
      const dist = distributeIntoSets(targetReps, sets);
      const blocks: ProgramSession["blocks"] = [];

      if (warmUpSeconds > 0) {
        blocks.push({ type: "warmup", seconds: warmUpSeconds });
      }

      for (let setIdx = 0; setIdx < sets; setIdx++) {
        blocks.push({
          type: "exercise",
          exerciseId,
          targetReps: dist[setIdx]
        });

        if (setIdx < sets - 1 && breakSeconds > 0) {
          blocks.push({
            type: "rest",
            seconds: breakSeconds,
            label: "Rest"
          });
        }
      }

      // Last session should show target reps
      result[result.length - 1] = {
        ...last,
        name: `${targetReps} Reps`,
        blocks
      };
    } else {
      // Update name to show target reps even if we didn't overshoot
      result[result.length - 1] = {
        ...last,
        name: `${targetReps} Reps`
      };
    }
  }

  return result;
}

/**
 * Calculate the total number of challenge sessions without generating them all.
 * This is useful for displaying session counts before generation.
 * Increases happen every 7 sessions (weekly).
 */
export function calculateChallengeSessionCount(
  config: ChallengeConfig
): number {
  const increasePercent = config.weeklyIncreasePercent ?? 10;
  const initialReps = config.initialReps ?? 20;
  let total = initialReps;
  let count = 0;
  let sessionInWeek = 0;

  while (total <= config.targetReps) {
    count += 1;
    sessionInWeek += 1;

    // Increase reps every 7 sessions (weekly)
    if (sessionInWeek >= 7) {
      total += (total * increasePercent) / 100;
      sessionInWeek = 0;
    }
  }

  // Add one more for the final session that reaches exactly targetReps
  return count + 1;
}

/**
 * Hook to get sessions for a program, generating them dynamically if it's a challenge.
 */
export function useChallengeSessions(
  program:
    | { blocks: ProgramBlock[]; challengeConfig?: ChallengeConfig }
    | null
    | undefined
): ProgramSession[] {
  return useMemo(() => {
    if (!program) return [];
    if (program.challengeConfig) {
      return generateChallengeSessions(program.challengeConfig);
    }
    // For regular programs, create a single session from blocks
    return [
      {
        index: 1,
        name: "Workout",
        blocks: program.blocks
      }
    ];
  }, [program]);
}
