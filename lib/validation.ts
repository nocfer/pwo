/**
 * Validation utilities for enhanced data models
 * Provides comprehensive validation for exercises, programs, and challenges
 */

import type {
  ChallengeConfig,
  Exercise,
  ExerciseCategory,
  Program
} from "@/types";
import type {
  DependencyResult,
  EnhancedChallenge,
  EnhancedExercise,
  EnhancedProgram,
  FieldValidation,
  ValidationError,
  ValidationResult,
  ValidationSchema
} from "@/types/enhanced";
import { ValidationErrorCode } from "@/types/enhanced";

// ============================================================================
// Constants
// ============================================================================

export const VALID_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  "strength",
  "cardio",
  "flexibility",
  "skill"
];

export const VALID_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced"
] as const;

export const VALID_PROGRESSION_TYPES = ["linear", "percentage"] as const;

// Common Ionicons that are suitable for exercises
export const VALID_EXERCISE_ICONS = [
  "barbell",
  "fitness",
  "walk",
  "bicycle",
  "body",
  "heart",
  "timer",
  "flash",
  "trending-up",
  "medal",
  "trophy",
  "star",
  "checkmark-circle",
  "play-circle",
  "pause-circle",
  "stop-circle"
];

// ============================================================================
// Challenge Interdependency Calculations
// ============================================================================

/**
 * Calculates the number of sessions needed to reach target reps
 * given initial reps, sets, and weekly increase percentage
 */
export function calculateSessionsToTarget(
  initialReps: number,
  targetReps: number,
  weeklyIncreasePercent: number
): number {
  if (initialReps >= targetReps) return 1;

  // If no increase percentage, can never reach target
  if (weeklyIncreasePercent <= 0) return Infinity;

  let total = initialReps;
  let count = 0;
  let sessionInWeek = 0;

  while (total <= targetReps) {
    count += 1;
    sessionInWeek += 1;

    if (sessionInWeek >= 7) {
      total += (total * weeklyIncreasePercent) / 100;
      sessionInWeek = 0;
    }
  }

  return count + 1;
}

/**
 * Calculates the minimum duration (in days) needed to complete a challenge
 * Assumes 1 session per day
 */
export function calculateMinimumDuration(
  initialReps: number,
  targetReps: number,
  weeklyIncreasePercent: number
): number {
  return calculateSessionsToTarget(initialReps, targetReps, weeklyIncreasePercent);
}

/**
 * Calculates the maximum target reps achievable in a given duration
 * with the specified initial reps and weekly increase
 */
export function calculateMaxTargetReps(
  initialReps: number,
  durationDays: number,
  weeklyIncreasePercent: number
): number {
  let total = initialReps;
  let sessionInWeek = 0;

  for (let i = 1; i < durationDays; i++) {
    sessionInWeek += 1;

    if (sessionInWeek >= 7) {
      total += (total * weeklyIncreasePercent) / 100;
      sessionInWeek = 0;
    }
  }

  return Math.round(total);
}

/**
 * Validates challenge interdependencies and returns suggested corrections
 * Returns null if everything is valid, or an object with issues and suggestions
 */
