const colors = {
  // Core surfaces — dark-first "electric" palette (aligned to redesign spec)
  background: '#0A0B0E',
  surface: '#14161B',
  surfaceElevated: '#1C1D24', // ≈ #1c1e25 — also the neutral built-in badge fill
  inset: '#0E0F13', // recessed input / segmented-control bg
  text: '#F2F3F5',
  textInverse: '#0A0B0E',
  subtext: '#9A9DAB',
  muted: '#6B6E7A',
  faint: '#5B5E6B', // faintest text — section labels
  border: '#23262F',
  borderLight: '#2A2B36',
  borderActive: '#2C3424', // active/selected card border (lime-tinted)

  // Brand — electric lime, bright on dark backgrounds
  primary: '#C6F24E',
  primaryDark: '#AEDB37',
  primaryLight: 'rgba(198, 242, 78, 0.12)',
  primaryMuted: 'rgba(198, 242, 78, 0.25)',
  primaryGlow: 'rgba(198, 242, 78, 0.6)', // lime glow for shadows/scan line
  primaryTint: '#1B1E14', // solid lime tint — badges / selected rows
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
  danger: '#FB7185',
  dangerLight: 'rgba(251, 113, 133, 0.12)',
  dangerTint: '#241317', // danger toolbar / destructive chip fill
  dangerBorder: '#3A2226',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.12)',
  // Offline banner surface (amber on near-black)
  offlineBg: '#1E1A10',
  offlineBorder: '#3A3322',

  // Exercise category accents — icon tiles + category chips
  category: {
    strength: '#C6F24E',
    strengthBg: 'rgba(198, 242, 78, 0.12)',
    cardio: '#56E0F0',
    cardioBg: 'rgba(86, 224, 240, 0.1)',
    flexibility: '#FBBF24',
    flexibilityBg: 'rgba(251, 191, 36, 0.12)',
    skill: '#34D399',
    skillBg: 'rgba(52, 211, 153, 0.12)'
  },

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

  // Elevated overlay surface — sheets, toasts, elevated cards (spec "elevated").
  // Distinct from surfaceElevated (#1C1D24); matches session.elevated.
  surfaceOverlay: '#1A1D24',
  // Disabled fill for buttons / chips (spec #1c1e25). Dark, recessed, inert.
  disabledBg: '#1C1E25',

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
    controlBg: '#23262F',
    // inline editor
    editorBorder: '#2C303B',
    editorScrim: 'rgba(5, 6, 8, 0.62)',
    doneBtnBg: '#2A2E38',
    // rest sheet
    ringTrack: '#1A1E24'
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
  chip: 10, // chips / small pills (spec control/chip 10–14)
  md: 12, // controls — inputs, stepper, segmented
  lg: 16,
  card: 18, // cards / list rows (spec card 16–18)
  xl: 20,
  sheet: 26, // bottom-sheet top corners
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
  },
  // Sheets / modals — deep ambient lift (spec 0 28px 60px rgba(0,0,0,.6)).
  lg: {
    elevation: 16,
    boxShadow: '0 28px 60px rgba(0, 0, 0, 0.6)'
  }
} as const

// Motion tokens — the single source for every timing, easing and spring in the
// app. Components must gate animations behind useReducedMotion(); these are the
// values to use when motion is allowed. lib/motion.ts turns these into the
// concrete Reanimated presets — never hand-write durations/curves in a component.
const motion = {
  // Duration scale (ms). instant→celebrate escalates with the weight of the
  // change; loop durations drive the only two idle animations (glow, shimmer).
  duration: {
    instant: 80, // micro state flips (toggle, checkbox)
    fast: 150, // press, tab/segment crossfade
    base: 240, // sheet/bar/banner/toast enter, list layout shift
    slow: 350, // larger surface transitions
    celebrate: 600, // success pop / celebration
    glowLoop: 2600, // active "log now" glow pulse (idle-allowed)
    shimmerLoop: 1600 // skeleton shimmer sweep (loading-only)
  },
  // Easing control points — bezier tuples, kept dependency-free so theme.ts
  // imports no animation lib. lib/motion.ts feeds these to Easing.bezier(...).
  easing: {
    standard: [0.4, 0, 0.2, 1], // most transitions
    decelerate: [0, 0, 0.2, 1] // enters / sheets (ease-out)
  },
  // Spring for pops / success (Reanimated withSpring).
  spring: { damping: 14, stiffness: 180 },
  pressScale: 0.94, // pressed-state shrink for buttons / rows / chips
  // Semantic aliases onto the scale — existing call sites keep their names.
  durationSheet: 350, // → slow: bottom-sheet slide-up / backdrop fade
  durationToast: 240, // → base: toast slide-in
  durationBanner: 240 // → base: banner slide-down
} as const

const typography = {
  display: {
    fontSize: 32,
    fontFamily: fonts.display,
    lineHeight: 38,
    letterSpacing: -0.8
  },
  // Big tabular numeral — StatTile values, headline metrics (Space Grotesk 700).
  numeral: {
    fontSize: 40,
    fontFamily: fonts.display,
    lineHeight: 44,
    letterSpacing: -1
  },
  // Compact numeral — inline stepper / number-field values (Space Grotesk).
  metric: {
    fontSize: 18,
    fontFamily: fonts.display,
    lineHeight: 22,
    letterSpacing: -0.3
  },
  // Section / sheet heading (Space Grotesk 700 · 22) — spec "headings 22/700".
  heading: {
    fontSize: 22,
    fontFamily: fonts.display,
    lineHeight: 28,
    letterSpacing: -0.4
  },
  // Tracked uppercase label above groups (spec section label 10/600/1.4).
  // Apply textTransform: 'uppercase' at the component.
  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    lineHeight: 14,
    letterSpacing: 1.4
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
  motion,
  typography,
  cards,
  presets
} as const
