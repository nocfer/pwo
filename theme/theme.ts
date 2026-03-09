const colors = {
  // Core surfaces — dark-first palette
  background: '#0B0C10',
  surface: '#14151A',
  surfaceElevated: '#1C1D24',
  text: '#ECEDF0',
  textInverse: '#0B0C10',
  subtext: '#8C8EA0',
  muted: '#53556A',
  border: '#1F2029',
  borderLight: '#2A2B36',

  // Brand — indigo-400 tuned for dark backgrounds
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: 'rgba(129, 140, 248, 0.12)',
  primaryMuted: 'rgba(129, 140, 248, 0.25)',
  primaryTextOn: '#FFFFFF',

  // Accent — amber-400
  accent: '#FBBF24',
  accentLight: 'rgba(251, 191, 36, 0.12)',

  // Status
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.12)',
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.12)',

  // Phase palette — solid hex pre-computed against surface #14151A
  phases: {
    warmup: '#FB923C',
    warmupBg: '#1D1813',
    working: '#818CF8',
    workingBg: '#1B1B28',
    break: '#22D3EE',
    breakBg: '#151D20',
    done: '#34D399',
    doneBg: '#161E1B'
  },

  overlayGlass: 'rgba(20, 21, 26, 0.95)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1C1D24',
  skeletonHighlight: '#2A2B36'
} as const

const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold'
} as const

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40
} as const

const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999
} as const

const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
    boxShadow: 'none'
  },
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  }
} as const

const typography = {
  display: {
    fontSize: 32,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 38,
    letterSpacing: -0.8
  },
  h1: {
    fontSize: 24,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 30,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 18,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 24,
    letterSpacing: -0.3
  },
  body: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 24,
    letterSpacing: 0
  },
  bodyBold: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 24,
    letterSpacing: 0
  },
  caption: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 18,
    letterSpacing: 0.2
  },
  small: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 14,
    letterSpacing: 0.3
  }
} as const

const cards = {
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  bordered: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg
  }
} as const

const presets = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },

  cardBordered: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg
  },

  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const
  },

  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const
  },

  screenContainer: {
    flex: 1,
    backgroundColor: colors.background
  },

  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2
  },

  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.md
  },

  buttonPrimary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonPrimaryDisabled: {
    opacity: 0.5
  },
  buttonPrimaryText: {
    ...typography.bodyBold,
    color: colors.primaryTextOn
  },

  buttonSecondary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.surfaceElevated
  },
  buttonSecondaryText: {
    ...typography.bodyBold,
    color: colors.text
  },

  buttonGhost: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  buttonGhostPressed: {
    opacity: 0.7
  },
  buttonGhostText: {
    ...typography.bodyBold,
    color: colors.primary
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.96 }]
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
    ...typography.body
  },
  inputFocused: {
    borderColor: colors.primary
  },

  textMuted: {
    ...typography.body,
    color: colors.muted
  },

  captionMuted: {
    ...typography.caption,
    color: colors.muted
  },

  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight
  },
  chipText: {
    ...typography.caption,
    fontFamily: fonts.semiBold,
    color: colors.primary
  },

  sessionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  sessionRowPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.98 }]
  },
  sessionRowCompleted: {
    backgroundColor: colors.successLight
  },
  sessionRowLocked: {
    opacity: 0.5
  },

  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  listItemPressed: {
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 0.98 }]
  },

  divider: {
    height: 1,
    backgroundColor: colors.border
  }
} as const

export const theme = {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
  typography,
  cards,
  presets
} as const
