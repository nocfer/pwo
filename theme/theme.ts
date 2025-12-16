const colors = {
  // Neutral palette - refined slate with better contrast
  background: "#FAFBFC", // softer, more neutral background
  surface: "#FFFFFF",
  text: "#1A1F2E", // deeper, richer black for better readability
  subtext: "#475569", // slate-600 - better contrast than slate-700
  muted: "#64748B", // slate-500
  border: "#E2E8F0", // slate-200
  card: "#F8FAFC", // slate-50

  // Primary palette - sophisticated indigo/blue
  primary: "#4F46E5", // indigo-600 - more professional than bright blue
  primaryDark: "#4338CA", // indigo-700
  primaryLight: "#EEF2FF", // indigo-50
  primaryTextOn: "#FFFFFF",

  // Accent - refined gold/amber
  accent: "#F59E0B", // amber-500 - more professional than bright yellow

  // Status colors - refined and cohesive
  success: "#10B981", // emerald-500 - more sophisticated green
  successLight: "#D1FAE5", // emerald-100
  danger: "#EF4444", // red-500
  dangerLight: "#FEE2E2", // red-100
  warning: "#F59E0B", // amber-500
  warningLight: "#FEF3C7", // amber-100

  // Phase palette for workout states - more cohesive and professional
  phases: {
    warmup: "#F97316", // orange-500 - slightly softer
    warmupBg: "#FFF7ED", // orange-50
    working: "#6366F1", // indigo-500 - matches primary theme
    workingBg: "#EEF2FF", // indigo-50
    break: "#0891B2", // cyan-600 - deeper, more professional
    breakBg: "#ECFEFF", // cyan-50
    done: "#10B981", // emerald-500 - matches success
    doneBg: "#D1FAE5" // emerald-100
  },

  // Gradient colors - refined and cohesive
  gradient: {
    primaryStart: "#4F46E5", // indigo-600
    primaryEnd: "#7C3AED", // violet-600 - complementary
    warmStart: "#F97316", // orange-500
    warmEnd: "#EF4444", // red-500
    successStart: "#10B981", // emerald-500
    successEnd: "#14B8A6" // teal-500
  },

  overlayGlass: "#FFFFFFF5", // slightly more opaque
  skeleton: "#E2E8F0", // slate-200
  skeletonHighlight: "#F1F5F9" // slate-100
} as const;

const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semiBold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold"
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
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999
} as const;

const shadows = {
  sm: {
    shadowColor: "#64748B",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1
  },
  md: {
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2
  },
  lg: {
    shadowColor: "#64748B",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4
  }
};

const typography = {
  h1: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    lineHeight: 34
  },
  h2: {
    fontSize: 22,
    fontFamily: "DMSans_600SemiBold",
    lineHeight: 28
  },
  h3: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    lineHeight: 24
  },
  body: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22
  },
  bodyBold: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    lineHeight: 22
  },
  caption: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    lineHeight: 18
  }
} as const;

const cards = {
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
        borderRadius: radius.md,
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
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
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

  // Primary button style
  buttonPrimary: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    ...shadows.md
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonPrimaryDisabled: {
    opacity: 0.6
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
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  buttonSecondaryPressed: {
    backgroundColor: colors.card
  },
  buttonSecondaryText: {
    ...typography.bodyBold,
    color: colors.text
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

  // Session row base
  sessionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  sessionRowPressed: {
    backgroundColor: colors.background,
    transform: [{ scale: 0.98 }]
  },
  sessionRowCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.successLight
  },
  sessionRowLocked: {
    opacity: 0.6
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
