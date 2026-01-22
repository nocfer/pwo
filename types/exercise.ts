/**
 * Exercise model (user-managed library)
 */

export type ExerciseSource = 'builtin' | 'user' | 'pt'

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'skill'

export type Exercise = {
  id: string
  name: string
  category?: ExerciseCategory
  /**
   * Ionicons glyph name (e.g. "barbell", "walk", "fitness")
   * Stored as string to keep the model platform-agnostic.
   */
  icon?: string
  description?: string | undefined
  source: ExerciseSource
  instructions?: string | undefined
  media?: string | undefined
  createdBy?: string
  createdAt: string // ISO
  updatedAt: string // ISO
  deletedAt?: string | undefined
}
