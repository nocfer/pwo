/**
 * Dependency checking utilities
 * Provides dependency analysis for data integrity
 */

import type { Exercise, Program } from '@/types'
import type {
  DataType,
  DependencyCheck,
  DependencyResult
} from '@/types/enhanced'

// ============================================================================
// Dependency Checker Class
// ============================================================================

class DependencyChecker {
  private exercises: Exercise[]
  private programs: Program[]

  constructor(exercises: Exercise[], programs: Program[]) {
    this.exercises = exercises
    this.programs = programs
  }

  /**
   * Checks dependencies for an exercise
   */
  checkExerciseDependencies(exerciseId: string): DependencyResult {
    const dependentPrograms: Program[] = []
    const dependentChallenges: Program[] = []
    const warnings: string[] = []

    // Check program blocks
    for (const program of this.programs) {
      let hasReference = false

      // Check blocks
      for (const block of program.blocks) {
        if (block.type === 'exercise' && block.exerciseId === exerciseId) {
          hasReference = true
          break
        }
      }

      // Check challenge config
      if (program.challengeConfig?.exerciseId === exerciseId) {
        hasReference = true
        dependentChallenges.push(program)
      }

      if (hasReference) {
        dependentPrograms.push(program)
      }
    }

    if (dependentPrograms.length > 0) {
      const programNames = dependentPrograms.map(p => `"${p.name}"`).join(', ')
      warnings.push(
        `This exercise is used by ${dependentPrograms.length} program(s): ${programNames}`
      )
    }

    if (dependentChallenges.length > 0) {
      const challengeNames = dependentChallenges
        .map(p => `"${p.name}"`)
        .join(', ')
      warnings.push(
        `This exercise is the target of ${dependentChallenges.length} challenge(s): ${challengeNames}`
      )
    }

    return {
      canDelete: dependentPrograms.length === 0,
      dependentPrograms,
      dependentChallenges,
      warnings
    }
  }

  /**
   * Checks dependencies for a program
   */
  checkProgramDependencies(programId: string): DependencyResult {
    const warnings: string[] = []

    return {
      canDelete: true,
      dependentPrograms: [],
      dependentChallenges: [],
      warnings
    }
  }
}

/**
 * Quick dependency check for deletion safety
 */
export function canSafelyDelete(
  type: DataType,
  id: string,
  exercises: Exercise[],
  programs: Program[]
): DependencyCheck {
  const checker = new DependencyChecker(exercises, programs)

  switch (type) {
    case 'exercises': {
      // First check if it's a built-in exercise
      const exercise = exercises.find(e => e.id === id)
      if (exercise?.source === 'builtin') {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Built-in exercises cannot be deleted']
        }
      }

      const result = checker.checkExerciseDependencies(id)
      return {
        canDelete: result.canDelete,
        dependencies: {
          programs: result.dependentPrograms,
          challenges: result.dependentChallenges
        },
        warnings: result.warnings
      }
    }

    case 'programs':
    case 'challenges': {
      // First check if it's a built-in program
      const program = programs.find(p => p.id === id)
      if (program?.source === 'builtin') {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Built-in programs cannot be deleted']
        }
      }

      const result = checker.checkProgramDependencies(id)
      return {
        canDelete: result.canDelete,
        dependencies: {
          programs: result.dependentPrograms,
          challenges: result.dependentChallenges
        },
        warnings: result.warnings
      }
    }

    default:
      return {
        canDelete: false,
        dependencies: {},
        warnings: [`Unknown data type: ${type}`]
      }
  }
}
