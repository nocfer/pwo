import { getTodayIndex } from "@/lib/utils/date";
import { theme } from "@/theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type WeeklyChartProps = {
  data: number[]; // 7 values representing each day (0-1 scale or counts)
  maxValue?: number;
  title?: string;
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyChart({
  data,
  maxValue,
  title = "Last 7 days"
}: WeeklyChartProps) {
  const todayIndex = getTodayIndex(); // 0=Mon, 6=Sun

  // Shift data and labels so today is rightmost (position 6)
  const { shiftedData, shiftedDays } = useMemo(() => {
    // Pad data to 7 if needed
    const paddedData = [...data];
    while (paddedData.length < 7) {
      paddedData.unshift(0);
    }

    // For position i, the day index is (todayIndex + i + 1) % 7
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex + i + 1) % 7;
      return ALL_DAYS[dayIndex];
    });

    const shifted = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex + i + 1) % 7;
      return paddedData[dayIndex] ?? 0;
    });

    return { shiftedData: shifted, shiftedDays: days };
  }, [data, todayIndex]);

  const animatedValues = useRef(
    shiftedData.map(() => new Animated.Value(0))
  ).current;

  // Calculate max value for scaling
  const max = maxValue || Math.max(...shiftedData, 1);

  useEffect(() => {
    // Animate bars on mount
    const animations = shiftedData.map((value, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: value / max,
        duration: 600,
        delay: index * 80,
        useNativeDriver: false
      });
    });

    Animated.parallel(animations).start();
  }, [shiftedData, max, animatedValues]);

  // Calculate total and average
  const total = shiftedData.reduce((sum, val) => sum + val, 0);
  const activeDays = shiftedData.filter((v) => v > 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{activeDays}</Text>
            <Text style={styles.statLabel}>active days</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {shiftedData.map((value, index) => {
          const height = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"]
          });

          const isActive = value > 0;
          const isToday = index === 6; // Rightmost position is always today

          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                {isActive ? (
                  <Animated.View style={[styles.bar, { height }]}>
                    <LinearGradient
                      colors={[
                        theme.colors.gradient.primaryStart,
                        theme.colors.gradient.primaryEnd
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.barGradient}
                    />
                  </Animated.View>
                ) : (
                  <View style={styles.barEmpty} />
                )}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {shiftedDays[index]}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Compact version for smaller spaces
export function WeeklyChartCompact({ data }: { data: number[] }) {
  const todayIndex = getTodayIndex();

  // Shift data so today is rightmost
  const shiftedData = useMemo(() => {
    const paddedData = [...data];
    while (paddedData.length < 7) {
      paddedData.unshift(0);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (todayIndex + i + 1) % 7;
      return paddedData[dayIndex] ?? 0;
    });
  }, [data, todayIndex]);

  const max = Math.max(...shiftedData, 1);

  return (
    <View style={styles.compactContainer}>
      {shiftedData.map((value, index) => {
        const heightPercent = (value / max) * 100;
        const isActive = value > 0;

        return (
          <View key={index} style={styles.compactBarContainer}>
            <View style={styles.compactBarWrapper}>
              {isActive ? (
                <LinearGradient
                  colors={[
                    theme.colors.gradient.successStart,
                    theme.colors.gradient.successEnd
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.compactBar, { height: `${heightPercent}%` }]}
                />
              ) : (
                <View style={[styles.compactBarEmpty]} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  header: {
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  stat: {
    alignItems: "center"
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120
  },
  barContainer: {
    flex: 1,
    alignItems: "center"
  },
  barWrapper: {
    width: 24,
    height: 80,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  bar: {
    width: "100%",
    borderRadius: theme.radius.sm,
    overflow: "hidden"
  },
  barGradient: {
    flex: 1
  },
  barEmpty: {
    width: "100%",
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontSize: 11
  },
  dayLabelToday: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 40,
    gap: 4
  },
  compactBarContainer: {
    flex: 1,
    height: "100%"
  },
  compactBarWrapper: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  compactBar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4
  },
  compactBarEmpty: {
    width: "100%",
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2
  }
});

export default WeeklyChart;
