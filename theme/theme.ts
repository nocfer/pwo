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

  // Brand — electric lime, bright on dark backgrounds
  primary: '#C6F24E',
  primaryDark: '#AEDB37',
  primaryLight: 'rgba(198, 242, 78, 0.12)',
  primaryMuted: 'rgba(198, 242, 78, 0.25)',
  primaryTextOn: '#0A0B0E', // ⚠ dark: lime is a light color, content on a primary fill must be dark

  // Accent — amber-400 (supporting role: streak/flame)
  accent: '#FBBF24',
  accentLight: 'rgba(251, 191, 36, 0.12)',

  // Info — cyan (timers / rest / informational)
  info: '#56E0F0',
  infoLight: 'rgba(86, 224, 240, 0.12)',

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
    working: '#C6F24E',
    workingBg: '#1B1E14',
    break: '#56E0F0',
    breakBg: '#151D20',
    done: '#34D399',
    doneBg: '#161E1B'
  },

  // Consistency-heatmap intensity ramp — none → peak (lime). Shared design token.
  heatmap: ['#16181E', '#1F3A2A', '#246B45', '#34D399', '#C6F24E'],

  overlayGlass: 'rgba(20, 21, 26, 0.95)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1C1D24',
  skeletonHighlight: '#2A2B36',

  // Workout Session ("Flow") redesign palette — scoped to the session screen.
  // Centralized here so session components stay free of literal hex.
  session: {
    // surfaces
    appBg: '#0A0B0E',
    backdrop: '#060708',
    panel: '#14161B',
    elevated: '#1A1D24',
    hairline: '#23262F',
    activeBorder: '#2C3424',
    // text
    textPrimary: '#F2F3F5',
    subtext: '#9A9DAB',
    muted: '#6B6E7A',
    faint: '#5B5E6B',
    // lime (primary/active)
    lime: '#C6F24E',
    onLime: '#0A0B0E',
    limeTintBg: '#1B1E14',
    limeMutedText: '#9AA86A',
    // cyan (rest/info)
    cyan: '#56E0F0',
    cyanPanel: '#0C1416',
    cyanBorder: '#163038',
    cyanControlBg: '#11181C',
    cyanControlBorder: '#1D2933',
    // green (completed)
    green: '#34D399',
    greenTintBg: '#0E1411',
    greenCheckBg: '#1C2A22',
    onGreen: '#06241A',
    // danger
    danger: '#FB7185',
    dangerTintBg: '#241317',
    dangerEditorBg: '#1F1417',
    dangerBorder: '#3A2226',
    // skipped
    skippedText: '#5B5E6B',
    skippedNum: '#4D505C',
    // component-specific
    badgeUpNextBg: '#181A20',
    collapsedDoneBorder: '#18241D',
    collapsedPendingBg: '#101116',
    collapsedPendingBorder: '#1C1E25',
    chevronBg: '#181A20',
    chevronIcon: '#8A8D99',
    pendingCheckBorder: '#2A2D36',
    addSetBorder: '#2F3A26',
    trackBg: '#16181E',
    completedValue: '#7C8A82',
    completedNum: '#6B6E7A',
    controlBg: '#23262F'
  }
} as const

const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  // Space Grotesk — numerals, metrics, big headings
  display: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_600SemiBold'
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
    elevation: 0,
    boxShadow: 'none'
  },
  sm: {
    elevation: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  }
} as const

const typography = {
  display: {
    fontSize: 32,
    fontFamily: fonts.display,
    lineHeight: 38,
    letterSpacing: -0.8
  },
  h1: {
    fontSize: 24,
    fontFamily: fonts.displayMed,
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
