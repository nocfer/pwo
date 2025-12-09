export const theme = {
  colors: {
    background: "#F8FAFC", // slate-50
    surface: "#FFFFFF",
    text: "#0F172A", // slate-900
    subtext: "#334155", // slate-700
    muted: "#64748B", // slate-500
    border: "#E2E8F0", // slate-200
    primary: "#2563EB", // blue-600
    primaryTextOn: "#FFFFFF",
    accent: "#ffd33d", // keep project accent
    card: "#F1F5F9", // slate-100
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#F59E0B",
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
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
  },
  typography: {
    title: 20,
    subtitle: 16,
    body: 14,
    caption: 12,
  },
} as const;
