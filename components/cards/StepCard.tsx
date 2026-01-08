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
  // Determine card state styling
  const getContainerStyle = () => {
    if (done) {
      return [styles.card, styles.cardDone, style];
    }
    if (active) {
      return [
        styles.card,
        styles.cardActive,
        { borderLeftColor: phaseAccent },
        style
      ];
    }
    if (locked) {
      return [styles.card, styles.cardLocked, style];
    }
    return [styles.card, style];
  };

  const getTitleStyle = () => {
    if (done) return [styles.cardTitle, styles.cardTitleDone];
    if (locked) return [styles.cardTitle, styles.cardTitleLocked];
    if (active) return [styles.cardTitle, styles.cardTitleActive];
    return [styles.cardTitle];
  };

  return (
    <AnimatedCard delay={60 * delayMultiplier}>
      <View style={getContainerStyle()}>
        <View style={styles.rowBetween}>
          <View style={styles.titleContainer}>
            <Text style={getTitleStyle()} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {right && <View style={styles.rightContainer}>{right}</View>}
        </View>
        {children && <View style={styles.childrenContainer}>{children}</View>}
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: "transparent"
  },
  cardActive: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 3,
    ...theme.shadows.sm
  },
  cardDone: {
    backgroundColor: theme.colors.background,
    opacity: 0.7
  },
  cardLocked: {
    backgroundColor: theme.colors.background,
    opacity: 0.5
  },
  cardTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  cardTitleActive: {
    color: theme.colors.text
  },
  cardTitleDone: {
    color: theme.colors.success,
    textDecorationLine: "line-through"
  },
  cardTitleLocked: {
    color: theme.colors.muted
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm
  },
  rightContainer: {
    flexShrink: 0
  },
  childrenContainer: {
    marginTop: theme.spacing.xs
  }
});

export default StepCard;
