/**
 * Source-badge presentation helper — maps an item's source (user / pt / builtin)
 * to its label, accent color, fill, optional border, and whether to show a lock
 * glyph. Shared by Library program cards and exercise rows so the
 * Custom / Coach / Built-in coding stays consistent.
 */

import { theme } from '@/theme/theme'

export type ItemSource = 'builtin' | 'user' | 'pt'

type SourceBadge = {
  label: string
  color: string
  bg: string
  /** Optional border color (used for the Custom badge's lime hairline). */
  border?: string
  /** Built-in items show a small lock glyph. */
  locked: boolean
}

const SOURCE_BADGES: Record<ItemSource, SourceBadge> = {
  user: {
    label: 'Custom',
    color: theme.colors.primary,
    bg: theme.colors.primaryTint,
    border: theme.colors.borderActive,
    locked: false
  },
  pt: {
    label: 'Coach',
    color: theme.colors.info,
    bg: theme.colors.infoLight,
    locked: false
  },
  builtin: {
    label: 'Built-in',
    color: theme.colors.subtext,
    bg: theme.colors.surfaceElevated,
    locked: true
  }
}

export function getSourceBadge(source: ItemSource): SourceBadge {
  return SOURCE_BADGES[source] ?? SOURCE_BADGES.builtin
}
