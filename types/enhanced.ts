/**
 * Enhanced data models for the data management reorganization
 * Extends existing types with additional metadata and validation support
 */

import type {
  ChallengeConfig,
  Exercise,
  ExerciseCategory,
  Program
} from './index'

// ============================================================================
// Enhanced Exercise Model
// ============================================================================

export interface EnhancedExercise extends Exercise {
  description?: string
  instructions?: string
  muscleGroups?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  equipment?: string[]
  tags?: string[]
  usageCount?: number
  lastUsed?: string
}

// ============================================================================
// Enhanced Program Model
// ============================================================================

export interface EnhancedProgram extends Program {
  thumbnail?: string
  usageCount?: number
  lastUsed?: string
  averageRating?: number
}

// ============================================================================
// Enhanced Challenge Model
// ============================================================================

export interface EnhancedChallengeConfig extends ChallengeConfig {
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: number // days
  progressionType?: 'linear' | 'percentage'
  tags?: string[]
}

export interface EnhancedChallenge extends Program {
  challengeConfig: EnhancedChallengeConfig
  participantCount?: number
  completionRate?: number
}

// ============================================================================
// Validation Schema Types
// ============================================================================

export type ValidationResult = {
  isValid: boolean
  errors: ValidationError[]
}

export type ValidationError = {
  field: string
  message: string
  code: ValidationErrorCode
  severity: 'error' | 'warning' | 'info'
}

export enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  DEPENDENCY_EXISTS = 'DEPENDENCY_EXISTS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  INVALID_ICON = 'INVALID_ICON'
}

export type CustomValidator<T> = (value: T) => ValidationResult

export type FieldValidation<T> = {
  field: keyof T
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: any) => ValidationResult
}

export type ValidationSchema<T> = {
  fields: FieldValidation<T>[]
  customValidators?: CustomValidator<T>[]
}

// ============================================================================
// Dependency Checking Types
// ============================================================================

export type DependencyCheck = {
  canDelete: boolean
  dependencies: {
    programs?: Program[]
    challenges?: Program[]
  }
  warnings: string[]
}

export type DependencyResult = {
  canDelete: boolean
  dependentPrograms: Program[]
  dependentChallenges: Program[]
  warnings: string[]
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export type DataType = 'exercises' | 'programs' | 'challenges'

export type SearchState = {
  query: string
  filters: {
    category?: ExerciseCategory[]
    source?: ('builtin' | 'user' | 'pt' | 'pt')[]
    difficulty?: string[]
    tags?: string[]
    dateRange?: DateRange
  }
  sortBy: 'name' | 'created' | 'updated' | 'usage'
  sortOrder: 'asc' | 'desc'
}

export type DateRange = {
  start: string // ISO date string
  end: string // ISO date string
}

// ============================================================================
// Import/Export Types
// ============================================================================

export type ImportData = {
  type: DataType
  version: string
  data: any[]
  metadata?: Record<string, any>
}

export type ImportResult = {
  success: boolean
  imported: ImportedItem[]
  skipped: SkippedItem[]
  errors: ImportError[]
  conflicts: ConflictResolution[]
}

export type ImportedItem = {
  id: string
  name: string
  type: DataType
  action: 'created' | 'updated'
}

export type SkippedItem = {
  name: string
  type: DataType
  reason: string
}

export type ImportError = {
  item: any
  reason: string
  code: ImportErrorCode
  recoverable: boolean
}

export enum ImportErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_DEPENDENCIES = 'MISSING_DEPENDENCIES',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DUPLICATE_ID = 'DUPLICATE_ID',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export type ConflictResolution = {
  itemId: string
  itemName: string
  conflictType: 'name_conflict' | 'id_conflict' | 'data_conflict'
  resolution: 'merge' | 'replace' | 'skip'
  details?: Record<string, any>
}

// ============================================================================
// Enhanced Data Context Types
// ============================================================================

export type EnhancedDataActions = {
  // Placeholder — dead actions removed in story 0.2
}

export type EnhancedDataState = {
  // Placeholder — dead state fields removed in story 0.2
}
