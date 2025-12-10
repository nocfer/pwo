import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
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
    gradientColors: [theme.colors.gradient.primaryStart, theme.colors.gradient.primaryEnd] as const,
  },
  search: {
    icon: "search-outline" as const,
    gradientColors: [theme.colors.muted, theme.colors.subtext] as const,
  },
  progress: {
    icon: "trending-up-outline" as const,
    gradientColors: [theme.colors.gradient.successStart, theme.colors.gradient.successEnd] as const,
  },
  history: {
    icon: "time-outline" as const,
    gradientColors: [theme.colors.gradient.warmStart, theme.colors.gradient.warmEnd] as const,
  },
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  style,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const iconName = icon || config.icon;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={config.gradientColors as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={iconName} size={32} color="#FFFFFF" />
      </LinearGradient>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Pre-built empty states
export function NoRoutinesEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      variant="default"
      title="No routines yet"
      description="Create your first workout routine to get started on your fitness journey"
      actionLabel={onAction ? "Create Routine" : undefined}
      onAction={onAction}
    />
  );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find any routines matching "${query}". Try a different search term.`}
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
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
});

export default EmptyState;
