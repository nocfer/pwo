import { getTodayIndex } from "@/lib/utils/date";
import { theme } from "@/theme/theme";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type WeeklyChartProps = {
  data: number[];
  maxValue?: number;
  title?: string;
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyChart({
  data,
  maxValue,
  title = "Last 7 days"
}: WeeklyChartProps) {
  const todayIndex = getTodayIndex();

  const { shiftedData, shiftedDays } = useMemo(() => {
    const paddedData = [...data];
    while (paddedData.length < 7) {
      paddedData.unshift(0);
    }

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
  const max = maxValue || Math.max(...shiftedData, 1);

  useEffect(() => {
    const animations = shiftedData.map((value, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: value / max,
        duration: 500,
        delay: index * 60,
        useNativeDriver: false
      });
    });
    Animated.parallel(animations).start();
  }, [shiftedData, max, animatedValues]);

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
          const isToday = index === 6;

          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                {isActive ? (
                  <Animated.View
                    style={[
                      styles.bar,
                      { height, backgroundColor: theme.colors.primary }
                    ]}
                  />
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

export function WeeklyChartCompact({ data }: { data: number[] }) {
  const todayIndex = getTodayIndex();

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
                <View
                  style={[
                    styles.compactBar,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: theme.colors.success
                    }
                  ]}
                />
              ) : (
                <View style={styles.compactBarEmpty} />
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
    padding: theme.spacing.lg,
    ...theme.shadows.sm
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
    height: 28,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing.lg
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100
  },
  barContainer: {
    flex: 1,
    alignItems: "center"
  },
  barWrapper: {
    width: 20,
    height: 70,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xs,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  bar: {
    width: "100%",
    borderRadius: theme.radius.xs
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
    fontSize: 10
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
  compactContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 36,
    gap: 3
  },
  compactBarContainer: {
    flex: 1,
    height: "100%"
  },
  compactBarWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  compactBar: {
    width: "100%",
    borderRadius: 3,
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