export function validateChallengeInterdependencies(
  initialReps: number,
  targetReps: number,
  durationDays: number | undefined,
  weeklyIncreasePercent: number
): {
  isValid: boolean;
  issues: string[];
  suggestions: {
    minDuration?: number;
    maxTargetReps?: number;
    recommendedDuration?: number;
  };
} {
  const issues: string[] = [];
  const suggestions: {
    minDuration?: number;
    maxTargetReps?: number;
    recommendedDuration?: number;
  } = {};

  // Check if initial reps is greater than target reps
  if (initialReps > targetReps) {
    issues.push(
      `Initial reps (${initialReps}) cannot be greater than target reps (${targetReps})`
    );
  }

  // Check if initial reps equals target reps
  if (initialReps === targetReps) {
    issues.push(
      `Initial reps (${initialReps}) should be less than target reps (${targetReps}) to have a meaningful progression`
    );
  }

  // Calculate minimum duration needed
  const minDuration = calculateMinimumDuration(
    initialReps,
    targetReps,
    weeklyIncreasePercent
  );
  suggestions.minDuration = minDuration;

  // If duration is specified, validate it
  if (durationDays !== undefined && durationDays > 0) {
    if (durationDays < minDuration) {
      issues.push(
        `Duration (${durationDays} days) is too short to reach target reps (${targetReps}) from initial reps (${initialReps}) with ${weeklyIncreasePercent}% weekly increase`
      );
      suggestions.recommendedDuration = minDuration;
    }

    // Calculate what target reps could be achieved in the given duration
    const maxAchievable = calculateMaxTargetReps(
      initialReps,
      durationDays,
      weeklyIncreasePercent
    );
    suggestions.maxTargetReps = maxAchievable;
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Auto-adjusts challenge configuration to maintain valid interdependencies
 * When one field is edited, adjusts others to keep the configuration valid
 */
export function autoAdjustChallengeConfig(
  field: string,
  newValue: number,
  currentConfig: {
    initialReps: number;
    targetReps: number;
    weeklyIncreasePercent: number;
    duration?: number;
  }
): {
  initialReps: number;
  targetReps: number;
  weeklyIncreasePercent: number;
  duration?: number;
} {
  const config = { ...currentConfig, [field]: newValue };

  // If user changed initial reps
  if (field === "initialReps") {
    // If initial reps now >= target reps, increase target reps
    if (config.initialReps >= config.targetReps) {
      config.targetReps = Math.ceil(config.initialReps * 1.5);
    }
    // Recalculate minimum duration needed
    const minDuration = calculateMinimumDuration(
      config.initialReps,
      config.targetReps,
      config.weeklyIncreasePercent
    );
    if (config.duration && config.duration < minDuration) {
      config.duration = minDuration;
    }
  }

  // If user changed target reps
  if (field === "targetReps") {
    // If target reps now <= initial reps, increase target reps
    if (config.targetReps <= config.initialReps) {
      config.targetReps = Math.ceil(config.initialReps * 1.5);
    }
    // Recalculate minimum duration needed
    const minDuration = calculateMinimumDuration(
      config.initialReps,
      config.targetReps,
      config.weeklyIncreasePercent
    );
    if (config.duration && config.duration < minDuration) {
      config.duration = minDuration;
    }
  }

  // If user changed weekly increase percentage
  if (field === "weeklyIncreasePercent") {
    // If percentage is 0 or negative, set to minimum 1%
    if (config.weeklyIncreasePercent <= 0) {
      config.weeklyIncreasePercent = 1;
    }
    // Recalculate minimum duration needed
    const minDuration = calculateMinimumDuration(
      config.initialReps,
      config.targetReps,
      config.weeklyIncreasePercent
    );
    if (config.duration && config.duration < minDuration) {
      config.duration = minDuration;
    }
  }

  // If user changed duration
  if (field === "duration") {
    // If duration is now too short, adjust target reps down
    if (config.duration && config.duration > 0) {
      const maxAchievable = calculateMaxTargetReps(
        config.initialReps,
        config.duration,
        config.weeklyIncreasePercent
      );
      // If target is unreachable, lower it to what's achievable
      if (config.targetReps > maxAchievable) {
        config.targetReps = Math.max(
          config.initialReps + 1,
          Math.floor(maxAchievable * 0.9)
        );
      }
    }
  }

  return config;
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * Creates a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  code: ValidationErrorCode,
  severity: "error" | "warning" | "info" = "error"
): ValidationError {
  return { field, message, code, severity };
}

/**
 * Validates a field against its validation rules
 */
export function validateField<T>(
  value: any,
  validation: FieldValidation<T>,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field check
  if (
    validation.required &&
    (value === undefined || value === null || value === "")
  ) {
    errors.push(
      createValidationError(
        fieldName,
        `${fieldName} is required`,
        ValidationErrorCode.REQUIRED_FIELD
      )
    );
    return errors; // Don't continue validation if required field is missing
  }

  // Skip further validation if field is optional and empty (but not for custom validators that need to handle empty values)
  if (
    (!validation.required && (value === undefined || value === null)) ||
    (!validation.customValidator && value === "")
  ) {
    return errors;
  }

  // String length validation
  if (typeof value === "string") {
    if (validation.minLength && value.length < validation.minLength) {
      errors.push(
        createValidationError(
          fieldName,
          `${fieldName} must be at least ${validation.minLength} characters`,
          ValidationErrorCode.INVALID_FORMAT
        )
      );
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      errors.push(
        createValidationError(
          fieldName,
          `${fieldName} must be no more than ${validation.maxLength} characters`,
          ValidationErrorCode.INVALID_FORMAT
        )
      );
    }
  }

  // Pattern validation
  if (
    validation.pattern &&
    typeof value === "string" &&
    !validation.pattern.test(value)
  ) {
    errors.push(
      createValidationError(
        fieldName,
        `${fieldName} format is invalid`,
        ValidationErrorCode.INVALID_FORMAT
      )
    );
  }

  // Custom validation
  if (validation.customValidator) {
    const customResult = validation.customValidator(value);
    if (!customResult.isValid) {
      errors.push(...customResult.errors);
    }
  }

  return errors;
}

/**
 * Validates an object against a schema
 */
export function validateSchema<T>(
  data: Partial<T>,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field
  for (const fieldValidation of schema.fields) {
    const fieldName = String(fieldValidation.field);
    const value = data[fieldValidation.field];
    const fieldErrors = validateField(value, fieldValidation, fieldName);
    errors.push(...fieldErrors);
  }

  // Run custom validators
  if (schema.customValidators) {
    for (const validator of schema.customValidators) {
      const result = validator(data as T);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Exercise Validation
// ============================================================================

export const exerciseValidationSchema: ValidationSchema<EnhancedExercise> = {
  fields: [
    {
      field: "name",
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_()]+$/
    },
    {
      field: "category",
      customValidator: (value) => {
        if (value !== undefined && value !== null) {
          // Check for empty string specifically
          if (value === "") {
            return {
              isValid: false,
              errors: [
                createValidationError(
                  "category",
                  "Category cannot be empty",
                  ValidationErrorCode.INVALID_CATEGORY
                )
              ]
            };
          }

          // Check for whitespace-only strings
          if (typeof value === "string" && value.trim() === "") {
            return {
              isValid: false,
              errors: [
                createValidationError(
                  "category",
                  "Category cannot be empty",
                  ValidationErrorCode.INVALID_CATEGORY
                )
              ]
            };
          }

          // Check if value is in valid categories
          if (!VALID_EXERCISE_CATEGORIES.includes(value)) {
            return {
              isValid: false,
              errors: [
                createValidationError(
                  "category",
                  `Category must be one of: ${VALID_EXERCISE_CATEGORIES.join(", ")}`,
                  ValidationErrorCode.INVALID_CATEGORY
                )
              ]
            };
          }
        }
        return { isValid: true, errors: [] };
      }
    },
    {
      field: "icon",
      customValidator: (value) => {
        if (value && !VALID_EXERCISE_ICONS.includes(value)) {
          return {
            isValid: false,
            errors: [
              createValidationError(
                "icon",
                `Icon must be one of the predefined icons`,
                ValidationErrorCode.INVALID_ICON
              )
            ]
          };
        }
        return { isValid: true, errors: [] };
      }
    },
    {
      field: "description",
      maxLength: 500
    },
    {
      field: "instructions",
      maxLength: 1000
    },
    {
      field: "difficulty",
      customValidator: (value) => {
        if (value && !VALID_DIFFICULTIES.includes(value)) {
          return {
            isValid: false,
            errors: [
              createValidationError(
                "difficulty",
                `Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
                ValidationErrorCode.INVALID_FORMAT
              )
            ]
          };
        }
        return { isValid: true, errors: [] };
      }
    }
  ],
  customValidators: [
    (exercise) => {
      const errors: ValidationError[] = [];

      // Validate muscle groups array
      if (exercise.muscleGroups && Array.isArray(exercise.muscleGroups)) {
        for (const group of exercise.muscleGroups) {
          if (typeof group !== "string" || group.trim().length === 0) {
            errors.push(
              createValidationError(
                "muscleGroups",
                "All muscle groups must be non-empty strings",
                ValidationErrorCode.INVALID_FORMAT
              )
            );
            break;
          }
        }
      }

      // Validate equipment array
      if (exercise.equipment && Array.isArray(exercise.equipment)) {
        for (const item of exercise.equipment) {
          if (typeof item !== "string" || item.trim().length === 0) {
            errors.push(
              createValidationError(
                "equipment",
                "All equipment items must be non-empty strings",
                ValidationErrorCode.INVALID_FORMAT
              )
            );
            break;
          }
        }
      }

      // Validate tags array
      if (exercise.tags && Array.isArray(exercise.tags)) {
        for (const tag of exercise.tags) {
          if (typeof tag !== "string" || tag.trim().length === 0) {
            errors.push(
              createValidationError(
                "tags",
                "All tags must be non-empty strings",
                ValidationErrorCode.INVALID_FORMAT
              )
            );
            break;
          }
        }
      }

      // Validate usage count
      if (exercise.usageCount !== undefined && exercise.usageCount !== null) {
        if (
          typeof exercise.usageCount !== "number" ||
          exercise.usageCount < 0
        ) {
          errors.push(
            createValidationError(
              "usageCount",
              "Usage count must be a non-negative number",
              ValidationErrorCode.INVALID_RANGE
            )
          );
        }
      }

      return { isValid: errors.length === 0, errors };
    }
  ]
};

/**
 * Validates an exercise
 */
export function validateExercise(
  exercise: Partial<EnhancedExercise>
): ValidationResult {
  return validateSchema(exercise, exerciseValidationSchema);
}

// ============================================================================
// Program Validation
// ============================================================================

export const programValidationSchema: ValidationSchema<EnhancedProgram> = {
  fields: [
    {
      field: "name",
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_().,!?'&:]+$/
    },
    {
      field: "description",
      maxLength: 1000
    }
  ],
  customValidators: [
    (program) => {
      const errors: ValidationError[] = [];

      // Challenges don't need blocks (they're generated from challengeConfig)
      if (program.challengeConfig) {
        return { isValid: errors.length === 0, errors };
      }

      // Validate blocks array for non-challenge programs
      if (!program.blocks || !Array.isArray(program.blocks)) {
        errors.push(
          createValidationError(
            "blocks",
            "Program must have blocks array",
            ValidationErrorCode.REQUIRED_FIELD
          )
        );
        return { isValid: false, errors };
      }

      // Non-challenge programs must have at least one block
      if (program.blocks.length === 0) {
        errors.push(
          createValidationError(
            "blocks",
            "Non-challenge programs must have at least one block",
            ValidationErrorCode.INVALID_FORMAT
          )
        );
      }

      // Validate each block
      program.blocks.forEach((block, blockIndex) => {
        const blockErrors = validateProgramBlock(
          block,
          `blocks[${blockIndex}]`
        );
        errors.push(...blockErrors);
      });

      return { isValid: errors.length === 0, errors };
    }
  ]
};

/**
 * Validates a program block
 */
export function validateProgramBlock(
  block: any,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!block || typeof block !== "object") {
    errors.push(
      createValidationError(
        fieldPath,
        "Block must be an object",
        ValidationErrorCode.INVALID_FORMAT
      )
    );
    return errors;
  }

  // Validate block type
  if (!["warmup", "exercise", "rest"].includes(block.type)) {
    errors.push(
      createValidationError(
        `${fieldPath}.type`,
        "Block type must be warmup, exercise, or rest",
        ValidationErrorCode.INVALID_FORMAT
      )
    );
  }

  // Type-specific validation
  switch (block.type) {
    case "warmup":
    case "rest":
      if (typeof block.seconds !== "number" || block.seconds <= 0) {
        errors.push(
          createValidationError(
            `${fieldPath}.seconds`,
            "Warmup and rest blocks must have positive seconds",
            ValidationErrorCode.INVALID_RANGE
          )
        );
      }
      break;

    case "exercise":
      if (
        typeof block.exerciseId !== "string" ||
        block.exerciseId.trim().length === 0
      ) {
        errors.push(
          createValidationError(
            `${fieldPath}.exerciseId`,
            "Exercise blocks must have a valid exerciseId",
            ValidationErrorCode.INVALID_REFERENCE
          )
        );
      }

      if (block.targetReps !== undefined && block.targetReps !== null) {
        if (typeof block.targetReps !== "number" || block.targetReps <= 0) {
          errors.push(
            createValidationError(
              `${fieldPath}.targetReps`,
              "Target reps must be a positive number",
              ValidationErrorCode.INVALID_RANGE
            )
          );
        }
      }

      if (
        block.durationSeconds !== undefined &&
        block.durationSeconds !== null
      ) {
        if (
          typeof block.durationSeconds !== "number" ||
          block.durationSeconds <= 0
        ) {
          errors.push(
            createValidationError(
              `${fieldPath}.durationSeconds`,
              "Duration seconds must be a positive number",
              ValidationErrorCode.INVALID_RANGE
            )
          );
        }
      }

      // Validate sets (must be a positive integer)
      if (block.sets !== undefined && block.sets !== null) {
        if (
          typeof block.sets !== "number" ||
          block.sets < 1 ||
          !Number.isInteger(block.sets)
        ) {
          errors.push(
            createValidationError(
              `${fieldPath}.sets`,
              "Sets must be at least 1",
              ValidationErrorCode.INVALID_RANGE
            )
          );
        }
      }

      // Validate restBetweenSets (must be non-negative)
      if (
        block.restBetweenSets !== undefined &&
        block.restBetweenSets !== null
      ) {
        if (
          typeof block.restBetweenSets !== "number" ||
          block.restBetweenSets < 0
        ) {
          errors.push(
            createValidationError(
              `${fieldPath}.restBetweenSets`,
              "Rest duration must be 0 or greater",
              ValidationErrorCode.INVALID_RANGE
            )
          );
        }
      }
      break;
  }

  return errors;
}

/**
 * Validates a program
 */
export function validateProgram(
  program: Partial<EnhancedProgram>
): ValidationResult {
  return validateSchema(program, programValidationSchema);
}

// ============================================================================
// Challenge Validation
// ============================================================================

/**
 * Validates challenge configuration
 */
export function validateChallengeConfig(
  config: Partial<ChallengeConfig>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate exerciseId - must be non-empty string with non-whitespace content
  if (
    !config.exerciseId ||
    typeof config.exerciseId !== "string" ||
    config.exerciseId.trim().length === 0
  ) {
    errors.push(
      createValidationError(
        "exerciseId",
        "Challenge must have a valid exercise ID",
        ValidationErrorCode.INVALID_REFERENCE
      )
    );
  }

  if (
    config.sets === null ||
    typeof config.sets !== "number" ||
    config.sets <= 0 ||
    !Number.isInteger(config.sets)
  ) {
    errors.push(
      createValidationError(
        "sets",
        "Sets must be a positive integer",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  if (
    config.targetReps === null ||
    typeof config.targetReps !== "number" ||
    config.targetReps <= 0 ||
    !Number.isInteger(config.targetReps)
  ) {
    errors.push(
      createValidationError(
        "targetReps",
        "Target reps must be a positive integer",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  if (
    config.warmUpSeconds === null ||
    typeof config.warmUpSeconds !== "number" ||
    config.warmUpSeconds < 0
  ) {
    errors.push(
      createValidationError(
        "warmUpSeconds",
        "Warm up seconds must be a non-negative number",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  if (
    config.breakSeconds === null ||
    typeof config.breakSeconds !== "number" ||
    config.breakSeconds < 0
  ) {
    errors.push(
      createValidationError(
        "breakSeconds",
        "Break seconds must be a non-negative number",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  // Validate weekly increase percentage
  const weeklyIncreasePercent = config.weeklyIncreasePercent;
  if (
    weeklyIncreasePercent !== undefined &&
    weeklyIncreasePercent !== null &&
    (typeof weeklyIncreasePercent !== "number" ||
      weeklyIncreasePercent <= 0 ||
      weeklyIncreasePercent > 100 ||
      !Number.isInteger(weeklyIncreasePercent))
  ) {
    errors.push(
      createValidationError(
        "weeklyIncreasePercent",
        "Weekly increase percent must be between 1 and 100",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  // Handle explicit null values for weeklyIncreasePercent
  if (config.weeklyIncreasePercent === null) {
    errors.push(
      createValidationError(
        "weeklyIncreasePercent",
        "Weekly increase percent must be between 1 and 100",
        ValidationErrorCode.INVALID_RANGE
      )
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a challenge
 */
export function validateChallenge(
  challenge: Partial<EnhancedChallenge>
): ValidationResult {
  // First validate as a program
  const programResult = validateProgram(challenge);

  // Then validate challenge-specific fields
  if (challenge.challengeConfig) {
    const configResult = validateChallengeConfig(challenge.challengeConfig);
    programResult.errors.push(...configResult.errors);
    programResult.isValid = programResult.isValid && configResult.isValid;
  } else {
    programResult.errors.push(
      createValidationError(
        "challengeConfig",
        "Challenge must have challenge configuration",
        ValidationErrorCode.REQUIRED_FIELD
      )
    );
    programResult.isValid = false;
  }

  return programResult;
}

// ============================================================================
// Dependency Validation
// ============================================================================

/**
 * Checks if an exercise can be safely deleted
 */
export function checkExerciseDependencies(
  exerciseId: string,
  programs: Program[]
): DependencyResult {
  const dependentPrograms: Program[] = [];
  const warnings: string[] = [];

  for (const program of programs) {
    const hasReference = program.blocks.some(
      (block) => block.type === "exercise" && block.exerciseId === exerciseId
    );

    if (hasReference) {
      dependentPrograms.push(program);
    }

    // Check challenge config
    if (program.challengeConfig?.exerciseId === exerciseId) {
      dependentPrograms.push(program);
    }
  }

  if (dependentPrograms.length > 0) {
    warnings.push(
      `This exercise is used by ${dependentPrograms.length} program(s): ${dependentPrograms.map((p) => p.name).join(", ")}`
    );
  }

  return {
    canDelete: dependentPrograms.length === 0,
    dependentPrograms,
    dependentChallenges: dependentPrograms.filter((p) =>
      Boolean(p.challengeConfig)
    ),
    activeSessions: [], // Would need session data to populate this
    warnings
  };
}

/**
 * Validates that all exercise references in a program exist
 */
export function validateExerciseReferences(
  program: Program,
  exercises: Exercise[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const exerciseIds = new Set(exercises.map((e) => e.id));

  // Check challenge config exercise reference
  if (
    program.challengeConfig?.exerciseId &&
    !exerciseIds.has(program.challengeConfig.exerciseId)
  ) {
    errors.push(
      createValidationError(
        "challengeConfig.exerciseId",
        `Challenge references non-existent exercise: ${program.challengeConfig.exerciseId}`,
        ValidationErrorCode.INVALID_REFERENCE
      )
    );
  }

  // Check block exercise references
  program.blocks.forEach((block, blockIndex) => {
    if (block.type === "exercise" && !exerciseIds.has(block.exerciseId)) {
      errors.push(
        createValidationError(
          `blocks[${blockIndex}].exerciseId`,
          `Program references non-existent exercise: ${block.exerciseId}`,
          ValidationErrorCode.INVALID_REFERENCE
        )
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a name is unique within a collection
 */
export function validateUniqueName<T extends { name: string; id: string }>(
  name: string,
  currentId: string | undefined,
  collection: T[]
): ValidationResult {
  const duplicate = collection.find(
    (item) =>
      item.name.toLowerCase() === name.toLowerCase() && item.id !== currentId
  );

  if (duplicate) {
    return {
      isValid: false,
      errors: [
        createValidationError(
          "name",
          `Name "${name}" is already in use`,
          ValidationErrorCode.DUPLICATE_NAME
        )
      ]
    };
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates that a source allows modification
 */
export function validateModificationPermissions(
  source: "builtin" | "user",
  operation: "edit" | "delete"
): ValidationResult {
  if (source === "builtin") {
    return {
      isValid: false,
      errors: [
        createValidationError(
          "source",
          `Built-in items cannot be ${operation}ed`,
          ValidationErrorCode.INSUFFICIENT_PERMISSIONS
        )
      ]
    };
  }

  return { isValid: true, errors: [] };
}
