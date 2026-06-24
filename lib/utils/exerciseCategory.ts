/**
 * Exercise-category presentation helpers — maps a category to its accent
 * color + tint and a representative icon. Centralizes the lime/cyan/amber/green
 * coding used by Library exercise rows, filter chips, and the program builder.
 */

import { theme } from '@/theme/theme'
import type { ExerciseCategory } from '@/types'

type CategoryColors = {
  /** Accent color (icon glyph + chip text). */
  color: string
  /** Tint background (icon tile + chip fill). */
  bg: string
}

const CATEGORY_COLORS: Record<ExerciseCategory, CategoryColors> = {
  strength: {
    color: theme.colors.category.strength,
    bg: theme.colors.category.strengthBg
  },
  cardio: {
    color: theme.colors.category.cardio,
    bg: theme.colors.category.cardioBg
  },
  flexibility: {
    color: theme.colors.category.flexibility,
    bg: theme.colors.category.flexibilityBg
  },
  skill: {
    color: theme.colors.category.skill,
    bg: theme.colors.category.skillBg
  }
}

/** Neutral fallback for exercises without a recognized category. */
const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  color: theme.colors.subtext,
  bg: theme.colors.surfaceElevated
}

export function getCategoryColors(category?: string): CategoryColors {
  if (category && category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as ExerciseCategory]
  }
  return DEFAULT_CATEGORY_COLORS
}

/** Title-cases a category key for display (e.g. "strength" → "Strength"). */
export function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
