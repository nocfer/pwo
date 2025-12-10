export const theme = {
  colors: {
    background: "#F1F5F9", // slate-100, slightly warmer
    surface: "#FFFFFF",
    text: "#0F172A", // slate-900
    subtext: "#334155", // slate-700
    muted: "#64748B", // slate-500
    border: "#E2E8F0", // slate-200
    primary: "#3B82F6", // blue-500, slightly lighter for soft feel
    primaryDark: "#2563EB", // blue-600
    primaryLight: "#DBEAFE", // blue-100
    primaryTextOn: "#FFFFFF",
    accent: "#ffd33d", // keep project accent
    card: "#F8FAFC", // slate-50
    success: "#22C55E", // green-500
    successLight: "#DCFCE7", // green-100
    danger: "#EF4444", // red-500
    dangerLight: "#FEE2E2", // red-100
    warning: "#F59E0B", // amber-500
    warningLight: "#FEF3C7", // amber-100
    // Phase palette for workout states
    phases: {
      warmup: "#EA580C", // orange-600
      warmupBg: "#FFF7ED", // orange-50
      working: "#7C3AED", // violet-600
      workingBg: "#F5F3FF", // violet-50
      break: "#06B6D4", // cyan-500
      breakBg: "#ECFEFF", // cyan-50
      done: "#22C55E", // green-500
      doneBg: "#F0FDF4", // green-50
    },
    // Gradient colors
    gradient: {
      primaryStart: "#3B82F6", // blue-500
      primaryEnd: "#8B5CF6", // violet-500
      warmStart: "#F97316", // orange-500
      warmEnd: "#EF4444", // red-500
      successStart: "#22C55E", // green-500
      successEnd: "#14B8A6", // teal-500
    },
    overlayGlass: "#FFFFFFEE",
    skeleton: "#E2E8F0", // slate-200
    skeletonHighlight: "#F1F5F9", // slate-100
  },
  fonts: {
    regular: "DMSans_400Regular",
    medium: "DMSans_500Medium",
    semiBold: "DMSans_600SemiBold",
    bold: "DMSans_700Bold",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#64748B",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: "#64748B",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: "#64748B",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      elevation: 4,
    },
  },
  typography: {
    h1: {
      fontSize: 28,
      fontFamily: "DMSans_700Bold",
      lineHeight: 34,
    },
    h2: {
      fontSize: 22,
      fontFamily: "DMSans_600SemiBold",
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontFamily: "DMSans_600SemiBold",
      lineHeight: 24,
    },
    body: {
      fontSize: 15,
      fontFamily: "DMSans_400Regular",
      lineHeight: 22,
    },
    bodyBold: {
      fontSize: 15,
      fontFamily: "DMSans_600SemiBold",
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      lineHeight: 18,
    },
  },
} as const;
