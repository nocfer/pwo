import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "search" | "progress" | "history";
  style?: ViewStyle;
};

const variantConfig = {
  default: {
    icon: "barbell-outline" as const,
    iconColor: theme.colors.primary,
    iconBg: theme.colors.primaryLight
  },
  search: {
    icon: "search-outline" as const,
    iconColor: theme.colors.muted,
    iconBg: theme.colors.background
  },
  progress: {
    icon: "trending-up-outline" as const,
    iconColor: theme.colors.success,
    iconBg: theme.colors.successLight
  },
  history: {
    icon: "time-outline" as const,
    iconColor: theme.colors.accent,
    iconBg: theme.colors.accentLight
  }
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  style
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const iconName = icon || config.icon;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
        <Ionicons name={iconName} size={28} color={config.iconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Pre-built empty states
export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

export function NoProgressEmpty() {
  return (
    <EmptyState
      variant="progress"
      icon="flame-outline"
      title="No progress yet"
      description="Complete your first workout to start building your streak"
    />
  );
}

export function NoHistoryEmpty() {
  return (
    <EmptyState
      variant="history"
      title="No history yet"
      description="Your workout history will appear here after you complete sessions"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22
  },
  button: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
});

export default EmptyState;
