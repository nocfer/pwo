const colors = {
  // Neutral palette - refined slate with better contrast
  background: "#F8FAFC", // slate-50 - subtle warmth
  surface: "#FFFFFF",
  text: "#0F172A", // slate-900 - deeper for better readability
  subtext: "#475569", // slate-600
  muted: "#94A3B8", // slate-400 - softer for secondary text
  border: "#E2E8F0", // slate-200
  borderLight: "#F1F5F9", // slate-100 - for subtle dividers
  card: "#FFFFFF", // pure white for cards

  // Primary palette - sophisticated indigo
  primary: "#6366F1", // indigo-500 - vibrant but professional
  primaryDark: "#4F46E5", // indigo-600
  primaryLight: "#EEF2FF", // indigo-50
  primaryMuted: "#C7D2FE", // indigo-200
  primaryTextOn: "#FFFFFF",

  // Accent - refined amber
  accent: "#F59E0B", // amber-500
  accentLight: "#FEF3C7", // amber-100

  // Status colors - refined and cohesive
  success: "#10B981", // emerald-500
  successLight: "#D1FAE5", // emerald-100
  danger: "#EF4444", // red-500
  dangerLight: "#FEE2E2", // red-100
  warning: "#F59E0B", // amber-500
  warningLight: "#FEF3C7", // amber-100

  // Phase palette for workout states
  phases: {
    warmup: "#F97316", // orange-500
    warmupBg: "#FFF7ED", // orange-50
    working: "#6366F1", // indigo-500
    workingBg: "#EEF2FF", // indigo-50
    break: "#06B6D4", // cyan-500
    breakBg: "#ECFEFF", // cyan-50
    done: "#10B981", // emerald-500
    doneBg: "#D1FAE5" // emerald-100
  },

  // Gradient colors
  gradient: {
    primaryStart: "#6366F1", // indigo-500
    primaryEnd: "#8B5CF6", // violet-500
    warmStart: "#F97316", // orange-500
    warmEnd: "#EF4444", // red-500
    successStart: "#10B981", // emerald-500
    successEnd: "#14B8A6" // teal-500
  },

  overlayGlass: "#FFFFFFF5",
  overlay: "rgba(15, 23, 42, 0.5)", // slate-900 with opacity
  skeleton: "#E2E8F0",
  skeletonHighlight: "#F1F5F9"
} as const;

const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold"
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999
} as const;

const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
    boxShadow: "none"
  },
  sm: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
  },
  md: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)"
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)"
  }
};

const typography = {
  h1: {
    fontSize: 26,
    fontFamily: "Manrope_700Bold",
    lineHeight: 32,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 20,
    fontFamily: "Manrope_600SemiBold",
    lineHeight: 26,
    letterSpacing: -0.3
  },
  h3: {
    fontSize: 17,
    fontFamily: "Manrope_600SemiBold",
    lineHeight: 22
  },
  body: {
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    lineHeight: 22
  },
  bodyBold: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    lineHeight: 22
  },
  caption: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    lineHeight: 18
  },
  captionBold: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    lineHeight: 18
  },
  small: {
    fontSize: 11,
    fontFamily: "Manrope_500Medium",
    lineHeight: 14
  }
} as const;

const cards = {
  // Standard card container
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  // Card with border
  bordered: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  // Elevated card
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md
  },
  focus: {
    container: {
      marginTop: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      ...shadows.md
    },
    topRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md
    },
    icons: {
      sm: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center"
      }
    },
    chipText: {
      ...typography.caption,
      fontFamily: fonts.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }
} as const;

// Reusable style presets to avoid duplication
const presets = {
  // Standard card container
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },

  // Card with border (no shadow)
  cardBordered: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg
  },

  // Row with space-between
  rowBetween: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const
  },

  // Row with items centered
  rowCenter: {
    flexDirection: "row" as const,
    alignItems: "center" as const
  },

  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background
  },

  // Screen content with padding
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2
  },

  // Section header
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: spacing.md
  },

  // Primary button style
  buttonPrimary: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm
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

  // Secondary button style
  buttonSecondary: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.background
  },
  buttonSecondaryText: {
    ...typography.bodyBold,
    color: colors.text
  },

  // Ghost button style
  buttonGhost: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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

  // Icon button
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconButtonPressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.96 }]
  },

  // Input field
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body
  },
  inputFocused: {
    borderColor: colors.primary
  },

  // Muted text
  textMuted: {
    ...typography.body,
    color: colors.muted
  },

  // Caption muted
  captionMuted: {
    ...typography.caption,
    color: colors.muted
  },

  // Chip/badge
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

  // Session row base
  sessionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  sessionRowPressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.98 }]
  },
  sessionRowCompleted: {
    backgroundColor: colors.successLight
  },
  sessionRowLocked: {
    opacity: 0.5
  },

  // List item
  listItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  listItemPressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.98 }]
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border
  }
} as const;

export const theme = {
  colors,
  fonts,
  spacing,
  radius,
  shadows,
  typography,
  cards,
  presets
} as const;
