import { theme } from "@/theme/theme";
import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export type StepCardProps = {
  title: string;
  active?: boolean;
  done?: boolean;
  locked?: boolean;
  right?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  children?: ReactNode;
};

export function StepCard({ title, active, done, locked, right, style, children }: StepCardProps) {
  const containerStyles = [
    styles.card,
    active && styles.cardActive,
    done && styles.cardDone,
    locked && styles.cardLocked,
    style,
  ];
  const titleStyles = [
    styles.cardTitle,
    done && styles.cardTitleDone,
    locked && styles.cardTitleLocked,
  ];

  return (
    <View style={containerStyles}>
      <View style={styles.rowBetween}>
        <Text style={titleStyles}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardDone: {
    borderColor: theme.colors.phases.done,
    backgroundColor: theme.colors.phases.doneBg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.phases.done,
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  cardTitleDone: {
    color: theme.colors.success,
  },
  cardTitleLocked: {
    color: theme.colors.muted,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default StepCard;
