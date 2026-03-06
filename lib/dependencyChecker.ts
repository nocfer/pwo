/**
 * Dependency checking utilities
 * Provides comprehensive dependency analysis for data integrity
 */

import type { Exercise, Program } from '@/types'
import type {
  DataType,
  DependencyCheck,
  DependencyResult,
  ValidationError,
  ValidationResult
} from '@/types/enhanced'
import { ValidationErrorCode } from '@/types/enhanced'
import { createValidationError } from './validation'

// ============================================================================
// Dependency Checker Class
// ============================================================================

export class DependencyChecker {
  private exercises: Exercise[]
  private programs: Program[]

  constructor(exercises: Exercise[], programs: Program[]) {
    this.exercises = exercises
    this.programs = programs
  }

  /**
   * Updates the data collections for dependency checking
   */
  updateData(exercises: Exercise[], programs: Program[]): void {
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

    // Programs don't typically have dependencies on other programs
    // But we could check for active sessions, progress data, etc.

    // For now, programs can generally be deleted unless they have active sessions
    // This would require session progress data to implement fully

    return {
      canDelete: true,
      dependentPrograms: [],
      dependentChallenges: [],
      warnings
    }
  }

  /**
   * Validates all exercise references in a program
   */
  validateProgramExerciseReferences(program: Program): ValidationResult {
    const errors: ValidationError[] = []
    const exerciseIds = new Set(this.exercises.map(e => e.id))

    // Check challenge config exercise reference
    if (program.challengeConfig?.exerciseId) {
      if (!exerciseIds.has(program.challengeConfig.exerciseId)) {
        errors.push(
          createValidationError(
            'challengeConfig.exerciseId',
            `Challenge references non-existent exercise: ${program.challengeConfig.exerciseId}`,
            ValidationErrorCode.INVALID_REFERENCE
          )
        )
      }
    }

    // Check block exercise references
    program.blocks.forEach((block, blockIndex) => {
      if (block.type === 'exercise' && !exerciseIds.has(block.exerciseId)) {
        errors.push(
          createValidationError(
            `blocks[${blockIndex}].exerciseId`,
            `Block ${blockIndex + 1} references non-existent exercise: ${block.exerciseId}`,
            ValidationErrorCode.INVALID_REFERENCE
          )
        )
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validates all exercise references across all programs
   */
  validateAllExerciseReferences(): ValidationResult {
    const errors: ValidationError[] = []

    for (const program of this.programs) {
      const result = this.validateProgramExerciseReferences(program)
      if (!result.isValid) {
        // Prefix errors with program name for context
        const programErrors = result.errors.map(error => ({
          ...error,
          field: `program[${program.name}].${error.field}`,
          message: `In program "${program.name}": ${error.message}`
        }))
        errors.push(...programErrors)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Finds orphaned exercises (exercises not used by any program)
   */
  findOrphanedExercises(): Exercise[] {
    const usedExerciseIds = new Set<string>()

    // Collect all exercise IDs used in programs
    for (const program of this.programs) {
      // Check challenge config
      if (program.challengeConfig?.exerciseId) {
        usedExerciseIds.add(program.challengeConfig.exerciseId)
      }

      // Check blocks
      for (const block of program.blocks) {
        if (block.type === 'exercise') {
          usedExerciseIds.add(block.exerciseId)
        }
      }
    }

    // Return exercises that are not used anywhere
    return this.exercises.filter(
      exercise =>
        exercise.source === 'user' && !usedExerciseIds.has(exercise.id)
    )
  }

  /**
   * Finds programs with broken exercise references
   */
  findProgramsWithBrokenReferences(): Program[] {
    const brokenPrograms: Program[] = []

    for (const program of this.programs) {
      const result = this.validateProgramExerciseReferences(program)
      if (!result.isValid) {
        brokenPrograms.push(program)
      }
    }

    return brokenPrograms
  }

  /**
   * Gets usage statistics for an exercise
   */
  getExerciseUsageStats(exerciseId: string): {
    totalPrograms: number
    totalChallenges: number
    totalBlocks: number
    programs: { id: string; name: string; blockCount: number }[]
  } {
    const programs: { id: string; name: string; blockCount: number }[] = []
    let totalBlocks = 0
    let totalChallenges = 0

    for (const program of this.programs) {
      let blockCount = 0

      // Check challenge config
      if (program.challengeConfig?.exerciseId === exerciseId) {
        totalChallenges++
        blockCount++ // Count challenge config as one usage
      }

      // Check blocks
      for (const block of program.blocks) {
        if (block.type === 'exercise' && block.exerciseId === exerciseId) {
          blockCount++
        }
      }

      if (blockCount > 0) {
        programs.push({
          id: program.id,
          name: program.name,
          blockCount
        })
        totalBlocks += blockCount
      }
    }

    return {
      totalPrograms: programs.length,
      totalChallenges,
      totalBlocks,
      programs
    }
  }

  /**
   * Performs a comprehensive dependency check
   */
  performComprehensiveCheck(): {
    isHealthy: boolean
    orphanedExercises: Exercise[]
    brokenPrograms: Program[]
    validationResult: ValidationResult
    summary: string
  } {
    const orphanedExercises = this.findOrphanedExercises()
    const brokenPrograms = this.findProgramsWithBrokenReferences()
    const validationResult = this.validateAllExerciseReferences()

    const isHealthy =
      orphanedExercises.length === 0 &&
      brokenPrograms.length === 0 &&
      validationResult.isValid

    let summary = ''
    if (isHealthy) {
      summary = 'All dependencies are healthy. No issues found.'
    } else {
      const issues: string[] = []
      if (orphanedExercises.length > 0) {
        issues.push(`${orphanedExercises.length} orphaned exercise(s)`)
      }
      if (brokenPrograms.length > 0) {
        issues.push(
          `${brokenPrograms.length} program(s) with broken references`
        )
      }
      if (!validationResult.isValid) {
        issues.push(`${validationResult.errors.length} validation error(s)`)
      }
      summary = `Issues found: ${issues.join(', ')}`
    }

    return {
      isHealthy,
      orphanedExercises,
      brokenPrograms,
      validationResult,
      summary
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a dependency checker instance
 */
export function createDependencyChecker(
  exercises: Exercise[],
  programs: Program[]
): DependencyChecker {
  return new DependencyChecker(exercises, programs)
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

/**
 * Validates referential integrity across all data
 */
export function validateReferentialIntegrity(
  exercises: Exercise[],
  programs: Program[]
): ValidationResult {
  const checker = new DependencyChecker(exercises, programs)
  return checker.validateAllExerciseReferences()
}

/**
 * Checks if an item can be safely modified (not built-in)
 */
export function canSafelyModify(
  type: DataType,
  id: string,
  exercises: Exercise[],
  programs: Program[]
): DependencyCheck {
  switch (type) {
    case 'exercises': {
      const exercise = exercises.find(e => e.id === id)
      if (!exercise) {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Exercise not found']
        }
      }

      if (exercise.source === 'builtin') {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Built-in exercises cannot be modified']
        }
      }

      return {
        canDelete: true,
        dependencies: {},
        warnings: []
      }
    }

    case 'programs':
    case 'challenges': {
      const program = programs.find(p => p.id === id)
      if (!program) {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Program not found']
        }
      }

      if (program.source === 'builtin') {
        return {
          canDelete: false,
          dependencies: {},
          warnings: ['Built-in programs cannot be modified']
        }
      }

      return {
        canDelete: true,
        dependencies: {},
        warnings: []
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
