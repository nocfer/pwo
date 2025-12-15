import { theme } from "@/theme/theme";
import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { AnimatedCard } from "../common";

export type StepCardProps = {
  title: string;
  active?: boolean;
  done?: boolean;
  locked?: boolean;
  right?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  children?: ReactNode;
  delayMultiplier?: number;
  phaseAccent?: string;
  phaseBg?: string;
};

export function StepCard({
  title,
  active,
  done,
  locked,
  right,
  style,
  children,
  phaseAccent,
  phaseBg,
  delayMultiplier = 0
}: StepCardProps) {
  const containerStyles = [
    styles.card,
    active && {
      ...styles.cardActive,
      backgroundColor: phaseBg,
      borderColor: phaseAccent
    },
    done && styles.cardDone,
    locked && {
      ...styles.cardLocked,
      backgroundColor: phaseBg,
      borderColor: phaseAccent
    },
    style
  ];

  const titleStyles = [
    styles.cardTitle,
    done && styles.cardTitleDone,
    locked && styles.cardTitleLocked
  ];

  return (
    <AnimatedCard delay={100 * delayMultiplier}>
      <View style={containerStyles}>
        <View style={styles.rowBetween}>
          <Text style={titleStyles}>{title}</Text>
          {right}
        </View>
        {children}
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  cardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight
  },
  cardDone: {
    borderColor: theme.colors.phases.done,
    backgroundColor: theme.colors.phases.doneBg,
    opacity: 0.75
  },
  cardLocked: {
    opacity: 0.4,
    ...theme.shadows.sm
  },
  cardTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  cardTitleDone: {
    color: theme.colors.success
  },
  cardTitleLocked: {
    color: theme.colors.muted
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  }
});

export default StepCard;
