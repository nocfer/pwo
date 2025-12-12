import type { ChallengeConfig, ProgramSession } from "@/types";
import { useMemo } from "react";

function distributeIntoSets(total: number, sets: number): number[] {
  const base = Math.floor(total / sets);
  const remainder = total - base * sets;
  const arr = Array.from(
    { length: sets },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
  return arr;
}

/**
 * Generates progressive ProgramSession[] from challenge config.
 * Sessions progress from 20 reps to targetReps, +12% per session.
 */
export function generateChallengeSessions(
  config: ChallengeConfig,
): ProgramSession[] {
  const { exerciseId, sets, targetReps, warmUpSeconds, breakSeconds } = config;
  const result: ProgramSession[] = [];
  let total = 20;
  let i = 1;

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
        targetReps: dist[setIdx],
      });

      // Add rest block after each set except the last one
      if (setIdx < sets - 1 && breakSeconds > 0) {
        blocks.push({
          type: "rest",
          seconds: breakSeconds,
          label: "Rest",
        });
      }
    }

    result.push({
      index: i,
      name: `Session ${i}`,
      blocks,
    });

    i += 1;
    total += (total * 12) / 100;
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
          targetReps: dist[setIdx],
        });

        if (setIdx < sets - 1 && breakSeconds > 0) {
          blocks.push({
            type: "rest",
            seconds: breakSeconds,
            label: "Rest",
          });
        }
      }

      result.push({
        index: i,
        name: `Session ${i}`,
        blocks,
      });
    }
  }

  return result;
}

/**
 * Hook to get sessions for a program, generating them dynamically if it's a challenge.
 */
export function useChallengeSessions(
  program: { sessions: ProgramSession[]; challengeConfig?: ChallengeConfig } | null | undefined,
): ProgramSession[] {
  return useMemo(() => {
    if (!program) return [];
    if (program.challengeConfig) {
      return generateChallengeSessions(program.challengeConfig);
    }
    return program.sessions;
  }, [program]);
}
